import { Logger } from '../utils/logger.js';
import { encodePacket, decodePacket, type Packet } from '../protocol/packet.js';
import { MessageType } from '../protocol/message-types.js';
import { Command } from '../protocol/commands.js';
import { encodePayload, decodeResponse } from '../protocol/codec.js';
import { DwarfError } from '../utils/errors.js';

export interface WebSocketTransportOptions {
  host: string;
  port?: number;
  WebSocket?: WebSocketConstructor;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  requestTimeout?: number;
  logger?: Logger;
}

type WebSocketConstructor = new (url: string) => WebSocketLike;

interface WebSocketLike {
  binaryType: string;
  readyState: number;
  onopen: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  send(data: ArrayBufferLike | ArrayBufferView | string): void;
  close(code?: number, reason?: string): void;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  /** When true, negative-code replies resolve with the decoded payload instead of rejecting. */
  bestEffort: boolean;
}

export type PacketHandler = (packet: Packet, decoded: unknown) => void;

export class WebSocketTransport {
  private ws: WebSocketLike | null = null;
  private readonly host: string;
  private readonly port: number;
  private readonly WsCtor: WebSocketConstructor;
  private readonly reconnect: boolean;
  private readonly reconnectDelay: number;
  private readonly maxReconnectDelay: number;
  private readonly requestTimeout: number;
  private readonly logger: Logger;
  private readonly pending = new Map<string, PendingRequest>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly clientId: string;
  private _connected = false;
  private _destroyed = false;
  private onPacket: PacketHandler | null = null;
  private onConnect: (() => void) | null = null;
  private onDisconnect: (() => void) | null = null;

  constructor(options: WebSocketTransportOptions) {
    this.host = options.host;
    this.port = options.port ?? 9900;
    this.reconnect = options.reconnect ?? true;
    this.reconnectDelay = options.reconnectDelay ?? 1000;
    this.maxReconnectDelay = options.maxReconnectDelay ?? 30000;
    this.requestTimeout = options.requestTimeout ?? 10000;
    this.logger = options.logger ?? new Logger();
    // The device binds to the first clientId it sees, so we keep one fixed
    // clientId per session (matches the official app's behavior).
    this.clientId = `sdk_${Date.now().toString(36)}`;

    const WsFromOptions = options.WebSocket;
    if (WsFromOptions) {
      this.WsCtor = WsFromOptions;
    } else if (typeof globalThis.WebSocket !== 'undefined') {
      this.WsCtor = globalThis.WebSocket as unknown as WebSocketConstructor;
    } else {
      throw new Error(
        'No WebSocket implementation available. Pass a WebSocket constructor (e.g. ws for Node.js) via options.WebSocket',
      );
    }
  }

  get connected(): boolean {
    return this._connected;
  }

  setPacketHandler(handler: PacketHandler): void {
    this.onPacket = handler;
  }

  setConnectHandler(handler: () => void): void {
    this.onConnect = handler;
  }

  setDisconnectHandler(handler: () => void): void {
    this.onDisconnect = handler;
  }

  connect(): Promise<void> {
    if (this._destroyed) return Promise.reject(new Error('Transport destroyed'));
    if (this._connected) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const url = `ws://${this.host}:${this.port}`;
      this.logger.debug('Connecting to', url);

      try {
        this.ws = new this.WsCtor(url);
        this.ws.binaryType = 'arraybuffer';
      } catch (err) {
        reject(err);
        return;
      }

      this.ws.onopen = () => {
        this.logger.info('Connected to', url);
        this._connected = true;
        this.reconnectAttempt = 0;
        this.onConnect?.();
        resolve();
      };

      this.ws.onclose = () => {
        const wasConnected = this._connected;
        this._connected = false;
        this.rejectAllPending(new Error('WebSocket closed'));

        if (wasConnected) {
          this.logger.info('Disconnected');
          this.onDisconnect?.();
        }

        if (this.reconnect && !this._destroyed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (ev) => {
        this.logger.error('WebSocket error:', ev);
        if (!this._connected) {
          reject(new Error('WebSocket connection failed'));
        }
      };

      this.ws.onmessage = (ev) => {
        this.handleMessage(ev.data);
      };
    });
  }

