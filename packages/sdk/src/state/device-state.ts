import type { DwarfClient } from '../client.js';
import { Command } from '../protocol/commands.js';

export interface DeviceState {
  batteryPercentage: number | null;
  charging: boolean | null;
  sdCardPresent: boolean | null;
  temperature: number | null;
  cmosTemperature: number | null;
  connected: boolean;
}

export class DeviceStateTracker {
  readonly state: DeviceState = {
    batteryPercentage: null,
    charging: null,
    sdCardPresent: null,
    temperature: null,
    cmosTemperature: null,
    connected: false,
  };

  private cleanups: Array<() => void> = [];

  constructor(private readonly client: DwarfClient) {
    this.state.connected = client.connected;

    this.cleanups.push(
      client.on(Command.NOTIFY_ELE, (_packet, decoded) => {
        const d = decoded as { level?: number };
        if (d.level != null) this.state.batteryPercentage = d.level;
      }),
      client.on(Command.NOTIFY_CHARGE, (_packet, decoded) => {
        const d = decoded as { state?: number };
        if (d.state != null) this.state.charging = d.state === 1;
      }),
      client.on(Command.NOTIFY_SDCARD_INFO, (_packet, decoded) => {
        const d = decoded as { exist?: number };
        if (d.exist != null) this.state.sdCardPresent = d.exist === 1;
      }),
      client.on(Command.NOTIFY_TEMPERATURE, (_packet, decoded) => {
        const d = decoded as { temperature?: number };
        if (d.temperature != null) this.state.temperature = d.temperature;
      }),
      client.on(Command.NOTIFY_CMOS_TEMPERATURE, (_packet, decoded) => {
        const d = decoded as { temperature?: number };
        if (d.temperature != null) this.state.cmosTemperature = d.temperature;
      }),
    );
  }

  destroy(): void {
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups = [];
  }
}
