import { Command } from '../protocol/commands.js';

export interface NotificationEvents {
  pictureMatching: { cmd: typeof Command.NOTIFY_TELE_WIDE_PICTURE_MATCHING };
  battery: { cmd: typeof Command.NOTIFY_ELE; percentage?: number; voltage?: number };
  charging: { cmd: typeof Command.NOTIFY_CHARGE };
  sdCard: { cmd: typeof Command.NOTIFY_SDCARD_INFO };
  captureRawDarkState: { cmd: typeof Command.NOTIFY_STATE_CAPTURE_RAW_DARK };
  captureRawDarkProgress: { cmd: typeof Command.NOTIFY_PROGRASS_CAPTURE_RAW_DARK };
  liveStackingState: { cmd: typeof Command.NOTIFY_STATE_CAPTURE_RAW_LIVE_STACKING };
  liveStackingProgress: { cmd: typeof Command.NOTIFY_PROGRASS_CAPTURE_RAW_LIVE_STACKING };
  calibrationState: { cmd: typeof Command.NOTIFY_STATE_ASTRO_CALIBRATION };
  gotoState: { cmd: typeof Command.NOTIFY_STATE_ASTRO_GOTO };
  trackingState: { cmd: typeof Command.NOTIFY_STATE_ASTRO_TRACKING };
  teleSetParam: { cmd: typeof Command.NOTIFY_TELE_SET_PARAM };
  wideSetParam: { cmd: typeof Command.NOTIFY_WIDE_SET_PARAM };
  rgbState: { cmd: typeof Command.NOTIFY_RGB_STATE };
  powerIndState: { cmd: typeof Command.NOTIFY_POWER_IND_STATE };
  hostSlaveMode: { cmd: typeof Command.NOTIFY_WS_HOST_SLAVE_MODE };
  trackResult: { cmd: typeof Command.NOTIFY_TRACK_RESULT };
  cpuMode: { cmd: typeof Command.NOTIFY_CPU_MODE };
  powerOff: { cmd: typeof Command.NOTIFY_POWER_OFF };
  sentryModeState: { cmd: typeof Command.NOTIFY_SENTRY_MODE_STATE };
  oneClickGotoState: { cmd: typeof Command.NOTIFY_STATE_ASTRO_ONE_CLICK_GOTO };
  streamType: { cmd: typeof Command.NOTIFY_STREAM_TYPE };
  eqSolvingState: { cmd: typeof Command.NOTIFY_EQ_SOLVING_STATE };
  temperature: { cmd: typeof Command.NOTIFY_TEMPERATURE };
  focusPosition: { cmd: typeof Command.NOTIFY_FOCUS_POSITION };
  bodyStatus: { cmd: typeof Command.NOTIFY_BODY_STATUS };
  shootingMode: { cmd: typeof Command.NOTIFY_SWITCH_SHOOTING_MODE };
  photoState: { cmd: typeof Command.NOTIFY_PHOTO_STATE };
  burstState: { cmd: typeof Command.NOTIFY_BURST_STATE };
  recordState: { cmd: typeof Command.NOTIFY_RECORD_STATE };
  timelapseState: { cmd: typeof Command.NOTIFY_TIMELAPSE_STATE };
  panoramaState: { cmd: typeof Command.NOTIFY_PANORAMA_STATE };
  astroAutoFocusState: { cmd: typeof Command.NOTIFY_ASTRO_AUTO_FOCUS_STATE };
  normalAutoFocusState: { cmd: typeof Command.NOTIFY_NORMAL_AUTO_FOCUS_STATE };
  normalTrackState: { cmd: typeof Command.NOTIFY_NORMAL_TRACK_STATE };
  sentryMotorState: { cmd: typeof Command.NOTIFY_SENTRY_MOTOR_STATE };
  cmosTemperature: { cmd: typeof Command.NOTIFY_CMOS_TEMPERATURE };
  skyTargetFinderState: { cmd: typeof Command.NOTIFY_SKY_TARGET_FINDER_STATE };
}

export const NOTIFICATION_CMD_TO_EVENT: Partial<Record<number, keyof NotificationEvents>> = {
  [Command.NOTIFY_TELE_WIDE_PICTURE_MATCHING]: 'pictureMatching',
  [Command.NOTIFY_ELE]: 'battery',
  [Command.NOTIFY_CHARGE]: 'charging',
  [Command.NOTIFY_SDCARD_INFO]: 'sdCard',
  [Command.NOTIFY_STATE_CAPTURE_RAW_DARK]: 'captureRawDarkState',
  [Command.NOTIFY_PROGRASS_CAPTURE_RAW_DARK]: 'captureRawDarkProgress',
  [Command.NOTIFY_STATE_CAPTURE_RAW_LIVE_STACKING]: 'liveStackingState',
  [Command.NOTIFY_PROGRASS_CAPTURE_RAW_LIVE_STACKING]: 'liveStackingProgress',
  [Command.NOTIFY_STATE_ASTRO_CALIBRATION]: 'calibrationState',
  [Command.NOTIFY_STATE_ASTRO_GOTO]: 'gotoState',
  [Command.NOTIFY_STATE_ASTRO_TRACKING]: 'trackingState',
  [Command.NOTIFY_TELE_SET_PARAM]: 'teleSetParam',
  [Command.NOTIFY_WIDE_SET_PARAM]: 'wideSetParam',
  [Command.NOTIFY_RGB_STATE]: 'rgbState',
  [Command.NOTIFY_POWER_IND_STATE]: 'powerIndState',
  [Command.NOTIFY_WS_HOST_SLAVE_MODE]: 'hostSlaveMode',
  [Command.NOTIFY_TRACK_RESULT]: 'trackResult',
  [Command.NOTIFY_CPU_MODE]: 'cpuMode',
  [Command.NOTIFY_POWER_OFF]: 'powerOff',
  [Command.NOTIFY_SENTRY_MODE_STATE]: 'sentryModeState',
  [Command.NOTIFY_STATE_ASTRO_ONE_CLICK_GOTO]: 'oneClickGotoState',
  [Command.NOTIFY_STREAM_TYPE]: 'streamType',
  [Command.NOTIFY_EQ_SOLVING_STATE]: 'eqSolvingState',
  [Command.NOTIFY_TEMPERATURE]: 'temperature',
  [Command.NOTIFY_FOCUS_POSITION]: 'focusPosition',
  [Command.NOTIFY_BODY_STATUS]: 'bodyStatus',
  [Command.NOTIFY_SWITCH_SHOOTING_MODE]: 'shootingMode',
  [Command.NOTIFY_PHOTO_STATE]: 'photoState',
  [Command.NOTIFY_BURST_STATE]: 'burstState',
  [Command.NOTIFY_RECORD_STATE]: 'recordState',
  [Command.NOTIFY_TIMELAPSE_STATE]: 'timelapseState',
  [Command.NOTIFY_PANORAMA_STATE]: 'panoramaState',
  [Command.NOTIFY_ASTRO_AUTO_FOCUS_STATE]: 'astroAutoFocusState',
  [Command.NOTIFY_NORMAL_AUTO_FOCUS_STATE]: 'normalAutoFocusState',
  [Command.NOTIFY_NORMAL_TRACK_STATE]: 'normalTrackState',
  [Command.NOTIFY_SENTRY_MOTOR_STATE]: 'sentryMotorState',
  [Command.NOTIFY_CMOS_TEMPERATURE]: 'cmosTemperature',
  [Command.NOTIFY_SKY_TARGET_FINDER_STATE]: 'skyTargetFinderState',
};
