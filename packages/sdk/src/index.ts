// @alikh/dwarflab-sdk - Unofficial TypeScript SDK for DWARFLAB telescopes

// Client
export { DwarfClient } from './client.js';
export type { DwarfClientOptions } from './client.js';

// Transport
export { WebSocketTransport } from './connection/websocket-transport.js';
export type { WebSocketTransportOptions } from './connection/websocket-transport.js';
export { HttpTransport } from './connection/http-transport.js';
export type { HttpTransportOptions } from './connection/http-transport.js';

// Protocol
export { ModuleId, cmdToModule } from './protocol/modules.js';
export { Command } from './protocol/commands.js';
export { MessageType } from './protocol/message-types.js';
export { ErrorCode, getErrorMessage } from './protocol/error-codes.js';
export { encodePacket, decodePacket, createRequestPacket } from './protocol/packet.js';
export type { Packet, PacketHeader } from './protocol/packet.js';
export { encodePayload, decodeResponse, getRequestType, getResponseType } from './protocol/codec.js';

// State & Enums
export {
  DeviceType,
  CaptureState,
  MotorState,
  EQModeState,
  SolarModeType,
  ShootingMode,
  ShootingTech,
  LiveStackingState,
  describeLiveStackingState,
  isLiveStackingActive,
  BurstState,
  describeBurstState,
  isBurstActive,
} from './state/enums.js';

// Modules
export { CameraTeleModule } from './modules/camera-tele.js';
export { CameraWideModule } from './modules/camera-wide.js';
export { AstroModule } from './modules/astro.js';
export type { CameraStackingState, StackingStateSnapshot } from './modules/astro.js';
export { SystemModule } from './modules/system.js';
export { PowerModule } from './modules/power.js';
export { MotorModule } from './modules/motor.js';
export { TrackingModule } from './modules/tracking.js';
export { FocusModule } from './modules/focus.js';
export { PanoramaModule } from './modules/panorama.js';
export { ScheduleModule } from './modules/schedule.js';
export { TaskCenterModule } from './modules/task-center.js';
export { ParamsModule } from './modules/params.js';

// HTTP API
export { DeviceHttpApi } from './http/device.js';
export type { DeviceInfo } from './http/device.js';
export { AlbumHttpApi } from './http/album.js';
export type { MediaInfo, MediaCount, AstroImageDetails, FitsFile } from './http/album.js';
export { FirmwareHttpApi } from './http/firmware.js';
export type { ParamConfig, ShootingMode as ShootingModeConfig } from './http/firmware.js';

// Notifications
export { NotificationEmitter } from './notifications/emitter.js';
export type { NotificationEvents } from './notifications/types.js';
export { NOTIFICATION_CMD_TO_EVENT } from './notifications/types.js';

// State
export { DeviceStateTracker } from './state/device-state.js';
export type { DeviceState } from './state/device-state.js';

// Errors
export { DwarfError } from './utils/errors.js';

// Utils
export { Logger } from './utils/logger.js';
export type { LogLevel } from './utils/logger.js';
export { packParamId, unpackParamId, ParamSection, ParamCamera, type ParamIdTree } from './utils/param-id.js';
export { BURST_COUNT_GEARS, shotsToBurstGearIndex } from './utils/burst-count.js';

// Generated protobuf types (for advanced usage)
export { dwarflab as proto } from './generated/proto.js';
