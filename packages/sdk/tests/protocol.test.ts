import { describe, it, expect } from 'vitest';
import {
  ModuleId,
  cmdToModule,
  Command,
  MessageType,
  ErrorCode,
  getErrorMessage,
  encodePacket,
  decodePacket,
  encodePayload,
  decodeResponse,
  getRequestType,
  getResponseType,
  BurstState,
  describeBurstState,
  isBurstActive,
  ShootingTech,
  packParamId,
  shotsToBurstGearIndex,
} from '../src/index.js';

describe('modules', () => {
  it('maps camera tele commands to CAMERA_TELE module', () => {
    expect(cmdToModule(10000)).toBe(ModuleId.CAMERA_TELE);
    expect(cmdToModule(10050)).toBe(ModuleId.CAMERA_TELE);
  });

  it('maps astro commands to ASTRO module', () => {
    expect(cmdToModule(11000)).toBe(ModuleId.ASTRO);
    expect(cmdToModule(11048)).toBe(ModuleId.ASTRO);
  });

  it('maps camera wide commands to CAMERA_WIDE module', () => {
    expect(cmdToModule(12000)).toBe(ModuleId.CAMERA_WIDE);
    expect(cmdToModule(12036)).toBe(ModuleId.CAMERA_WIDE);
  });

  it('maps system commands correctly', () => {
    expect(cmdToModule(13000)).toBe(ModuleId.SYSTEM);
  });

  it('maps RGB power commands correctly', () => {
    expect(cmdToModule(13500)).toBe(ModuleId.RGB_POWER);
  });

  it('maps motor commands correctly', () => {
    expect(cmdToModule(14000)).toBe(ModuleId.MOTOR);
  });

  it('maps track commands correctly', () => {
    expect(cmdToModule(14800)).toBe(ModuleId.TRACK);
  });

  it('maps focus commands correctly', () => {
    expect(cmdToModule(15000)).toBe(ModuleId.FOCUS);
  });

  it('maps notify commands correctly', () => {
    expect(cmdToModule(15200)).toBe(ModuleId.NOTIFY);
    expect(cmdToModule(15299)).toBe(ModuleId.NOTIFY);
  });

  it('maps panorama commands correctly', () => {
    expect(cmdToModule(15500)).toBe(ModuleId.PANORAMA);
  });

  it('maps schedule commands correctly', () => {
    expect(cmdToModule(16100)).toBe(ModuleId.SHOOTING_SCHEDULE);
  });

  it('maps task center commands correctly', () => {
    expect(cmdToModule(16400)).toBe(ModuleId.TASK_CENTER);
  });

  it('maps param commands correctly', () => {
    expect(cmdToModule(16700)).toBe(ModuleId.PARAM);
  });

  it('returns NONE for unknown commands', () => {
    expect(cmdToModule(99999)).toBe(ModuleId.NONE);
    expect(cmdToModule(0)).toBe(ModuleId.NONE);
  });
});

describe('error codes', () => {
  it('returns message for known error code', () => {
    expect(getErrorMessage(0)).toBe('Success');
    expect(getErrorMessage(-11504)).toBe('Calibration failed');
  });

  it('returns generic message for unknown error code', () => {
    expect(getErrorMessage(-99999)).toContain('Unknown error');
  });
});

describe('packet encode/decode', () => {
  it('roundtrips a packet', () => {
    const payload = new Uint8Array([1, 2, 3]);
    const encoded = encodePacket(
      Command.CAMERA_TELE_OPEN_CAMERA,
      MessageType.REQUEST,
      payload,
      'test-client',
    );

    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodePacket(encoded);
    expect(decoded.cmd).toBe(Command.CAMERA_TELE_OPEN_CAMERA);
    expect(decoded.type).toBe(MessageType.REQUEST);
    expect(decoded.clientId).toBe('test-client');
    expect(decoded.moduleId).toBe(ModuleId.CAMERA_TELE);
    expect(new Uint8Array(decoded.data)).toEqual(payload);
  });
});

