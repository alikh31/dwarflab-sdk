import { Command } from '../protocol/commands.js';
import { describeLiveStackingState, isLiveStackingActive } from '../state/enums.js';
import type { DwarfClient } from '../client.js';

/** One camera's live-stacking state, normalized for the viewer. */
export interface CameraStackingState {
  /** Raw `OperationState` integer from `captureRawState.state` (0–3). */
  state: number;
  /** Stable label: 'idle' | 'running' | 'stopping' | 'stopped' | 'unknown(<n>)'. */
  label: string;
  /** True when a job is active (RUNNING or STOPPING). */
  active: boolean;
}

/** Normalized result of {@link AstroModule.queryStackingState}. */
export interface StackingStateSnapshot {
  tele: CameraStackingState;
  wide: CameraStackingState;
}

/**
 * Astro operations are multi-step state machines that progress through
 * NOTIFY_STATE_ASTRO_* notifications (15208-15239 range), not via the start
 * command's reply. The reply for a start command is just an immediate ack
 * ({code: 0} on success, error code if the firmware rejects the start
 * outright); the real outcome — success, partial progress, failure —
 * arrives as notifications and may take 5-180 seconds.
 *
 * That means *start* commands use `sendCommandNoWait` (best-effort, returns
 * the ack within 5s or null; doesn't block the IPC handler waiting for the
 * long-running operation to finish). *Stop* commands use `sendCommand`
 * (strict) because they're synchronous and the reply tells us whether the
 * stop actually happened.
 */
export class AstroModule {
  constructor(private readonly client: DwarfClient) {}

