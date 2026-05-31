import { Command } from '../protocol/commands.js';
import type { DwarfClient } from '../client.js';

export class TrackingModule {
  constructor(private readonly client: DwarfClient) {}

  startTrack(x: number, y: number): Promise<unknown> {
    return this.client.sendCommand(Command.TRACK_START_TRACK, { x, y });
  }

  stopTrack(): Promise<unknown> {
    return this.client.sendCommand(Command.TRACK_STOP_TRACK);
  }

  startSentryMode(params?: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.SENTRY_MODE_START, params);
  }

  stopSentryMode(): Promise<unknown> {
    return this.client.sendCommand(Command.SENTRY_MODE_STOP);
  }

  startMot(params?: Record<string, unknown>): Promise<unknown> {
    return this.client.sendCommand(Command.MOT_START, params);
  }

  trackOne(x: number, y: number): Promise<unknown> {
    return this.client.sendCommand(Command.MOT_TRACK_ONE, { x, y });
  }

  startUfoTrack(): Promise<unknown> {
    return this.client.sendCommand(Command.UFOTRACK_MODE_START);
  }

  stopUfoTrack(): Promise<unknown> {
    return this.client.sendCommand(Command.UFOTRACK_MODE_STOP);
  }

  wideTrackOne(x: number, y: number): Promise<unknown> {
    return this.client.sendCommand(Command.MOT_WIDE_TRACK_ONE, { x, y });
  }

  switchMainPreview(cameraType: number): Promise<unknown> {
    return this.client.sendCommand(Command.SWITCH_MAIN_PREVIEW, { cameraType });
  }

  setUfoHandAutoMode(mode: number): Promise<unknown> {
    return this.client.sendCommand(Command.UFO_HAND_AUTO_MODE, { mode });
  }

  selectSentryScene(scene: number): Promise<unknown> {
    return this.client.sendCommand(Command.SENTRY_SCENE_SELECT, { scene });
  }

  startTrackClick(x: number, y: number): Promise<unknown> {
    return this.client.sendCommand(Command.TRACK_START_CLICK, { x, y });
  }
}
