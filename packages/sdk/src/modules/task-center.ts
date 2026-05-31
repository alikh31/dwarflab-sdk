import { Command } from '../protocol/commands.js';
import type { DwarfClient } from '../client.js';

export class TaskCenterModule {
  constructor(private readonly client: DwarfClient) {}

  startTask(taskId: number, params?: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.TASK_MANAGER_START_TASK, { taskId, ...params });
  }

  stopTask(taskId: number): Promise<unknown> {
    return this.client.sendCommand(Command.TASK_MANAGER_STOP_TASK, { taskId });
  }

  switchShootingMode(mode: number): Promise<unknown> {
    return this.client.sendCommand(Command.TASK_MANAGER_SWITCH_SHOOTING_MODE, { mode });
  }

  /**
   * Best-effort variant — non-throwing. Returns the decoded reply (carrying
   * `shootingModeId`) or `null` if no reply arrived. Mode change is also
   * broadcast as NOTIFY_SWITCH_SHOOTING_MODE (15267).
   */
  switchShootingModeNoWait(mode: number): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.TASK_MANAGER_SWITCH_SHOOTING_MODE, { mode });
  }

  /**
   * Switch the shooting *technique* (cmd 16403, `ReqSwitchShootingTech{tech}`).
   * `tech` is a {@link ShootingTech} value (SINGLE_SHOT=1, STACKING=2, BURST=3,
   * VIDEO=4, TIMELAPSE=5, PANORAMA=6) — orthogonal to `switchShootingMode`
   * (the scene). The new tech is confirmed via NOTIFY_TELE_SHOOTING_TECH_STATE
   * (15269) / NOTIFY_WIDE_SHOOTING_TECH_STATE (15271).
   *
   * PRECONDITION for start commands (verified live): the device must already be
   * in the matching tech before the corresponding capture-start is accepted.
   * e.g. `switchShootingTech(ShootingTech.BURST)` must precede
   * `cameraTele.startBurst()` — starting a burst while not in BURST tech is
   * rejected by the firmware (`code:-1` on cmd 10003). Same pattern for STACKING.
   */
  switchShootingTech(tech: number): Promise<unknown> {
    return this.client.sendCommand(Command.TASK_MANAGER_SWITCH_SHOOTING_TECH, { tech });
  }

  enterCamera(encodeType?: number): Promise<unknown> {
    return this.client.sendCommand(Command.TASK_MANAGER_ENTER_CAMERA, { clientParam: { encodeType } });
  }

  /** Send enterCamera. Best-effort reply carries `shootingModeId`. */
  enterCameraNoWait(encodeType = 1): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.TASK_MANAGER_ENTER_CAMERA, { clientParam: { encodeType } });
  }

  getDeviceStateInfo(): Promise<unknown> {
    return this.client.sendCommand(Command.TASK_GET_DEVICE_STATE_INFO);
  }
}
