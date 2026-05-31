import { Command } from '../protocol/commands.js';
import type { DwarfClient } from '../client.js';

export class ParamsModule {
  constructor(private readonly client: DwarfClient) {}

  setExposure(cameraType: number, value: number): Promise<unknown> {
    return this.client.sendCommand(Command.PARAM_SET_EXPOSURE, { cameraType, value });
  }

  setGain(cameraType: number, value: number): Promise<unknown> {
    return this.client.sendCommand(Command.PARAM_SET_GAIN, { cameraType, value });
  }

  setWhiteBalance(cameraType: number, value: number): Promise<unknown> {
    return this.client.sendCommand(Command.PARAM_SET_WB, { cameraType, value });
  }

  setIntParam(cameraType: number, paramId: number, value: number): Promise<unknown> {
    return this.client.sendCommand(Command.PARAM_SET_GENERAL_INT_PARAM, { cameraType, paramId, value });
  }

  setFloatParam(cameraType: number, paramId: number, value: number): Promise<unknown> {
    return this.client.sendCommand(Command.PARAM_SET_GENERAL_FLOAT_PARAM, { cameraType, paramId, value });
  }

  setBoolParam(cameraType: number, paramId: number, value: boolean): Promise<unknown> {
    return this.client.sendCommand(Command.PARAM_SET_GENERAL_BOOL_PARAM, { cameraType, paramId, value });
  }

  setAutoParams(cameraType: number): Promise<unknown> {
    return this.client.sendCommand(Command.PARAM_SET_AUTO_PARAMS, { cameraType });
  }
}
