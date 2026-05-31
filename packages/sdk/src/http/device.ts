import { HttpTransport } from '../connection/http-transport.js';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  macAddress: string;
  wifiSsid: string;
  sdCardAvailable: boolean;
  serialNumber: string;
  activated: boolean;
}

export interface ResetState {
  completed: boolean;
}

export interface LogInfo {
  logPath: string;
  logSize: number;
}

interface ApiResponse<T> {
  data: T;
  code: number;
  message: string | null;
}

export class DeviceHttpApi {
  constructor(private readonly http: HttpTransport) {}

  async getDeviceInfo(): Promise<DeviceInfo> {
    const res = await this.http.post<ApiResponse<DeviceInfo>>('/deviceInfo');
    return res.data;
  }

  async setDeviceNameAndPassword(name: string, password: string): Promise<void> {
    await this.http.post('/setDeviceNameAndPsd', { name, password });
  }

  async resetDevice(): Promise<void> {
    await this.http.post('/resetDeviceInfo');
  }

  async getResetState(): Promise<ResetState> {
    const res = await this.http.post<ApiResponse<ResetState>>('/getResetState');
    return res.data;
  }

  async getLogInfo(): Promise<LogInfo> {
    const res = await this.http.get<ApiResponse<LogInfo>>('/logInfo');
    return res.data;
  }

  async downloadLog(): Promise<ArrayBuffer> {
    return this.http.getRaw('/downloadLog');
  }
}
