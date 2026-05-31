/**
 * Pack/unpack the int64 `paramId` field used by PARAM_SET_GENERAL_INT_PARAM,
 * PARAM_SET_EXPOSURE, etc. The firmware silently ignores requests whose
 * paramId doesn't decode to a known (mode, section, camera, param) tuple.
 *
 * Layout:
 *   bits 56..63 : modeId    (8-bit, e.g. 1=Normal, 2=DSO, 4=Milky Way)
 *   bits 48..55 : sectionId (8-bit; general int params are section 1)
 *   bits 44..47 : cameraId  (4-bit, 0=tele, 1=wide)
 *   bits 16..43 : reserved  (28-bit, usually 0)
 *   bits  0..15 : paramId   (16-bit, e.g. 13=filterType)
 *
 * Verified live against firmware v1.5.0.1 via
 * POST /shootingMode/getParamAndSetting and a byte-level varint roundtrip.
 *
 * Returns a protobufjs-compatible `Long` ({low, high, unsigned}).
 * Decimal strings can't be used: protobufjs internally coerces them to JS
 * Number when encoding, which truncates the low ~3 decimal digits of a 17+
 * digit packed paramId and produces a varint the firmware silently rejects.
 */
import Long from 'long';
// Wire up the Long library globally for protobufjs. Without this, int64 fields
// are decoded into JS Numbers, which silently round 17-digit packed paramIds
// to a different value (so the receiver thinks paramId=18 when device sent 13).
// Doing it here (param-id.ts) guarantees it runs before any decode happens —
// it's imported by codec.ts indirectly via the public re-export.
import * as $protobuf from 'protobufjs/minimal.js';
const pb = $protobuf as unknown as { util: { Long: unknown }; configure: () => void };
pb.util.Long = Long;
pb.configure();

export interface ParamIdTree {
  modeId: number;
  sectionId: number;
  cameraId: number;
  reserved?: number;
  paramId: number;
}

/** Returns a `Long` instance suitable for protobufjs int64 fields. */
export function packParamId(tree: ParamIdTree): Long {
  // Build high/low halves directly. Layout:
  //   high (bits 32..63) = (modeId<<24) | (sectionId<<16) | (cameraId<<12) | (reservedHi)
  //   low  (bits  0..31) = (reservedLo<<16) | paramId
  // where reserved is split across the 32-bit boundary at bit 32.
  const modeId    = tree.modeId    & 0xff;
  const sectionId = tree.sectionId & 0xff;
  const cameraId  = tree.cameraId  & 0xf;
  const reserved  = (tree.reserved ?? 0) & 0x0fff_ffff;
  const paramId   = tree.paramId   & 0xffff;

  // reserved is 28-bit and lives at bits 16..43.
  // Bits 16..31 go into low; bits 32..43 go into high.
  const reservedLo = reserved & 0xffff;            // bits 16..31 of the int64
  const reservedHi = (reserved >>> 16) & 0x0fff;   // bits 32..43

  const low  = ((reservedLo & 0xffff) << 16) | (paramId & 0xffff);
  const high = ((modeId & 0xff) << 24) | ((sectionId & 0xff) << 16) | ((cameraId & 0xf) << 12) | reservedHi;
  return new Long(low | 0, high | 0, false);
}

export function unpackParamId(packed: Long | bigint | string | number): ParamIdTree {
  let v: bigint;
  if (typeof packed === 'bigint') v = packed;
  else if (typeof packed === 'string' || typeof packed === 'number') v = BigInt(packed);
  else v = BigInt(packed.toString()); // Long
  return {
    modeId: Number((v >> 56n) & 0xffn),
    sectionId: Number((v >> 48n) & 0xffn),
    cameraId: Number((v >> 44n) & 0xfn),
    reserved: Number((v >> 16n) & 0x0fff_ffffn),
    paramId: Number(v & 0xffffn),
  };
}

/**
 * Known section IDs (sectionId byte). Verified live on v1.5.0.1 — all the
 * camera "general int params" (brightness, contrast, filter, resolution,
 * sharpness, etc.) live under section 1.
 */
export const ParamSection = {
  GENERAL: 1,
} as const;

/**
 * Known camera IDs (cameraId nibble).
 */
export const ParamCamera = {
  TELE: 0,
  WIDE: 1,
} as const;