describe('codec', () => {
  it('encodes a calibration request', () => {
    const payload = encodePayload(Command.ASTRO_START_CALIBRATION, {
      lon: -122.4,
      lat: 37.7,
    });
    expect(payload).toBeInstanceOf(Uint8Array);
    expect(payload.length).toBeGreaterThan(0);
  });

  it('decodes a calibration request roundtrip', () => {
    const payload = encodePayload(Command.ASTRO_START_CALIBRATION, {
      lon: -122.4,
      lat: 37.7,
    });
    // Decode using the request type since we encoded as a request
    const reqType = getRequestType(Command.ASTRO_START_CALIBRATION)!;
    const decoded = reqType.decode(payload) as {
      lon: number;
      lat: number;
    };
    expect(decoded.lon).toBeCloseTo(-122.4);
    expect(decoded.lat).toBeCloseTo(37.7);
  });

  it('returns an empty payload for unregistered commands', () => {
    // Commands without a proto request type (e.g. no-arg commands like
    // CAMERA_TELE_OPEN_CAMERA) intentionally encode to an empty payload rather
    // than throwing — the firmware accepts those bare. This behavior is
    // load-bearing, so assert it explicitly.
    const payload = encodePayload(99999 as Command, {});
    expect(payload).toBeInstanceOf(Uint8Array);
    expect(payload.length).toBe(0);
  });
});

describe('burst codec', () => {
  // The 15208 stacking bug was an UNREGISTERED codec: the notif arrived as raw
  // bytes because no proto type was mapped to it. These tests assert the burst
  // codecs are actually wired and roundtrip, so a regression that drops a
  // registration (or renames a field — protobufjs silently drops unknowns) is
  // caught here rather than in the field on a live device.

  it('encodes ReqBurstPhoto with only the count field (tele + wide)', () => {
    for (const cmd of [Command.CAMERA_TELE_BURST, Command.CAMERA_WIDE_BURST]) {
      const payload = encodePayload(cmd, { count: 5 });
      expect(payload).toBeInstanceOf(Uint8Array);
      expect(payload.length).toBeGreaterThan(0);
      const reqType = getRequestType(cmd)!;
      const decoded = reqType.decode(payload) as { count: number };
      expect(decoded.count).toBe(5);
    }
  });

  it('drops unknown fields on ReqBurstPhoto (count is the only wire field)', () => {
    // proto: message ReqBurstPhoto { int32 count = 1; } — nothing else.
    // Sending a bogus field must NOT appear on the wire; this documents that
    // protobufjs silently ignores it (the trap that wedged stacking).
    const payload = encodePayload(Command.CAMERA_TELE_BURST, {
      count: 3,
      interval: 999, // not in the proto
    });
    const decoded = getRequestType(Command.CAMERA_TELE_BURST)!.decode(payload) as Record<
      string,
      unknown
    >;
    expect(decoded.count).toBe(3);
    expect(decoded.interval).toBeUndefined();
  });

  it('distinguishes omitted-count (empty) from count:0 (08 00) from count:N', () => {
    // startBurst() omits count → {} → empty payload. But {count:0} encodes to
    // `08 00` (protobufjs writes an explicit 0), which is NOT the same as empty —
    // a real trap. This locks the distinction so a future "default count"
    // regression can't silently send a non-empty body when an empty one is intended.
    const omitted = encodePayload(Command.CAMERA_TELE_BURST, {});
    const zero = encodePayload(Command.CAMERA_TELE_BURST, { count: 0 });
    const five = encodePayload(Command.CAMERA_TELE_BURST, { count: 5 });
    expect(omitted.length).toBe(0); // empty body
    expect(Array.from(zero)).toEqual([0x08, 0x00]); // explicit 0 → 2-byte body, NOT empty
    expect(Array.from(five)).toEqual([0x08, 0x05]);
  });

  it('encodes ReqStopBurstPhoto as an empty payload (no args)', () => {
    // proto: message ReqStopBurstPhoto {} — registered, so encoding is via the
    // proto type (length 0), not the bare-fallback path.
    for (const cmd of [Command.CAMERA_TELE_STOP_BURST, Command.CAMERA_WIDE_STOP_BURST]) {
      expect(getRequestType(cmd)).toBeDefined();
      const payload = encodePayload(cmd, {});
      expect(payload).toBeInstanceOf(Uint8Array);
      expect(payload.length).toBe(0);
    }
  });

  it('decodes BurstProgress notifications (15218 / 15220 / 15285)', () => {
    for (const cmd of [
      Command.NOTIFY_TELE_BURST_PROGRESS,
      Command.NOTIFY_WIDE_BURST_PROGRESS,
      Command.NOTIFY_BURST_PROGRESS,
    ]) {
      const resType = getResponseType(cmd);
      expect(resType, `codec missing for ${Command[cmd]}`).toBeDefined();
      // Roundtrip a representative progress shape (totalCount=N, monotonic
      // completedCount) to prove the codec is wired and field names match.
      const buf = resType!.encode({ totalCount: 3, completedCount: 2, cameraType: 0 }).finish();
      const decoded = resType!.decode(buf) as {
        totalCount: number;
        completedCount: number;
        cameraType: number;
      };
      expect(decoded.completedCount).toBe(2);
      expect(decoded.totalCount).toBe(3);
      expect(decoded.cameraType).toBe(0);
    }
  });

  it('decodes BurstState notifications (15274)', () => {
    const resType = getResponseType(Command.NOTIFY_BURST_STATE);
    expect(resType).toBeDefined();
    const buf = resType!.encode({ state: 1, cameraType: 0 }).finish();
    const decoded = resType!.decode(buf) as { state: number; cameraType: number };
    expect(decoded.state).toBe(1);
    expect(decoded.cameraType).toBe(0);
  });
});

