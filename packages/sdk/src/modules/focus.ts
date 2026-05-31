import { Command } from '../protocol/commands.js';
import type { DwarfClient } from '../client.js';

export class FocusModule {
  constructor(private readonly client: DwarfClient) {}

  autoFocus(): Promise<unknown> {
    return this.client.sendCommand(Command.FOCUS_AUTO_FOCUS);
  }

  manualSingleStep(direction: number): Promise<unknown> {
    return this.client.sendCommand(Command.FOCUS_MANUAL_SINGLE_STEP_FOCUS, { direction });
  }

  startManualContinuous(direction: number): Promise<unknown> {
    return this.client.sendCommand(Command.FOCUS_START_MANUAL_CONTINU_FOCUS, { direction });
  }

  stopManualContinuous(): Promise<unknown> {
    return this.client.sendCommand(Command.FOCUS_STOP_MANUAL_CONTINU_FOCUS);
  }

  startAstroAutoFocus(): Promise<unknown> {
    return this.client.sendCommand(Command.FOCUS_START_ASTRO_AUTO_FOCUS);
  }

  stopAstroAutoFocus(): Promise<unknown> {
    return this.client.sendCommand(Command.FOCUS_STOP_ASTRO_AUTO_FOCUS);
  }

  getInfinityPosition(): Promise<unknown> {
    return this.client.sendCommand(Command.FOCUS_GET_USER_INFINITY_POS);
  }

  setInfinityPosition(position: number): Promise<unknown> {
    return this.client.sendCommand(Command.FOCUS_SET_USER_INFINITY_POS, { position });
  }
}
