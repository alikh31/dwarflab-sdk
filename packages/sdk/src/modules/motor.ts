import { Command } from '../protocol/commands.js';
import type { DwarfClient } from '../client.js';

export class MotorModule {
  constructor(private readonly client: DwarfClient) {}

  run(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.STEP_MOTOR_RUN, params);
  }

  stop(): Promise<unknown> {
    return this.client.sendCommand(Command.STEP_MOTOR_STOP);
  }

  /**
   * Polar joystick — vectorAngle in degrees (0 = up/north, 90 = right/east),
   * vectorLength is magnitude 0..1.
   *
   * Only these two fields go on the wire. Use best-effort send; the device
   * replies but it's noisy (one reply per call) and we don't care about the
   * reply for joystick.
   */
  joystick(vectorAngle: number, vectorLength = 1.0): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.STEP_MOTOR_SERVICE_JOYSTICK, { vectorAngle, vectorLength });
  }

  joystickFixedAngle(vectorAngle: number, vectorLength = 1.0): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.STEP_MOTOR_SERVICE_JOYSTICK_FIXED_ANGLE, { vectorAngle, vectorLength });
  }

  joystickStop(): Promise<unknown> {
    return this.client.sendCommandNoWait(Command.STEP_MOTOR_SERVICE_JOYSTICK_STOP);
  }

  dualCameraLinkage(enable: boolean): Promise<unknown> {
    return this.client.sendCommand(Command.STEP_MOTOR_SERVICE_DUAL_CAMERA_LINKAGE, { enable });
  }
}
