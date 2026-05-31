import { Command } from '../protocol/commands.js';
import { packParamId, ParamSection, ParamCamera } from '../utils/param-id.js';
import { shotsToBurstGearIndex } from '../utils/burst-count.js';
import type { DwarfClient } from '../client.js';

/** Raw 16-bit paramId for the BURST_COUNT device param. */
const BURST_COUNT_PARAM_ID = 21;

export class CameraWideModule {
  constructor(private readonly client: DwarfClient) {}

  openCamera(rtspEncodeType = 1): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_OPEN_CAMERA, { rtspEncodeType });
  }

  closeCamera(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_CLOSE_CAMERA);
  }

  setExposureMode(mode: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_EXP_MODE, { mode });
  }

  getExposureMode(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_GET_EXP_MODE);
  }

  setExposure(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_EXP, { value });
  }

  getExposure(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_GET_EXP);
  }

  setGain(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_GAIN, { value });
  }

  getGain(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_GET_GAIN);
  }

  setBrightness(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_BRIGHTNESS, { value });
  }

  getBrightness(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_GET_BRIGHTNESS);
  }

  setContrast(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_CONTRAST, { value });
  }

  getContrast(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_GET_CONTRAST);
  }

  setSaturation(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_SATURATION, { value });
  }

  getSaturation(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_GET_SATURATION);
  }

  setHue(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_HUE, { value });
  }

  getHue(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_GET_HUE);
  }

  setSharpness(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_SHARPNESS, { value });
  }

  getSharpness(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_GET_SHARPNESS);
  }

  setWhiteBalanceMode(mode: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_WB_MODE, { mode });
  }

  getWhiteBalanceMode(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_GET_WB_MODE);
  }

  setWhiteBalanceCT(value: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_WB_CT, { value });
  }

  getWhiteBalanceCT(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_GET_WB_CT);
  }

  takePhoto(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_PHOTOGRAPH);
  }

  /**
   * Start a wide burst (cmd 12023, `ReqBurstPhoto`). Identical semantics to
   * {@link CameraTeleModule.startBurst} — see that for the full contract. In
   * short (verified live):
   * - PRECONDITION: must be in `ShootingTech.BURST` first (via
   *   `taskCenter.switchShootingTech`) or cmd 12023 is rejected `code:-1` — this
   *   is MANDATORY, the body is irrelevant to acceptance.
   * - Burst self-stops after N shots (N = device `BURST_COUNT` param); no
   *   `stopBurst` needed for normal completion (only for early cancel).
   * - Progress is on the wire: 15285 carries real `totalCount` + monotonic
   *   `completedCount`; 15274 fires once (RUNNING → terminal `{}`).
   * - `count` is optional and ignored by the firmware for the total (omit for an
   *   empty body; don't pass 0 expecting empty). Mutually exclusive with
   *   live-stacking (shared firmware oneof); does not feed the stacking pipeline.
   */
  startBurst(count?: number): Promise<unknown> {
    // Omit count → empty ReqBurstPhoto. Pass a number → {count}.
    // See CameraTeleModule.startBurst for the count:0-vs-omit nuance.
    const params = count === undefined ? {} : { count };
    return this.client.sendCommand(Command.CAMERA_WIDE_BURST, params);
  }

  /**
   * Set the wide camera's `BURST_COUNT` (shots per burst). See
   * {@link CameraTeleModule.setBurstCount} for the full contract: `count` is a
   * SHOT COUNT mapped to a firmware GEAR INDEX (3→0, 5→3, …); the param is sent
   * via cmd 16703 with a packed int64 paramId (cameraId=1 wide) and
   * `sendCommandNoWait` (16703 has no ComResponse — confirmed via the 15264 echo).
   * ⚠️ Write effect UNVERIFIED live.
   */
  setBurstCount(count: number, modeId = 1): Promise<unknown> {
    const paramId = packParamId({
      modeId,
      sectionId: ParamSection.GENERAL,
      cameraId: ParamCamera.WIDE,
      paramId: BURST_COUNT_PARAM_ID,
    });
    const gearIndex = shotsToBurstGearIndex(count);
    return this.client.sendCommandNoWait(Command.PARAM_SET_GENERAL_INT_PARAM, {
      paramId: paramId.toString(),
      value: gearIndex,
    });
  }

  /**
   * Stop the wide burst (cmd 12024, empty `ReqStopBurstPhoto`). See
   * {@link CameraTeleModule.stopBurst}: single stop command, `sendCommandNoWait`
   * (the command reply timing is unverified; the authoritative end signal is the
   * 15274 NOTIFY_BURST_STATE transition to STOPPED/IDLE — watch {@link isBurstActive}).
   */
  stopBurst(): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.CAMERA_WIDE_STOP_BURST);
  }

  startTimelapse(interval: number, totalTime?: number): Promise<unknown> {
    const params: Record<string, unknown> = { interval };
    if (totalTime !== undefined) params.totalTime = totalTime;
    return this.client.sendCommand(Command.CAMERA_WIDE_START_TIMELAPSE_PHOTO, params);
  }

  stopTimelapse(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_STOP_TIMELAPSE_PHOTO);
  }

  getAllParams(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_GET_ALL_PARAMS);
  }

  setAllParams(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_ALL_PARAMS, params);
  }

  takePhotoRaw(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_PHOTO_RAW);
  }

  startRecord(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_START_RECORD);
  }

  stopRecord(): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_STOP_RECORD);
  }

  setRtspBitrateType(type: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_RTSP_BITRATE_TYPE, { type });
  }

  setWhiteBalanceScene(scene: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_WB_SCENE, { scene });
  }

  setPreviewQuality(quality: number): Promise<unknown> {
    return this.client.sendCommand(Command.CAMERA_WIDE_SET_PREVIEW_QUALITY, { quality });
  }
}
