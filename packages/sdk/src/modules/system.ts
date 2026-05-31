import { Command } from '../protocol/commands.js';
import type { DwarfClient } from '../client.js';

export class SystemModule {
  constructor(private readonly client: DwarfClient) {}

  setTime(timestamp: number): Promise<unknown> {
    return this.client.sendCommand(Command.SYSTEM_SET_TIME, { timestamp });
  }

  setTimezone(timezone: string): Promise<unknown> {
    return this.client.sendCommand(Command.SYSTEM_SET_TIME_ZONE, { timezone });
  }

  setMtpMode(mode: number): Promise<unknown> {
    return this.client.sendCommand(Command.SYSTEM_SET_MTP_MODE, { mode });
  }

  setCpuMode(mode: number): Promise<unknown> {
    return this.client.sendCommand(Command.SYSTEM_SET_CPU_MODE, { mode });
  }

  setMaster(isMaster: boolean): Promise<unknown> {
    return this.client.sendCommand(Command.SYSTEM_SET_MASTER, { isMaster });
  }

  setLowTempProtection(mode: number): Promise<unknown> {
    return this.client.sendCommand(Command.SYSTEM_SET_LOW_TEMP_PROTECTION_MODE, { mode });
  }

  /**
   * Push the device's geographic location. Verified live: the proto
   * (`ReqSetLocation`) uses field names `latitude` / `longitude` (not
   * `lat`/`lon`) — short names silently produce a 0-byte payload that the
   * firmware drops. `enable: true` is required for the value to take effect;
   * without it the firmware accepts the payload but treats the location as
   * disabled, which makes calibration / EQ / GoTo fail with -11505 etc.
   */
  setLocation(lon: number, lat: number, altitude = 0): Promise<unknown> {
    return this.client.sendCommand(Command.SYSTEM_SET_LOCATION, {
      latitude: lat,
      longitude: lon,
      altitude,
      enable: true,
    });
  }
}