  startCalibration(lon: number, lat: number): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.ASTRO_START_CALIBRATION, { lon, lat });
  }

  stopCalibration(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_STOP_CALIBRATION);
  }

  gotoDSO(ra: number, dec: number, targetName?: string): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.ASTRO_START_GOTO_DSO, { ra, dec, targetName });
  }

  gotoSolarSystem(index: number, lon: number, lat: number, targetName?: string): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.ASTRO_START_GOTO_SOLAR_SYSTEM, { index, lon, lat, targetName });
  }

  stopGoto(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_STOP_GOTO);
  }

  /**
   * Start tele live stacking. Only `irIndex` and `forceStart` go on the wire —
   * those are the two fields the firmware actually reads. Sending any other
   * field makes protobufjs drop the payload silently → "started but never
   * progresses".
   *
   * `irIndex` = the device's CURRENT IR-filter index. It rests at **-1** (no
   * explicit filter) and is typically set to **1** or **2** during a GoTo
   * depending on the target. So:
   *   - The caller SHOULD pass the device's actual current filter index when
   *     known — typically 0/1/2.
   *   - The `-1` default is the "no filter selected" resting value and a safe
   *     fallback when the filter index is unknown.
   *
   * `forceStart` defaults to **false** so the firmware's own preflight checks
   * (calibration + GoTo done) fire — defaulting to `true` bypasses those checks
   * and can leave stacking silently wedged. Callers should gate Start on the
   * precondition chain and only pass `forceStart=true` as a deliberate override.
   */
  startLiveStacking(irIndex = -1, forceStart = false): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.ASTRO_START_CAPTURE_RAW_LIVE_STACKING, {
      irIndex,
      forceStart,
    });
  }

  stopLiveStacking(): Promise<unknown> {
    // Slow stop blocks the firmware until queued frames are flushed — can
    // take minutes and our 10 s sendCommand window times out. Use no-wait;
    // the 15208 state notification confirms when the stop actually lands.
    return this.client.sendCommandNoWait(Command.ASTRO_STOP_CAPTURE_RAW_LIVE_STACKING);
  }

  startCaptureDark(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_START_CAPTURE_RAW_DARK);
  }

  stopCaptureDark(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_STOP_CAPTURE_RAW_DARK);
  }

  checkDark(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_CHECK_GOT_DARK);
  }

  goLive(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_GO_LIVE);
  }

  startTrackSpecialTarget(ra: number, dec: number): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_START_TRACK_SPECIAL_TARGET, { ra, dec });
  }

  stopTrackSpecialTarget(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_STOP_TRACK_SPECIAL_TARGET);
  }

  oneClickGotoDSO(ra: number, dec: number, targetName?: string, lon?: number, lat?: number): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_START_ONE_CLICK_GOTO_DSO, { ra, dec, targetName, lon, lat });
  }

  oneClickGotoSolarSystem(index: number, targetName?: string, lon?: number, lat?: number): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_START_ONE_CLICK_GOTO_SOLAR_SYSTEM, { index, targetName, lon, lat });
  }

  stopOneClickGoto(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_STOP_ONE_CLICK_GOTO);
  }

  /**
   * Wide live stacking. Only `forceStart` goes on the wire — there is no
   * irIndex on this variant (`ReqCaptureWideRawLiveStacking` has just that
   * one field).
   */
  startWideLiveStacking(forceStart = false): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.ASTRO_START_WIDE_CAPTURE_LIVE_STACKING, {
      forceStart,
    });
  }

  stopWideLiveStacking(): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.ASTRO_STOP_WIDE_CAPTURE_LIVE_STACKING);
  }

  startEqSolving(lon: number, lat: number): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.ASTRO_START_EQ_SOLVING, { lon, lat });
  }

  stopEqSolving(): Promise<unknown> {
    // Live device: firmware emits NOTIFY_EQ_SOLVING_STATE (15239) on stop
    // but does not send a REPLY for 11019, so strict sendCommand times out
    // after 10s. Use best-effort send; the wizard reads stop confirmation
    // from the 15239 notification.
    return this.client.sendCommandNoWait(Command.ASTRO_STOP_EQ_SOLVING);
  }

  startAiEnhance(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_START_AI_ENHANCE);
  }

  stopAiEnhance(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_STOP_AI_ENHANCE);
  }

  startMosaic(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_START_TELE_MOSAIC, params);
  }

  startSkyTargetFinder(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_START_SKY_TARGET_FINDER, params);
  }

  stopSkyTargetFinder(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_STOP_SKY_TARGET_FINDER);
  }

  fastStopLiveStacking(): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.ASTRO_FAST_STOP_CAPTURE_RAW_LIVE_STACKING);
  }

  fastStopWideLiveStacking(): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.ASTRO_FAST_STOP_WIDE_CAPTURE_LIVE_STACKING);
  }

  /**
   * Best-effort recovery from a stuck astro session (the
   * CODE_ASTRO_FUNCTION_BUSY = -11501 condition, where the firmware refuses to
   * start a new stack because a previous operation never cleanly released the
   * shared astro pipeline).
   *
   * The sequence below mirrors the verified unstick path: hard fast-stop both
   * stacking jobs first (11037 tele / 11038 wide — these are the commands shown
   * live to clear a stuck stack), then defensively stop every other astro
   * operation that holds the pipeline (goto, calibration, EQ solving, dark
   * capture). All sub-commands are fire-and-forget: the device confirms via
   * notifications, not replies, and any individual command failing must NOT
   * abort the rest of the recovery. We therefore swallow per-command errors and
   * return a summary of what was issued so the caller can log it.
   *
   * Order matters: fast-stop the stacks before stopping goto/cal so we don't
   * leave a half-flushed stack frame behind a stopped mount.
   */
  async recoverStacking(): Promise<{ issued: string[]; failed: string[] }> {
    const issued: string[] = [];
    const failed: string[] = [];

    const steps: Array<[string, () => Promise<unknown>]> = [
      ['fastStopLiveStacking', () => this.fastStopLiveStacking()],
      ['fastStopWideLiveStacking', () => this.fastStopWideLiveStacking()],
      ['stopGoto', () => this.stopGoto()],
      ['stopCalibration', () => this.stopCalibration()],
      ['stopEqSolving', () => this.stopEqSolving()],
      ['stopCaptureDark', () => this.stopCaptureDark()],
    ];

    for (const [name, fn] of steps) {
      try {
        await fn();
        issued.push(name);
      } catch {
        // Recovery is best-effort: a single stop failing (e.g. the device
        // wasn't in that sub-state) must not prevent the remaining stops.
        failed.push(name);
      }
    }

    return { issued, failed };
  }

  /**
   * Deterministically read the CURRENT live-stacking state for both cameras,
   * for reconnect re-sync (rather than waiting for the firmware to re-push a
   * 15208/15236 notification).
   *
   * There is no stacking-specific GET command. Instead this reads the
   * comprehensive device-state snapshot via cmd 16405
   * (TASK_GET_DEVICE_STATE_INFO → ResGetDeviceStateInfo) and extracts the
   * per-camera `captureRawState`, which carries the live stacking state:
   *
   *   ResGetDeviceStateInfo
   *     .{tele,wide}CameraStateInfo
   *       .exclusiveState        (ExclusiveCameraState)
   *         .captureRawState     (CaptureRawState { state, cameraType })
   *
   * `captureRawState.state` is typed as `notify.OperationState` in the proto
   * (`CaptureRawState { state: .notify.OperationState; camera_type: int32 }`),
   * i.e. the same 0–3 IDLE/RUNNING/STOPPING/STOPPED enum as the 15208/15236
   * notifications. The extra `AstroState` value 4=PLATE_SOLVING does NOT appear
   * here — it lives on the motion-motor path (goto/calibration via
   * `astro_extended_state`), not on the camera capture path. So
   * describeLiveStackingState/isLiveStackingActive (0–3) are exactly right.
   *
   * If a camera's `captureRawState` is absent (no stacking sub-state present),
   * we report it as IDLE (state 0). This is a strict `sendCommand` — the
   * device replies synchronously to 16405 — so the returned promise rejects on
   * a transport error or a negative reply code; the caller should treat that
   * as "could not determine state" and fall back to passive notification
   * tracking.
   */
  async queryStackingState(): Promise<StackingStateSnapshot> {
    const res = (await this.client.taskCenter.getDeviceStateInfo()) as {
      teleCameraStateInfo?: { exclusiveState?: { captureRawState?: { state?: number | null } | null } | null } | null;
      wideCameraStateInfo?: { exclusiveState?: { captureRawState?: { state?: number | null } | null } | null } | null;
    } | null;

    const normalize = (state: number | null | undefined): CameraStackingState => {
      const s = state ?? 0; // absent captureRawState → idle
      return { state: s, label: describeLiveStackingState(s), active: isLiveStackingActive(s) };
    };

    return {
      tele: normalize(res?.teleCameraStateInfo?.exclusiveState?.captureRawState?.state),
      wide: normalize(res?.wideCameraStateInfo?.exclusiveState?.captureRawState?.state),
    };
  }

  getShootingTime(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_GET_ASTRO_SHOOTING_TIME);
  }

  getQuickSetList(): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_GET_QUICK_SET_LIST);
  }

  setQuickSet(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_SET_QUICK_SET, params);
  }

  startOneClickShooting(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.ASTRO_START_ONE_CLICK_SHOOTING, params);
  }
}
