import { Command } from '../protocol/commands.js';
import type { DwarfClient } from '../client.js';

export class PanoramaModule {
  constructor(private readonly client: DwarfClient) {}

  startGrid(rows: number, cols: number): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_START_GRID, { rows, cols });
  }

  stop(): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_STOP);
  }

  startStitchUpload(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_START_STITCH_UPLOAD, params);
  }

  stopStitchUpload(): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_STOP_STITCH_UPLOAD);
  }

  getCurrentUploadState(): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_GET_CURRENT_UPLOAD_STATE);
  }

  startCompress(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_START_COMPRESS, params);
  }

  stopCompress(): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_STOP_COMPRESS);
  }

  startFraming(): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_START_FRAMING);
  }

  stopFraming(): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_STOP_FRAMING);
  }

  resetFraming(): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_RESET_FRAMING);
  }

  updateFramingRect(params: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_UPDATE_FRAMING_RECT, params);
  }

  stopFramingAndStartGrid(): Promise<unknown> {
    return this.client.sendCommand(Command.PANORAMA_STOP_FRAMING_AND_START_GRID);
  }
}