  disconnect(): void {
    this._destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.rejectAllPending(new Error('Transport disconnected'));
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }
    this._connected = false;
  }

  nextClientId(): string {
    return this.clientId;
  }

  sendRaw(data: Uint8Array): void {
    if (!this.ws || !this._connected) {
      throw new Error('Not connected');
    }
    this.ws.send(data);
  }

  /** Send a raw text message (used for ping keepalive). */
  sendRawText(text: string): void {
    if (!this.ws || !this._connected) {
      throw new Error('Not connected');
    }
    this.ws.send(text);
  }

  /**
   * Best-effort send. Always resolves — never rejects:
   *   - Reply arrives within `replyTimeout`: resolves with decoded payload
   *     (including replies where `code < 0`; the caller can inspect it)
   *   - Reply doesn't arrive: resolves with `null`
   *   - sendRaw throws (socket dead): resolves with `null`
   *
   * Use `sendRequest` instead when you need strict success-or-throw semantics.
   *
   * Verified against live v1.5 firmware: commands historically treated as
   * "fire and forget" (enterCamera 16404, switchShootingMode 16402) actually
   * do return a `type=3 REPLY`. Callers who don't care can ignore the promise.
   */
  sendCommand(
    cmd: Command,
    params: Record<string, unknown> = {},
    deviceId = 1,
    replyTimeout = 5000,
  ): Promise<unknown> {
    const clientId = this.nextClientId();
    const payload = encodePayload(cmd, params);
    const packet = encodePacket(cmd, MessageType.REQUEST, payload, clientId, deviceId);
    this.logger.info(`>> Send cmd=${cmd} clientId=${clientId} (best-effort reply)`);

    return new Promise((resolve) => {
      const pendingKey = `${cmd}`;
      const timer = setTimeout(() => {
        this.pending.delete(pendingKey);
        resolve(null);
      }, replyTimeout);

      // bestEffort: handleMessage will resolve (not reject) even for code<0
      this.pending.set(pendingKey, { resolve, reject: () => {}, timer, bestEffort: true });
      try {
        this.sendRaw(packet);
      } catch {
        this.pending.delete(pendingKey);
        clearTimeout(timer);
        resolve(null);
      }
    });
  }

  sendRequest(cmd: Command, params: Record<string, unknown> = {}, deviceId = 1): Promise<unknown> {
    const clientId = this.nextClientId();
    const payload = encodePayload(cmd, params);
    const packet = encodePacket(cmd, MessageType.REQUEST, payload, clientId, deviceId);

    this.logger.info(`>> Send cmd=${cmd} clientId=${clientId} payloadLen=${payload.length}`);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(pendingKey);
        reject(new Error(`Request timeout for command ${cmd} (clientId=${clientId})`));
      }, this.requestTimeout);

      // Key by cmd only — the telescope firmware does not echo clientId back
      const pendingKey = `${cmd}`;
      this.pending.set(pendingKey, { resolve, reject, timer, bestEffort: false });
      this.sendRaw(packet);
    });
  }

  private handleMessage(raw: unknown): void {
    // Handle text messages (e.g. "pong" keepalive response)
    if (typeof raw === 'string') {
      this.logger.debug(`<< Text message: "${raw}"`);
      return;
    }

    this.logger.info(
      `<< Recv raw: type=${typeof raw} constructor=${(raw as object)?.constructor?.name} len=${(raw as ArrayBuffer)?.byteLength ?? (raw as Uint8Array)?.length ?? '?'}`,
    );

    let buf: Uint8Array;
    if (raw instanceof ArrayBuffer) {
      buf = new Uint8Array(raw);
    } else if (raw instanceof Uint8Array) {
      buf = raw;
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(raw)) {
      buf = new Uint8Array(raw);
    } else {
      this.logger.warn('Unexpected message type:', typeof raw);
      return;
    }

    let packet: Packet;
    try {
      packet = decodePacket(buf);
    } catch (err) {
      this.logger.error('Failed to decode packet:', err);
      return;
    }

    this.logger.info(
      `<< Recv cmd=${packet.cmd} type=${packet.type} module=${packet.moduleId} clientId="${packet.clientId}" dataLen=${packet.data.length}`,
    );

    let decoded: unknown;
    try {
      decoded = decodeResponse(packet.cmd as Command, packet.data);
    } catch {
      decoded = packet.data;
    }

    // Resolve pending request if this is a response or reply
    // Match by cmd only — the telescope firmware may not echo clientId back
    // The telescope uses REPLY (3) for command responses, not RESPONSE (1)
    if (packet.type === MessageType.RESPONSE || packet.type === MessageType.REPLY) {
      const pendingKey = `${packet.cmd}`;
      const pending = this.pending.get(pendingKey);
      if (pending) {
        this.pending.delete(pendingKey);
        clearTimeout(pending.timer);

        const code = (decoded as { code?: number })?.code;
        this.logger.info(`<< Matched response cmd=${packet.cmd} code=${code}`);
        // Strict callers (sendRequest) reject on code<0. Best-effort callers
        // (sendCommand / sendCommandNoWait) always resolve so a code<0 reply
        // doesn't surface as an unhandled rejection somewhere upstream.
        if (code !== undefined && code < 0 && !pending.bestEffort) {
          pending.reject(new DwarfError(code, packet.cmd));
        } else {
          pending.resolve(decoded);
        }
      } else {
        this.logger.info(`<< Unmatched response cmd=${packet.cmd} (no pending request)`);
      }
    }

    // Always dispatch to the packet handler (for notifications etc.)
    this.onPacket?.(packet, decoded);
  }

  private scheduleReconnect(): void {
    if (this._destroyed) return;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempt),
      this.maxReconnectDelay,
    );
    this.reconnectAttempt++;
    this.logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((err) => {
        this.logger.error('Reconnect failed:', err);
      });
    }, delay);
  }

  private rejectAllPending(error: Error): void {
    for (const [key, pending] of this.pending) {
      clearTimeout(pending.timer);
      if (pending.bestEffort) pending.resolve(null);
      else pending.reject(error);
      this.pending.delete(key);
    }
  }
}
