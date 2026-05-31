import { Command } from '../protocol/commands.js';
import type { DwarfClient } from '../client.js';

export class PowerModule {
  constructor(private readonly client: DwarfClient) {}

  openRgb(): Promise<unknown> {
    return this.client.sendCommand(Command.RGB_POWER_OPEN_RGB);
  }

  closeRgb(): Promise<unknown> {
    return this.client.sendCommand(Command.RGB_POWER_CLOSE_RGB);
  }

  powerDown(): Promise<unknown> {
    return this.client.sendCommand(Command.RGB_POWER_POWER_DOWN);
  }

  powerIndicatorOn(): Promise<unknown> {
    return this.client.sendCommand(Command.RGB_POWER_POWERIND_ON);
  }

  powerIndicatorOff(): Promise<unknown> {
    return this.client.sendCommand(Command.RGB_POWER_POWERIND_OFF);
  }

  reboot(): Promise<unknown> {
    return this.client.sendCommand(Command.RGB_POWER_REBOOT);
  }
}
