import { HttpTransport } from '../connection/http-transport.js';

interface ApiResponse<T> {
  data: T;
  code: number;
  message: string | null;
}

export interface ShootingMode {
  modeId: number;
  name: string;
}

export interface ParamConfig {
  [key: string]: unknown;
}

export class FirmwareHttpApi {
  constructor(private readonly http: HttpTransport) {}

  async applyUpdate(version: string): Promise<void> {
    await this.http.get(`/update?version=${encodeURIComponent(version)}`);
  }

  async getDefaultParamsConfig(): Promise<ParamConfig> {
    const res = await this.http.get<ApiResponse<ParamConfig>>('/getDefaultParamsConfig');
    return res.data;
  }

  async getSupportedShootingModes(): Promise<ShootingMode[]> {
    const res = await this.http.get<ApiResponse<ShootingMode[]>>('/shootingMode/getSupportedShootingModes');
    return res.data;
  }

  async getShootingModeParams(modeId: number): Promise<ParamConfig> {
    const res = await this.http.post<ApiResponse<ParamConfig>>('/shootingMode/getParamAndSetting', { modeId });
    return res.data;
  }
}
