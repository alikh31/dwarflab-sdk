import type { DwarfClient } from '../client.js';
import { NOTIFICATION_CMD_TO_EVENT, type NotificationEvents } from './types.js';
import type { Packet } from '../protocol/packet.js';

type Handler<T> = (data: T, packet: Packet) => void;

export class NotificationEmitter {
  private handlers = new Map<string, Set<Handler<unknown>>>();

  constructor(private readonly client: DwarfClient) {
    // Register for all known notification commands
    for (const [cmdStr] of Object.entries(NOTIFICATION_CMD_TO_EVENT)) {
      const cmd = Number(cmdStr);
      client.on(cmd, (packet, decoded) => {
        const eventName = NOTIFICATION_CMD_TO_EVENT[cmd];
        if (eventName) {
          this.emit(eventName, decoded, packet);
        }
      });
    }
  }

  on<K extends keyof NotificationEvents>(
    event: K,
    handler: Handler<NotificationEvents[K]>,
  ): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<unknown>);
    return () => set!.delete(handler as Handler<unknown>);
  }

  private emit(event: string, data: unknown, packet: Packet): void {
    const set = this.handlers.get(event);
    if (set) {
      for (const handler of set) {
        handler(data, packet);
      }
    }
  }
}
