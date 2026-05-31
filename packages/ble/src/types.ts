export interface BleDevice {
  name: string;
  address: string;
  rssi: number;
  peripheral: unknown;
}

export interface WifiConfig {
  ssid: string;
  password: string;
}

export type WifiMode = 'ap' | 'sta';

export interface DeviceConfig {
  state: number;
  wifiMode: number;
  apMode: number;
  autoStart: number;
  ssid: string;
  password: string;
  ip: string;
  apCountry: string;
}

export interface StaResult {
  code: number;
  ssid: string;
  ip: string;
  password: string;
}
