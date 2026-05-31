import { Command } from '../protocol/commands.js';
import type { DwarfClient } from '../client.js';

export class ScheduleModule {
  constructor(private readonly client: DwarfClient) {}

  sync(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.SYNC_SHOOTING_SCHEDULE, params);
  }

  cancel(scheduleId: number): Promise<unknown> {
    return this.client.sendCommand(Command.CANCEL_SHOOTING_SCHEDULE, { scheduleId });
  }

  getAll(): Promise<unknown> {
    return this.client.sendCommand(Command.GET_ALL_SHOOTING_SCHEDULE);
  }

  getById(scheduleId: number): Promise<unknown> {
    return this.client.sendCommand(Command.GET_SHOOTING_SCHEDULE_BY_ID, { scheduleId });
  }

  replace(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.REPLACE_SHOOTING_SCHEDULE, params);
  }

  unlock(scheduleId: number): Promise<unknown> {
    return this.client.sendCommand(Command.UNLOCK_SHOOTING_SCHEDULE, { scheduleId });
  }

  lock(scheduleId: number): Promise<unknown> {
    return this.client.sendCommand(Command.LOCK_SHOOTING_SCHEDULE, { scheduleId });
  }

  remove(scheduleId: number): Promise<unknown> {
    return this.client.sendCommand(Command.DELETE_SHOOTING_SCHEDULE, { scheduleId });
  }
}
