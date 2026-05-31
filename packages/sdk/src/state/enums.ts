// Device IDs as advertised by the OTA endpoint
// (api-front.dwarflabapp.com/api-front/v1/version/firmware/up-version-ex).
// Verified May 2026 by probing deviceId 0-8: only 1-4 returned firmware.
// Older SDK builds had Bilbo/DWARF4/Dragon entries — those are not real.
export enum DeviceType {
  DWARF2 = 1,
  DWARF3 = 2,
  DWARF3B = 3, // a.k.a. DWARF 3 Plus, firmware filename prefix "d3b"
  DWARF_MINI = 4,
}

export enum CaptureState {
  IDLE = 0,
  PHOTOGRAPHING = 1,
  RECORDING = 2,
  TIMELAPSE = 3,
  BURST = 4,
  PANORAMA = 5,
  LIVE_STACKING = 6,
  CAPTURE_DARK = 7,
}

export enum MotorState {
  IDLE = 0,
  RUNNING = 1,
  CALIBRATING = 2,
  GOTO = 3,
  TRACKING = 4,
  SENTRY = 5,
}

export enum EQModeState {
  IDLE = 0,
  SOLVING = 1,
  SOLVED = 2,
  FAILED = 3,
}

export enum SolarModeType {
  NONE = 0,
  SUN = 1,
  MOON = 2,
}

export enum ShootingMode {
  PHOTO = 0,
  VIDEO = 1,
  ASTRO = 2,
  PANORAMA = 3,
}

/**
 * Shooting *technique* — the value passed to `switchShootingTech` (cmd 16403,
 * `ReqSwitchShootingTech{tech}`). This is **orthogonal** to {@link ShootingMode}
 * (the scene, cmd 16402): mode is NORMAL/DSO/etc., tech is the capture method.
 * The shutter-button action dispatches on the current technique.
 *
 * Technique & burst (verified live): for BURST the device MUST be in `BURST`
 * tech before `startBurst`, or cmd 10003/12023 is rejected with
 * `code:-1 PARSE_PROTOBUF_ERROR` (a generic not-in-tech rejection, independent
 * of the request body). Sequence:
 * `taskCenter.switchShootingTech(ShootingTech.BURST)` → confirm via its reply
 * `ResSwitchShootingTech{shootingTechId===3}` (or the
 * NOTIFY_*_SHOOTING_TECH_STATE 15269/15271) → `startBurst()`.
 * (Live stacking's 11005 works WITHOUT an explicit tech-switch, so this
 * mandatory-switch behavior is observed specifically for burst — treat per-feature.)
 */
export enum ShootingTech {
  SINGLE_SHOT = 1,
  STACKING = 2,
  BURST = 3,
  VIDEO = 4,
  TIMELAPSE = 5,
  PANORAMA = 6,
}

/**
 * Live-stacking lifecycle state, as reported by the device in the `state`
 * field of NOTIFY_STATE_CAPTURE_RAW_LIVE_STACKING (15208, tele) and
 * NOTIFY_STATE_WIDE_CAPTURE_RAW_LIVE_STACKING (15236, wide).
 *
 * Values mirror the generated `dwarflab.notify.OperationState` proto enum
 * exactly (verified against src/generated/proto.d.ts):
 *   OPERATION_STATE_IDLE     = 0
 *   OPERATION_STATE_RUNNING  = 1
 *   OPERATION_STATE_STOPPING = 2
 *   OPERATION_STATE_STOPPED  = 3
 *
 * Semantics:
 *  - IDLE: no stacking job active (also the resting state before start and
 *    after a job is fully torn down).
 *  - RUNNING: a job is active and frames are accumulating.
 *  - STOPPING: a slow-stop is in progress (queued frames being flushed); the
 *    device will transition to STOPPED when done. Fast-stop usually skips
 *    straight to STOPPED/IDLE.
 *  - STOPPED: the job has ended (whether via slow-stop, fast-stop, completion,
 *    or failure). The proto enum does not distinguish success from failure at
 *    this layer — outcome detail comes from the 15209 progress stream and the
 *    file written to disk, not from this state value.
 */
export enum LiveStackingState {
  IDLE = 0,
  RUNNING = 1,
  STOPPING = 2,
  STOPPED = 3,
}

const LIVE_STACKING_STATE_LABELS: Record<number, string> = {
  [LiveStackingState.IDLE]: 'idle',
  [LiveStackingState.RUNNING]: 'running',
  [LiveStackingState.STOPPING]: 'stopping',
  [LiveStackingState.STOPPED]: 'stopped',
};