describe('burst state enum', () => {
  // BurstState.state reuses the shared OperationState enum
  // (IDLE=0/RUNNING=1/STOPPING=2/STOPPED=3) — same values as LiveStackingState.
  it('maps OperationState integers to the BurstState enum', () => {
    expect(BurstState.IDLE).toBe(0);
    expect(BurstState.RUNNING).toBe(1);
    expect(BurstState.STOPPING).toBe(2);
    expect(BurstState.STOPPED).toBe(3);
  });

  it('describes known states and falls back gracefully', () => {
    expect(describeBurstState(BurstState.IDLE)).toBe('idle');
    expect(describeBurstState(BurstState.RUNNING)).toBe('running');
    expect(describeBurstState(BurstState.STOPPING)).toBe('stopping');
    expect(describeBurstState(BurstState.STOPPED)).toBe('stopped');
    // Never crash on an unexpected firmware code or null.
    expect(describeBurstState(99)).toBe('unknown(99)');
    expect(describeBurstState(null)).toBe('unknown');
    expect(describeBurstState(undefined)).toBe('unknown');
  });

  it('reports active for RUNNING and STOPPING only', () => {
    // RUNNING (BurstTaking) and STOPPING (BurstStopping) are active; the ring
    // stays up during a graceful stop and clears on idle/stopped. This is the
    // bug-fix the viewer needs for stuck progress rings on early/user stops.
    expect(isBurstActive(BurstState.RUNNING)).toBe(true);
    expect(isBurstActive(BurstState.STOPPING)).toBe(true);
    expect(isBurstActive(BurstState.IDLE)).toBe(false);
    expect(isBurstActive(BurstState.STOPPED)).toBe(false);
    expect(isBurstActive(null)).toBe(false);
    expect(isBurstActive(undefined)).toBe(false);
  });

  it('packs the BURST_COUNT paramId to the verified int64 value', () => {
    // The working packed BURST_COUNT id for tele (Normal mode) is
    // 72339069014638613 = packParamId({modeId:1, sectionId:1, cameraId:0, paramId:21}).
    // setBurstCount must produce exactly this (raw 21 is silently rejected by the
    // firmware — the packed-int64 paramId trap). Lock it so a packing regression
    // can't silently send a value the device ignores.
    const tele = packParamId({ modeId: 1, sectionId: 1, cameraId: 0, paramId: 21 });
    expect(tele.toString()).toBe('72339069014638613');
    // Wide differs only in the cameraId nibble (1), so it must NOT equal tele.
    const wide = packParamId({ modeId: 1, sectionId: 1, cameraId: 1, paramId: 21 });
    expect(wide.toString()).not.toBe(tele.toString());
  });

  it('maps shot counts to BURST_COUNT gear indices (not literal counts)', () => {
    // ★ BURST_COUNT is a GEAR INDEX, not a literal shot count.
    // setBurstCount(5) must write gear 3, NOT 5. Lock the config-derived mapping so
    // a regression can't silently send a literal count (selects the wrong gear).
    expect(shotsToBurstGearIndex(3)).toBe(0);
    expect(shotsToBurstGearIndex(5)).toBe(3);
    expect(shotsToBurstGearIndex(10)).toBe(6);
    expect(shotsToBurstGearIndex(15)).toBe(9);
    expect(shotsToBurstGearIndex(100)).toBe(36);
    // Non-exact counts snap to the nearest gear (4 → nearest of 3/5; tie rounds down to 3=gear0).
    expect(shotsToBurstGearIndex(4)).toBe(0);
    expect(shotsToBurstGearIndex(6)).toBe(3); // nearest 5
    expect(shotsToBurstGearIndex(9)).toBe(6); // nearest 10
  });

  it('exposes the ShootingTech.BURST precondition value', () => {
    // startBurst is rejected (code:-1) unless the device is in BURST tech first,
    // set via switchShootingTech(3). Lock the value so the precondition doc and
    // any consumer's gating can't silently drift.
    expect(ShootingTech.BURST).toBe(3);
    expect(ShootingTech.STACKING).toBe(2);
    expect(ShootingTech.SINGLE_SHOT).toBe(1);
  });
});
