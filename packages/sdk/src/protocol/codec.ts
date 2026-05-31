import { dwarflab } from '../generated/proto.js';
import { Command } from './commands.js';

type ProtoType = {
  encode(message: unknown, writer?: unknown): { finish(): Uint8Array };
  decode(reader: Uint8Array, length?: number): unknown;
  create(properties?: unknown): unknown;
};

interface CodecEntry {
  req?: ProtoType;
  res?: ProtoType;
}

const { camera, astro, base, system, rgb, motor, track, focus, panorama, task_center, param, voice, notify } = dwarflab;

const CODEC_MAP: Partial<Record<Command, CodecEntry>> = {
  // Camera Tele
  [Command.CAMERA_TELE_OPEN_CAMERA]: { req: camera.ReqOpenCamera as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_CLOSE_CAMERA]: { req: camera.ReqCloseCamera as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_PHOTOGRAPH]: { req: camera.ReqPhoto as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_BURST]: { req: camera.ReqBurstPhoto as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_STOP_BURST]: { req: camera.ReqStopBurstPhoto as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_START_RECORD]: { req: camera.ReqStartRecord as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_STOP_RECORD]: { req: camera.ReqStopRecord as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_SET_EXP_MODE]: { req: camera.ReqSetExpMode as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_EXP_MODE]: { req: camera.ReqGetExpMode as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_SET_EXP]: { req: camera.ReqSetExp as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_EXP]: { req: camera.ReqGetExp as ProtoType, res: base.ComResWithDouble as ProtoType },
  [Command.CAMERA_TELE_SET_GAIN_MODE]: { req: camera.ReqSetGainMode as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_GAIN_MODE]: { req: camera.ReqGetGainMode as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_SET_GAIN]: { req: camera.ReqSetGain as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_GAIN]: { req: camera.ReqGetGain as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_SET_BRIGHTNESS]: { req: camera.ReqSetBrightness as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_BRIGHTNESS]: { req: camera.ReqGetBrightness as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_SET_CONTRAST]: { req: camera.ReqSetContrast as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_CONTRAST]: { req: camera.ReqGetContrast as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_SET_SATURATION]: { req: camera.ReqSetSaturation as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_SATURATION]: { req: camera.ReqGetSaturation as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_SET_HUE]: { req: camera.ReqSetHue as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_HUE]: { req: camera.ReqGetHue as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_SET_SHARPNESS]: { req: camera.ReqSetSharpness as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_SHARPNESS]: { req: camera.ReqGetSharpness as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_SET_WB_MODE]: { req: camera.ReqSetWBMode as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_WB_MODE]: { req: camera.ReqGetWBMode as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_SET_WB_SCENE]: { req: camera.ReqSetWBSence as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_WB_SCENE]: { req: camera.ReqGetWBSence as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_SET_WB_CT]: { req: camera.ReqSetWBCT as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_WB_CT]: { req: camera.ReqGetWBCT as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_SET_IRCUT]: { req: camera.ReqSetIrCut as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_IRCUT]: { req: camera.ReqGetIrcut as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_TELE_START_TIMELAPSE_PHOTO]: { req: camera.ReqStartTimeLapse as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_STOP_TIMELAPSE_PHOTO]: { req: camera.ReqStopTimeLapse as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_SET_ALL_PARAMS]: { req: camera.ReqSetAllParams as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_ALL_PARAMS]: { req: camera.ReqGetAllParams as ProtoType, res: camera.ResGetAllParams as ProtoType },
  [Command.CAMERA_TELE_SET_FEATURE_PARAM]: { req: camera.ReqSetFeatureParams as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_GET_ALL_FEATURE_PARAMS]: { req: camera.ReqGetAllFeatureParams as ProtoType, res: camera.ResGetAllFeatureParams as ProtoType },
  [Command.CAMERA_TELE_SET_JPG_QUALITY]: { req: camera.ReqSetJpgQuality as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_PHOTO_RAW]: { req: camera.ReqPhotoRaw as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_TELE_SET_RTSP_BITRATE_TYPE]: { req: camera.ReqSetRtspBitRateType as ProtoType, res: base.ComResponse as ProtoType },

  // Camera Wide
  [Command.CAMERA_WIDE_OPEN_CAMERA]: { req: camera.ReqOpenCamera as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_CLOSE_CAMERA]: { req: camera.ReqCloseCamera as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_PHOTOGRAPH]: { req: camera.ReqPhoto as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_BURST]: { req: camera.ReqBurstPhoto as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_STOP_BURST]: { req: camera.ReqStopBurstPhoto as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_START_RECORD]: { req: camera.ReqStartRecord as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_STOP_RECORD]: { req: camera.ReqStopRecord as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_SET_EXP_MODE]: { req: camera.ReqSetExpMode as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_GET_EXP_MODE]: { req: camera.ReqGetExpMode as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_WIDE_SET_EXP]: { req: camera.ReqSetExp as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_GET_EXP]: { req: camera.ReqGetExp as ProtoType, res: base.ComResWithDouble as ProtoType },
  [Command.CAMERA_WIDE_SET_GAIN]: { req: camera.ReqSetGain as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_GET_GAIN]: { req: camera.ReqGetGain as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_WIDE_SET_BRIGHTNESS]: { req: camera.ReqSetBrightness as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_GET_BRIGHTNESS]: { req: camera.ReqGetBrightness as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_WIDE_SET_CONTRAST]: { req: camera.ReqSetContrast as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_GET_CONTRAST]: { req: camera.ReqGetContrast as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_WIDE_SET_SATURATION]: { req: camera.ReqSetSaturation as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_GET_SATURATION]: { req: camera.ReqGetSaturation as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_WIDE_SET_HUE]: { req: camera.ReqSetHue as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_GET_HUE]: { req: camera.ReqGetHue as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_WIDE_SET_SHARPNESS]: { req: camera.ReqSetSharpness as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_GET_SHARPNESS]: { req: camera.ReqGetSharpness as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_WIDE_SET_WB_MODE]: { req: camera.ReqSetWBMode as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_GET_WB_MODE]: { req: camera.ReqGetWBMode as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_WIDE_SET_WB_CT]: { req: camera.ReqSetWBCT as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_GET_WB_CT]: { req: camera.ReqGetWBCT as ProtoType, res: base.ComResWithInt as ProtoType },
  [Command.CAMERA_WIDE_GET_ALL_PARAMS]: { req: camera.ReqGetAllParams as ProtoType, res: camera.ResGetAllParams as ProtoType },
  [Command.CAMERA_WIDE_SET_ALL_PARAMS]: { req: camera.ReqSetAllParams as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_START_TIMELAPSE_PHOTO]: { req: camera.ReqStartTimeLapse as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_STOP_TIMELAPSE_PHOTO]: { req: camera.ReqStopTimeLapse as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_PHOTO_RAW]: { req: camera.ReqPhotoRaw as ProtoType, res: base.ComResponse as ProtoType },
  [Command.CAMERA_WIDE_SET_RTSP_BITRATE_TYPE]: { req: camera.ReqSetRtspBitRateType as ProtoType, res: base.ComResponse as ProtoType },

  // Astro
  [Command.ASTRO_START_CALIBRATION]: { req: astro.ReqStartCalibration as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_STOP_CALIBRATION]: { req: astro.ReqStopCalibration as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_START_GOTO_DSO]: { req: astro.ReqGotoDSO as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_START_GOTO_SOLAR_SYSTEM]: { req: astro.ReqGotoSolarSystem as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_STOP_GOTO]: { req: astro.ReqStopGoto as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_START_CAPTURE_RAW_LIVE_STACKING]: { req: astro.ReqCaptureRawLiveStacking as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_STOP_CAPTURE_RAW_LIVE_STACKING]: { req: astro.ReqStopCaptureRawLiveStacking as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_START_CAPTURE_RAW_DARK]: { req: astro.ReqCaptureDarkFrame as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_STOP_CAPTURE_RAW_DARK]: { req: astro.ReqStopCaptureDarkFrame as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_CHECK_GOT_DARK]: { req: astro.ReqCheckDarkFrame as ProtoType, res: astro.ResCheckDarkFrame as ProtoType },
  [Command.ASTRO_GO_LIVE]: { req: astro.ReqGoLive as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_START_ONE_CLICK_GOTO_DSO]: { req: astro.ReqOneClickGotoDSO as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_START_ONE_CLICK_GOTO_SOLAR_SYSTEM]: { req: astro.ReqOneClickGotoSolarSystem as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_STOP_ONE_CLICK_GOTO]: { req: astro.ReqStopOneClickGoto as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_START_WIDE_CAPTURE_LIVE_STACKING]: { req: astro.ReqCaptureWideRawLiveStacking as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_STOP_WIDE_CAPTURE_LIVE_STACKING]: { req: astro.ReqStopCaptureWideRawLiveStacking as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_START_EQ_SOLVING]: { req: astro.ReqStartEqSolving as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_STOP_EQ_SOLVING]: { req: astro.ReqStopEqSolving as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_START_CAPTURE_RAW_DARK_WITH_PARAM]: { req: astro.ReqCaptureDarkFrameWithParam as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_STOP_CAPTURE_RAW_DARK_WITH_PARAM]: { req: astro.ReqStopCaptureDarkFrameWithParam as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_GET_DARK_FRAME_LIST]: { req: astro.ReqGetDarkFrameList as ProtoType, res: astro.ResGetDarkFrameInfoList as ProtoType },
  [Command.ASTRO_DEL_DARK_FRAME_LIST]: { req: astro.ReqDelDarkFrameList as ProtoType, res: astro.ResDelDarkFrameList as ProtoType },
  [Command.ASTRO_START_AI_ENHANCE]: { req: astro.ReqStartAiEnhance as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_STOP_AI_ENHANCE]: { req: astro.ReqStopAiEnhance as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_START_TELE_MOSAIC]: { req: astro.ReqStartMosaic as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_START_SKY_TARGET_FINDER]: { req: astro.ReqStartSkyTargetFinder as ProtoType, res: base.ComResponse as ProtoType },
  [Command.ASTRO_STOP_SKY_TARGET_FINDER]: { req: astro.ReqStopSkyTargetFinder as ProtoType, res: base.ComResponse as ProtoType },

  // System
  [Command.SYSTEM_SET_TIME]: { req: system.ReqSetTime as ProtoType, res: base.ComResponse as ProtoType },
  [Command.SYSTEM_SET_TIME_ZONE]: { req: system.ReqSetTimezone as ProtoType, res: base.ComResponse as ProtoType },
  [Command.SYSTEM_SET_MTP_MODE]: { req: system.ReqSetMtpMode as ProtoType, res: base.ComResponse as ProtoType },
  [Command.SYSTEM_SET_CPU_MODE]: { req: system.ReqSetCpuMode as ProtoType, res: base.ComResponse as ProtoType },
  [Command.SYSTEM_SET_LOCATION]: { req: system.ReqSetLocation as ProtoType, res: base.ComResponse as ProtoType },

  // RGB Power
  [Command.RGB_POWER_OPEN_RGB]: { req: rgb.ReqOpenRgb as ProtoType, res: base.ComResponse as ProtoType },
  [Command.RGB_POWER_CLOSE_RGB]: { req: rgb.ReqCloseRgb as ProtoType, res: base.ComResponse as ProtoType },
  [Command.RGB_POWER_POWER_DOWN]: { req: rgb.ReqPowerDown as ProtoType, res: base.ComResponse as ProtoType },
  [Command.RGB_POWER_REBOOT]: { req: rgb.ReqReboot as ProtoType, res: base.ComResponse as ProtoType },

  // Motor
  [Command.STEP_MOTOR_RUN]: { req: motor.ReqMotorRun as ProtoType, res: base.ComResponse as ProtoType },
  [Command.STEP_MOTOR_SERVICE_JOYSTICK]: { req: motor.ReqMotorServiceJoystick as ProtoType, res: base.ComResponse as ProtoType },
  [Command.STEP_MOTOR_SERVICE_JOYSTICK_FIXED_ANGLE]: { req: motor.ReqMotorServiceJoystickFixedAngle as ProtoType, res: base.ComResponse as ProtoType },
  [Command.STEP_MOTOR_SERVICE_DUAL_CAMERA_LINKAGE]: { req: motor.ReqDualCameraLinkage as ProtoType, res: base.ComResponse as ProtoType },

  // Track
  [Command.TRACK_START_TRACK]: { req: track.ReqStartTrack as ProtoType, res: base.ComResponse as ProtoType },
  [Command.TRACK_STOP_TRACK]: { req: track.ReqStopTrack as ProtoType, res: base.ComResponse as ProtoType },
  [Command.SENTRY_MODE_START]: { req: track.ReqStartSentryMode as ProtoType, res: base.ComResponse as ProtoType },
  [Command.SENTRY_MODE_STOP]: { req: track.ReqStopSentryMode as ProtoType, res: base.ComResponse as ProtoType },
  [Command.TRACK_START_CLICK]: { req: track.ReqStartTrackClick as ProtoType, res: base.ComResponse as ProtoType },

  // Focus
  [Command.FOCUS_AUTO_FOCUS]: { req: focus.ReqNormalAutoFocus as ProtoType, res: base.ComResponse as ProtoType },
  [Command.FOCUS_MANUAL_SINGLE_STEP_FOCUS]: { req: focus.ReqManualSingleStepFocus as ProtoType, res: base.ComResponse as ProtoType },
  [Command.FOCUS_START_MANUAL_CONTINU_FOCUS]: { req: focus.ReqManualContinuFocus as ProtoType, res: base.ComResponse as ProtoType },
  [Command.FOCUS_STOP_MANUAL_CONTINU_FOCUS]: { req: focus.ReqStopManualContinuFocus as ProtoType, res: base.ComResponse as ProtoType },
  [Command.FOCUS_START_ASTRO_AUTO_FOCUS]: { req: focus.ReqAstroAutoFocus as ProtoType, res: base.ComResponse as ProtoType },
  [Command.FOCUS_STOP_ASTRO_AUTO_FOCUS]: { req: focus.ReqStopAstroAutoFocus as ProtoType, res: base.ComResponse as ProtoType },

  // Panorama
  [Command.PANORAMA_START_GRID]: { req: panorama.ReqStartPanoramaByGrid as ProtoType, res: base.ComResponse as ProtoType },
  [Command.PANORAMA_STOP]: { req: panorama.ReqStopPanorama as ProtoType, res: base.ComResponse as ProtoType },

  // Task Center
  [Command.TASK_MANAGER_START_TASK]: { req: task_center.ReqStartTask as ProtoType, res: task_center.ResTaskCenter as ProtoType },
  [Command.TASK_MANAGER_STOP_TASK]: { req: task_center.ReqStopTask as ProtoType, res: task_center.ResTaskCenter as ProtoType },
  [Command.TASK_MANAGER_SWITCH_SHOOTING_MODE]: { req: task_center.ReqSwitchShootingMode as ProtoType, res: task_center.ResSwitchShootingMode as ProtoType },
  [Command.TASK_MANAGER_SWITCH_SHOOTING_TECH]: { req: task_center.ReqSwitchShootingTech as ProtoType, res: task_center.ResSwitchShootingTech as ProtoType },
  [Command.TASK_MANAGER_ENTER_CAMERA]: { req: task_center.ReqEnterCamera as ProtoType, res: task_center.ResEnterCamera as ProtoType },
  [Command.TASK_GET_DEVICE_STATE_INFO]: { req: task_center.ReqGetDeviceStateInfo as ProtoType, res: task_center.ResGetDeviceStateInfo as ProtoType },
  [Command.VOICE_ASSISTANT_TASK]: { req: voice.ReqVoiceCommand as ProtoType, res: voice.ResVoiceCommand as ProtoType },

  // Param
  [Command.PARAM_SET_EXPOSURE]: { req: param.ReqSetExposure as ProtoType, res: base.ComResponse as ProtoType },
  [Command.PARAM_SET_GAIN]: { req: param.ReqSetGain as ProtoType, res: base.ComResponse as ProtoType },
  [Command.PARAM_SET_WB]: { req: param.ReqSetWb as ProtoType, res: base.ComResponse as ProtoType },
  [Command.PARAM_SET_GENERAL_INT_PARAM]: { req: param.ReqSetGeneralIntParam as ProtoType, res: base.ComResponse as ProtoType },

  // Notifications (no req — these are device-initiated). Decoder is `res`.
  // Cmd → proto mapping verified against live v1.5 device.
  [Command.NOTIFY_ELE]: { res: notify.BatteryInfo as ProtoType },
  [Command.NOTIFY_CHARGE]: { res: notify.ChargingState as ProtoType },
  [Command.NOTIFY_SDCARD_INFO]: { res: notify.StorageInfo as ProtoType },
  [Command.NOTIFY_TEMPERATURE]: { res: notify.Temperature as ProtoType },
  [Command.NOTIFY_CMOS_TEMPERATURE]: { res: notify.CmosTemperature as ProtoType },
  [Command.NOTIFY_SWITCH_SHOOTING_MODE]: { res: notify.SwitchShootingMode as ProtoType },
  [Command.NOTIFY_GENERAL_INT_PARAM]: { res: notify.GeneralIntParam as ProtoType },
  [Command.NOTIFY_WB]: { res: notify.Wb as ProtoType },
  [Command.NOTIFY_STREAM_TYPE]: { res: notify.StreamType as ProtoType },
  [Command.NOTIFY_POWER_OFF]: { res: notify.PowerOff as ProtoType },
  [Command.NOTIFY_ALBUM_UPDATE]: { res: notify.AlbumUpdate as ProtoType },
  [Command.NOTIFY_FOCUS_POSITION]: { res: notify.FocusPosition as ProtoType },
  [Command.NOTIFY_STATE_ASTRO_GOTO]: { res: notify.AstroGotoState as ProtoType },
  [Command.NOTIFY_STATE_ASTRO_CALIBRATION]: { res: notify.AstroCalibrationState as ProtoType },
  [Command.NOTIFY_STATE_ASTRO_TRACKING]: { res: notify.AstroTrackingState as ProtoType },
  // 15208 tele live-stacking STATE. Was previously unregistered, so payloads
  // arrived as raw byte maps (Object.fromEntries(data.entries())) instead of
  // {state}. OperationStateNotify = { state: OperationState }. The wide
  // counterpart (15236) below already used this; tele was the gap.
  [Command.NOTIFY_STATE_CAPTURE_RAW_LIVE_STACKING]: { res: notify.OperationStateNotify as ProtoType },
  [Command.NOTIFY_PROGRASS_CAPTURE_RAW_LIVE_STACKING]: { res: notify.ProgressCaptureRawLiveStacking as ProtoType },

  // Astro notifications added Phase 1 — close decoder gaps so payloads stop arriving as raw bytes.
  [Command.NOTIFY_STATE_CAPTURE_RAW_DARK]: { res: notify.OperationStateNotify as ProtoType },
  [Command.NOTIFY_PROGRASS_CAPTURE_RAW_DARK]: { res: notify.ProgressCaptureRawDark as ProtoType },
  [Command.NOTIFY_STATE_ASTRO_TRACKING_SPECIAL]: { res: notify.AstroTrackingSpecialState as ProtoType },
  [Command.NOTIFY_STATE_ASTRO_ONE_CLICK_GOTO]: { res: notify.OneClickGotoState as ProtoType },
  [Command.NOTIFY_STATE_WIDE_CAPTURE_RAW_LIVE_STACKING]: { res: notify.OperationStateNotify as ProtoType },
  [Command.NOTIFY_PROGRASS_WIDE_CAPTURE_RAW_LIVE_STACKING]: { res: notify.ProgressCaptureRawLiveStacking as ProtoType },
  [Command.NOTIFY_EQ_SOLVING_STATE]: { res: notify.EqSolvingState as ProtoType },
  [Command.NOTIFY_STATE_CAPTURE_WIDE_RAW_DARK]: { res: notify.OperationStateNotify as ProtoType },
  [Command.NOTIFY_CALIBRATION_RESULT]: { res: notify.CalibrationResult as ProtoType },
  [Command.NOTIFY_PROGRESS_CAPTURE_MOSAIC]: { res: notify.ProgressCaptureMosaic as ProtoType },
  [Command.NOTIFY_ASTRO_AUTO_FOCUS_STATE]: { res: notify.AstroAutoFocusState as ProtoType },
  [Command.NOTIFY_SKY_TARGET_FINDER_STATE]: { res: notify.SkyTargetFinderState as ProtoType },

  // Burst photography notifications. The tele/wide variants (15218/15220)
  // and the general one (15285) all carry the same BurstProgress shape
  // (totalCount, completedCount, cameraType). 15274 is the per-job
  // state notification.
  [Command.NOTIFY_TELE_BURST_PROGRESS]: { res: notify.BurstProgress as ProtoType },
  [Command.NOTIFY_WIDE_BURST_PROGRESS]: { res: notify.BurstProgress as ProtoType },
  [Command.NOTIFY_BURST_PROGRESS]: { res: notify.BurstProgress as ProtoType },
  [Command.NOTIFY_BURST_STATE]: { res: notify.BurstState as ProtoType },
};

export function getRequestType(cmd: Command): ProtoType | undefined {
  return CODEC_MAP[cmd]?.req;
}

export function getResponseType(cmd: Command): ProtoType | undefined {
  return CODEC_MAP[cmd]?.res;
}

export function encodePayload(cmd: Command, params: Record<string, unknown>): Uint8Array {
  const reqType = getRequestType(cmd);
  if (!reqType) {
    // Commands without proto definitions send an empty payload
    return new Uint8Array(0);
  }
  const message = reqType.create(params);
  return reqType.encode(message).finish();
}

export function decodeResponse(cmd: Command, data: Uint8Array): unknown {
  const resType = getResponseType(cmd);
  if (!resType) {
    // Return raw data for commands without proto definitions
    return Object.fromEntries(data.entries());
  }
  return resType.decode(data);
}