/**
 * Turn the raw integer `state` from a 15208/15236 notification into a stable,
 * human-readable label. Returns `unknown(<n>)` for any value the firmware
 * sends that isn't in the proto enum, so callers never crash on a new code.
 */
export function describeLiveStackingState(state: number | null | undefined): string {
  if (state == null) return 'unknown';
  return LIVE_STACKING_STATE_LABELS[state] ?? `unknown(${state})`;
}

/** True when the device reports an actively-running stacking job. */
export function isLiveStackingActive(state: number | null | undefined): boolean {
  return state === LiveStackingState.RUNNING || state === LiveStackingState.STOPPING;
}

/**
 * Burst-photo lifecycle state, as reported by the device in the `state` field
 * of NOTIFY_BURST_STATE (15274 → `notify.BurstState{state, cameraType}`).
 *
 * `BurstState.state` does NOT use a burst-specific enum — it **reuses the
 * shared `dwarflab.notify.OperationState` enum**, the same one live-stacking
 * uses. So the integer values are identical to {@link LiveStackingState}:
 *   OPERATION_STATE_IDLE     = 0
 *   OPERATION_STATE_RUNNING  = 1
 *   OPERATION_STATE_STOPPING = 2
 *   OPERATION_STATE_STOPPED  = 3
 *
 * Wire-type note: `state` is a proto3 **enum** (field 1) → encoded as a
 * **varint** carrying the int value (0..3); protobufjs surfaces it as a plain
 * `number`. There is NO int64/Long anywhere here — do not confuse this with the
 * packed-int64 paramId trap (see src/utils/param-id.ts), which is a separate
 * mechanism that does not apply to burst state.
 *
 * The official app maps these to its capture UI states:
 *   RUNNING(1)  → "taking burst"
 *   STOPPING(2) → "burst stopping"
 *   STOPPED(3) / IDLE(0) → idle
 *
 * Semantics:
 *  - IDLE: no burst active (resting state before start and after teardown).
 *  - RUNNING: the burst is shooting (`BurstTaking`).
 *  - STOPPING: a stop was requested and the burst is winding down
 *    (`BurstStopping`). NOTE: QA's live trace showed 15274 firing only
 *    `{state:1}` (RUNNING) once at start and `{}` (=state 0, IDLE) once at end —
 *    STOPPING wasn't observed for a normal self-completing burst, but the value
 *    is in the enum for early-cancel / completeness.
 *  - STOPPED/IDLE: the burst has ended (self-completed at N, or early cancel).
 *    The terminal 15274 is the empty `{}` (= state 0) — proto3 omits the zero,
 *    so `{}` IS the "done/idle" signal, not an undecoded payload.
 *
 * NOTE on count/progress semantics (verified live):
 * Burst is a BOUNDED N-shot op that **self-stops** at N (N = the device-side
 * `BURST_COUNT` param, paramId 21) — it is NOT continuous, and the consumer does
 * NOT need to issue stopBurst for normal completion. Progress is on the wire
 * (Model B): 15285 `BurstProgress` carries a REAL `totalCount` (=N) and a
 * monotonic `completedCount` 1→N, so NO client-side accumulator is needed — trust
 * the wire. This enum answers "is a burst active?" — use `isBurstActive` to clear
 * progress UI on the terminal `{}` transition (covers self-completion AND cancel).
 */
export enum BurstState {
  IDLE = 0,
  RUNNING = 1,
  STOPPING = 2,
  STOPPED = 3,
}

const BURST_STATE_LABELS: Record<number, string> = {
  [BurstState.IDLE]: 'idle',
  [BurstState.RUNNING]: 'running',
  [BurstState.STOPPING]: 'stopping',
  [BurstState.STOPPED]: 'stopped',
};

/**
 * Turn the raw integer `state` from a 15274 NOTIFY_BURST_STATE notification
 * into a stable, human-readable label. Returns `unknown(<n>)` for any value
 * the firmware sends that isn't in the OperationState enum, so callers never
 * crash on an unexpected code.
 */
export function describeBurstState(state: number | null | undefined): string {
  if (state == null) return 'unknown';
  return BURST_STATE_LABELS[state] ?? `unknown(${state})`;
}

/**
 * True while a burst is active — RUNNING (shooting) or STOPPING (winding down).
 * False for IDLE/STOPPED. Consumers should clear burst progress UI (e.g. the
 * shutter ring) when this returns false, independent of any client-side
 * shot-counter, so a user-stopped or firmware-ended burst clears cleanly.
 * Mirrors {@link isLiveStackingActive} so burst and stacking share identical
 * active-vs-terminal logic.
 */
export function isBurstActive(state: number | null | undefined): boolean {
  return state === BurstState.RUNNING || state === BurstState.STOPPING;
}
