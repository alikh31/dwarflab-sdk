import { Command } from '../protocol/commands.js';
import { packParamId, ParamSection, ParamCamera } from '../utils/param-id.js';
import { shotsToBurstGearIndex } from '../utils/burst-count.js';
import type { DwarfClient } from '../client.js';

/** Raw 16-bit paramId for the BURST_COUNT device param. */
const BURST_COUNT_PARAM_ID = 21;

export class CameraTeleModule {
  constructor(private readonly client: DwarfClient) {}

  openCamera(binning = false, rtspEncodeType = 1): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_OPEN_CAMERA, { binning, rtspEncodeType });
  }

  closeCamera(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_CLOSE_CAMERA);
  }

  takePhoto(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_PHOTOGRAPH);
  }

  /**
   * Start a tele burst (cmd 10003, `ReqBurstPhoto`). Behavior verified live:
   *
   * - **PRECONDITION — must be in `BURST` shooting-tech first.** This is
   *   MANDATORY: cmd 10003 is rejected with `code:-1 PARSE_PROTOBUF_ERROR`
   *   whenever the device is NOT in `ShootingTech.BURST` (a generic not-in-tech
   *   rejection — it does not actually mean the body failed to parse). Sequence:
   *   `taskCenter.switchShootingTech(ShootingTech.BURST)` (confirm via its reply
   *   `ResSwitchShootingTech{shootingTechId===3}`) → `startBurst`. The request
   *   BODY is irrelevant to acceptance — being in BURST tech is the only gate.
   *   Tech is orthogonal to `switchShootingMode` (the scene); the full working
   *   sequence is enterCamera → openCamera → switchShootingMode(NORMAL) →
   *   switchShootingTech(BURST) → startBurst.
   * - **Burst is a BOUNDED N-shot op that SELF-STOPS.** The firmware fires
   *   exactly N shots (N = the device-side `BURST_COUNT` param, paramId 21) then
   *   returns to IDLE on its own — NO `stopBurst` needed for normal completion
   *   (`stopBurst` is only for early cancel).
   * - **Progress is on the wire — trust it.** 15285 `BurstProgress` carries a
   *   REAL `totalCount` (=N) and a monotonic `completedCount` 1→N. No
   *   client-side accumulator is needed. 15274 `BurstState` fires ONCE:
   *   `{state:1}` RUNNING at start, `{}` (=state 0 IDLE) terminal at end. Only
   *   15285 fires (not the per-camera 15218/15220).
   * - `count` is **optional and ignored by the firmware for the shot total**
   *   (the total comes from the `BURST_COUNT` param, echoed as `totalCount`).
   *   Omit it (`startBurst()`) to send an empty `ReqBurstPhoto`; pass a number
   *   for a `{count}` body — but the firmware uses its stored `BURST_COUNT`
   *   regardless. (Don't pass `count: 0` expecting "empty" — protobufjs encodes
   *   an explicit 0 as `08 00`, a 2-byte body; omit the arg for a truly-empty
   *   body. Moot for acceptance, but keeps the wire clean.)
   * - **Mutually exclusive with live-stacking**: burst and stacking occupy the
   *   same firmware `ExclusiveCameraState` oneof slot, so the device can be in
   *   only one at a time. Burst frames do NOT feed the stacking pipeline.
   *   Callers should gate the burst control OFF while any astro/stacking
   *   exclusive state is active (and vice-versa).
   *
   * Reply is a plain boolean ack ("command accepted"), not a notification. The
   * authoritative "burst running/ended" signal is NOTIFY_BURST_STATE (15274) —
   * see {@link BurstState} / {@link isBurstActive}.
   */
  startBurst(count?: number): Promise<unknown> {
    // Omit count → empty ReqBurstPhoto. Pass a number → {count}.
    // NOTE: don't fold these into `{ count }` with a default — protobufjs encodes
    // an explicit 0 as a 2-byte body, and we want a truly-empty body when omitted.
    const params = count === undefined ? {} : { count };
    return this.client.sendCommand(Command.CAMERA_TELE_BURST, params);
  }

  /**
   * Set the number of shots a burst will fire (the `BURST_COUNT` device param,
   * raw paramId 21) for the tele camera. Burst is a bounded N-shot op driven by
   * this param — the firmware fires N then self-stops, and echoes N as
   * `totalCount` on 15285. The message `count` on {@link startBurst} is ignored;
   * THIS is how you change N.
   *
   * Sent via `PARAM_SET_GENERAL_INT_PARAM` (16703) with the int64 paramId
   * PACKED (mode Normal=1, section GENERAL=1, cameraId tele=0, paramId 21) — raw
   * `21` is silently rejected (the packed-int64 paramId trap; see param-id.ts).
   *
   * ★ `count` is a SHOT COUNT but `BURST_COUNT` is a GEAR INDEX: valid shot
   * counts are 3,5,10,15,20,30,…,900, each mapping to a gear index (3→0, 5→3,
   * 10→6, …). This helper maps your desired shot count to the nearest gear index
   * via {@link shotsToBurstGearIndex} and writes THAT — so `setBurstCount(5)`
   * correctly selects gear 3 (="5 shots"), NOT a literal 5.
   *
   * Dispatch: 16703 does NOT return a ComResponse — the firmware confirms via
   * the NOTIFY_GENERAL_INT_PARAM (15264) echo matched on `paramId`. So this uses
   * `sendCommandNoWait` (fire-and-forget by design — strict `sendCommand` would
   * hang waiting for a reply that never comes).
   *
   * ⚠️ WRITE EFFECT UNVERIFIED LIVE: the write is correctly encoded + dispatched,
   * but has not yet been confirmed to change the next burst's N on a live device.
   * Optionally confirm by listening for the 15264 echo, or by reading
   * `totalCount` on the next burst's 15285.
   *
   * @param count desired number of shots (snapped to the nearest supported gear).
   * @param modeId packed-paramId mode byte; defaults to 1 (Normal). Pass another
   *   value if a probe shows burst params under a different mode.
   */
  setBurstCount(count: number, modeId = 1): Promise<unknown> {
    const paramId = packParamId({
      modeId,
      sectionId: ParamSection.GENERAL,
      cameraId: ParamCamera.TELE,
      paramId: BURST_COUNT_PARAM_ID,
    });
    // BURST_COUNT is a gear index, not a literal shot count — map it.
    const gearIndex = shotsToBurstGearIndex(count);
    // No-wait: 16703 has no ComResponse (confirmed via 15264 echo); don't block.
    // paramId is an int64 → pass the Long's decimal string so protobufjs keeps all
    // 17 digits (a JS number would round the low digits — the param-id.ts trap).
    return this.client.sendCommandNoWait(Command.PARAM_SET_GENERAL_INT_PARAM, {
      paramId: paramId.toString(),
      value: gearIndex,
    });
  }

  /**
   * Stop the tele burst (cmd 10004, empty `ReqStopBurstPhoto`). There is only
   * ONE stop command (no fast/slow split like stacking). The **authoritative
   * "burst ended" signal is the 15274 NOTIFY_BURST_STATE transition to
   * STOPPING→STOPPED/IDLE**, not the command reply, so we use
   * `sendCommandNoWait` to avoid hanging on a possibly-late reply and rely on
   * the 15274 transition for confirmation. Consumers should treat resolution of
   * this promise as "stop sent" and watch {@link isBurstActive} on the 15274
   * stream for the real end. Frames already captured before the stop are kept
   * (each shot is an independent file).
   */
  stopBurst(): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.CAMERA_TELE_STOP_BURST);
  }

  startRecord(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_START_RECORD);
  }

  stopRecord(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_STOP_RECORD);
  }

  setExposureMode(mode: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_EXP_MODE, { mode });
  }

  getExposureMode(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_EXP_MODE);
  }

  setExposure(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_EXP, { value });
  }

  getExposure(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_EXP);
  }

  setGainMode(mode: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_GAIN_MODE, { mode });
  }

  getGainMode(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_GAIN_MODE);
  }

  setGain(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_GAIN, { value });
  }

  getGain(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_GAIN);
  }

  setBrightness(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_BRIGHTNESS, { value });
  }

  getBrightness(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_BRIGHTNESS);
  }

  setContrast(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_CONTRAST, { value });
  }

  getContrast(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_CONTRAST);
  }

  setSaturation(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_SATURATION, { value });
  }

  getSaturation(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_SATURATION);
  }

  setHue(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_HUE, { value });
  }

  getHue(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_HUE);
  }

  setSharpness(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_SHARPNESS, { value });
  }

  getSharpness(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_SHARPNESS);
  }

  setWhiteBalanceMode(mode: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_WB_MODE, { mode });
  }

  getWhiteBalanceMode(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_WB_MODE);
  }

  setWhiteBalanceScene(scene: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_WB_SCENE, { scene });
  }

  getWhiteBalanceScene(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_WB_SCENE);
  }

  setWhiteBalanceCT(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_WB_CT, { value });
  }

  getWhiteBalanceCT(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_WB_CT);
  }

  setIRCut(mode: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_IRCUT, { mode });
  }

  getIRCut(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_IRCUT);
  }

  startTimelapse(interval: number, totalTime?: number): Promise<unknown> {
    const params: Record<string, unknown> = { interval };
    if (totalTime !== undefined) params.totalTime = totalTime;
    return this.client.sendCommand(Command.CAMERA_TELE_START_TIMELAPSE_PHOTO, params);
  }

  stopTimelapse(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_STOP_TIMELAPSE_PHOTO);
  }

  setAllParams(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_ALL_PARAMS, params);
  }

  getAllParams(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_ALL_PARAMS);
  }

  setFeatureParam(id: number, value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_FEATURE_PARAM, { id, value });
  }

  getAllFeatureParams(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_GET_ALL_FEATURE_PARAMS);
  }

  setJpgQuality(quality: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_JPG_QUALITY, { quality });
  }

  takePhotoRaw(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_PHOTO_RAW);
  }

  setRtspBitrateType(type: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_RTSP_BITRATE_TYPE, { type });
  }

  switchResolution(width: number, height: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SWITCH_RESOLUTION, { width, height });
  }

  switchFramerate(fps: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SWITCH_FRAMERATE, { fps });
  }

  switchCropRatio(ratio: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SWITCH_CROP_RATIO, { ratio });
  }

  setPreviewQuality(quality: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_TELE_SET_PREVIEW_QUALITY, { quality });
  }
}
