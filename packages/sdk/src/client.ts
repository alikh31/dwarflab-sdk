import { DeviceType } from './state/enums.js';
import { WebSocketTransport, type PacketHandler } from './connection/websocket-transport.js';
import { HttpTransport } from './connection/http-transport.js';
import { Logger, type LogLevel } from './utils/logger.js';
import { Command } from './protocol/commands.js';
import { MessageType } from './protocol/message-types.js';
import type { Packet } from './protocol/packet.js';
import { CameraTeleModule } from './modules/camera-tele.js';
import { CameraWideModule } from './modules/camera-wide.js';
import { AstroModule } from './modules/astro.js';
import { SystemModule } from './modules/system.js';
import { PowerModule } from './modules/power.js';
import { MotorModule } from './modules/motor.js';
import { TrackingModule } from './modules/tracking.js';
import { FocusModule } from './modules/focus.js';
import { PanoramaModule } from './modules/panorama.js';
import { ScheduleModule } from './modules/schedule.js';
import { TaskCenterModule } from './modules/task-center.js';
import { ParamsModule } from './modules/params.js';
import { DeviceHttpApi } from './http/device.js';
import { AlbumHttpApi } from './http/album.js';
import { FirmwareHttpApi } from './http/firmware.js';

export interface DwarfClientOptions {
  host: string;
  port?: number;
  httpPort?: number;
  deviceType?: DeviceType;
  WebSocket?: unknown;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  requestTimeout?: number;
  logLevel?: LogLevel;
}

type EventHandler = (packet: Packet, decoded: unknown) => void;

export class DwarfClient {
  readonly host: string;
  readonly port: number;
  readonly deviceType: DeviceType;
  readonly logger: Logger;
  readonly ws: WebSocketTransport;
  readonly http: HttpTransport;

  readonly device: DeviceHttpApi;
  readonly album: AlbumHttpApi;
  readonly firmware: FirmwareHttpApi;

  readonly cameraTele: CameraTeleModule;
  readonly cameraWide: CameraWideModule;
  readonly astro: AstroModule;
  readonly system: SystemModule;
  readonly power: PowerModule;
  readonly motor: MotorModule;
  readonly tracking: TrackingModule;
  readonly focus: FocusModule;
  readonly panorama: PanoramaModule;
  readonly schedule: ScheduleModule;
  readonly taskCenter: TaskCenterModule;
  readonly params: ParamsModule;

  private readonly notificationHandlers = new Map<number, Set<EventHandler>>();
  private readonly responseHandlers = new Map<number, Set<EventHandler>>();
  private readonly anyNotificationHandlers = new Set<EventHandler>();

  constructor(options: DwarfClientOptions) {
    this.host = options.host;
    this.port = options.port ?? 9900;
    this.deviceType = options.deviceType ?? DeviceType.DWARF3;
    this.logger = new Logger(options.logLevel ?? 'warn');

    this.ws = new WebSocketTransport({
      host: this.host,
      port: this.port,
      WebSocket: options.WebSocket as never,
      reconnect: options.reconnect,
      reconnectDelay: options.reconnectDelay,
      maxReconnectDelay: options.maxReconnectDelay,
      requestTimeout: options.requestTimeout,
      logger: this.logger,
    });

    this.http = new HttpTransport({
      host: this.host,
      port: options.httpPort,
      logger: this.logger,
    });

    this.ws.setPacketHandler(this.handlePacket.bind(this));

    // Initialize HTTP APIs
    this.device = new DeviceHttpApi(this.http);
    this.album = new AlbumHttpApi(this.http);
    this.firmware = new FirmwareHttpApi(this.http);

    // Initialize modules
    this.cameraTele = new CameraTeleModule(this);
    this.cameraWide = new CameraWideModule(this);
    this.astro = new AstroModule(this);
    this.system = new SystemModule(this);
    this.power = new PowerModule(this);
    this.motor = new MotorModule(this);
    this.tracking = new TrackingModule(this);
    this.focus = new FocusModule(this);
    this.panorama = new PanoramaModule(this);
    this.schedule = new ScheduleModule(this);
    this.taskCenter = new TaskCenterModule(this);
    this.params = new ParamsModule(this);
  }

  get connected(): boolean {
    return this.ws.connected;
  }

  async connect(): Promise<void> {
    await this.ws.connect();
  }

  disconnect(): void {
    this.ws.disconnect();
  }

  sendCommand(cmd: Command, params: Record<string, unknown> = {}, deviceId = 1): Promise<unknown> {
    return this.ws.sendRequest(cmd, params, deviceId);
  }

  /**
   * Send a command without strictly requiring a reply. Returns a promise that
   * resolves with the reply if one arrives within 5s, or `null` if not.
   * Errors (code < 0) still reject. Callers can ignore the returned promise.
   *
   * Was previously `void`; bumped to Promise after verifying on live firmware
   * that "fire and forget" commands (enterCamera, switchShootingMode) actually
   * do reply. See live_device_truth.md.
   */
  sendCommandNoWait(cmd: Command, params: Record<string, unknown> = {}, deviceId = 1): Promise<unknown> {
    return this.ws.sendCommand(cmd, params, deviceId);
  }

  on(cmd: number, handler: EventHandler): () => void {
    let handlers = this.notificationHandlers.get(cmd);
    if (!handlers) {
      handlers = new Set();
      this.notificationHandlers.set(cmd, handlers);
    }
    handlers.add(handler);
    return () => handlers!.delete(handler);
  }

  /** Subscribe to every notification regardless of cmd. Useful for debugging and dashboards. */
  onAnyNotification(handler: EventHandler): () => void {
    this.anyNotificationHandlers.add(handler);
    return () => this.anyNotificationHandlers.delete(handler);
  }

  onResponse(cmd: number, handler: EventHandler): () => void {
    let handlers = this.responseHandlers.get(cmd);
    if (!handlers) {
      handlers = new Set();
      this.responseHandlers.set(cmd, handlers);
    }
    handlers.add(handler);
    return () => handlers!.delete(handler);
  }

  private handlePacket: PacketHandler = (packet, decoded) => {
    if (packet.type === MessageType.NOTIFICATION) {
      const handlers = this.notificationHandlers.get(packet.cmd);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(packet, decoded);
          } catch (err) {
            this.logger.error('Notification handler error:', err);
          }
        }
      }
      for (const handler of this.anyNotificationHandlers) {
        try {
          handler(packet, decoded);
        } catch (err) {
          this.logger.error('Any-notification handler error:', err);
        }
      }
    }

    if (packet.type === MessageType.RESPONSE || packet.type === MessageType.REPLY) {
      const handlers = this.responseHandlers.get(packet.cmd);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(packet, decoded);
          } catch (err) {
            this.logger.error('Response handler error:', err);
          }
        }
      }
    }
  };
}
