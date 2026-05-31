import { proto } from '@alikh/dwarflab-sdk';
import type { BleDevice, DeviceConfig, StaResult, WifiConfig } from './types.js';
import { BLE_SHORT_UUIDS } from './characteristics.js';
import { BleCmd, createBlePackets, parseBlePacket, reassembleBlePackets } from './packet.js';

interface Characteristic {
  uuid: string;
  properties: string[];
  write(data: Buffer, withoutResponse: boolean, callback: (err?: Error) => void): void;
  subscribe(callback: (err?: Error) => void): void;
  on(event: string, callback: (data: Buffer, isNotification: boolean) => void): void;
  removeAllListeners(event: string): void;
}

interface Peripheral {
  state: string;
  mtu: number;
  connectAsync(): Promise<void>;
  disconnectAsync(): Promise<void>;
  discoverAllServicesAndCharacteristicsAsync(): Promise<{
    services: Array<{ uuid: string }>;
    characteristics: Characteristic[];
  }>;
}

function generateClientId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export class BleConnection {
  private peripheral: Peripheral;
  private writeChar: Characteristic | null = null;
  private notifyChar: Characteristic | null = null;
  private connected = false;
  private mtu = 20;

  constructor(device: BleDevice) {
    this.peripheral = device.peripheral as Peripheral;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    const peripheral = this.peripheral;

    // Handle already-connected peripheral (e.g. retry after partial failure)
    if (peripheral.state === 'connected') {
      try {
        await peripheral.disconnectAsync();
      } catch {
        // ignore disconnect errors
      }
    }

    await peripheral.connectAsync();
    this.connected = true;

    // Read negotiated MTU (noble provides this after connect)
    if (peripheral.mtu && peripheral.mtu > 0) {
      this.mtu = peripheral.mtu;
    }

    try {
      // Discover ALL services and characteristics — don't filter by UUID
      // since different DWARF models advertise different service UUIDs
      const { characteristics } = await peripheral.discoverAllServicesAndCharacteristicsAsync();

      // Strategy 1: Look for separate ffe1 (write) and ffe2 (notify) characteristics
      for (const char of characteristics) {
        const uuid = char.uuid.toLowerCase().replace(/-/g, '');
        if (uuid === BLE_SHORT_UUIDS.WRITE_CHAR || uuid.includes(BLE_SHORT_UUIDS.WRITE_CHAR)) {
          this.writeChar = char;
        }
        if (uuid === BLE_SHORT_UUIDS.NOTIFY_CHAR || uuid.includes(BLE_SHORT_UUIDS.NOTIFY_CHAR)) {
          this.notifyChar = char;
        }
      }

      // Strategy 2: DWARF 3/4 uses a single 9999 characteristic for both write and notify
      if (!this.writeChar || !this.notifyChar) {
        for (const char of characteristics) {
          const uuid = char.uuid.toLowerCase().replace(/-/g, '');
          if (uuid === BLE_SHORT_UUIDS.DWARF_CHAR || uuid.includes(BLE_SHORT_UUIDS.DWARF_CHAR)) {
            this.writeChar = char;
            this.notifyChar = char;
            break;
          }
        }
      }

      if (!this.writeChar || !this.notifyChar) {
        const found = characteristics.map((c) => c.uuid).join(', ');
        throw new Error(
          `Could not find required BLE characteristics. ` +
          `Expected ffe1+ffe2 or 9999. Found: [${found}]`,
        );
      }

      // Subscribe to notifications
      await new Promise<void>((resolve, reject) => {
        this.notifyChar!.subscribe((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (err) {
      // Disconnect on service discovery failure to avoid "already connected" on retry
      try {
        await peripheral.disconnectAsync();
      } catch {
        // ignore
      }
      this.connected = false;
      this.writeChar = null;
      this.notifyChar = null;
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.notifyChar) {
      this.notifyChar.removeAllListeners('data');
    }
    try {
      await this.peripheral.disconnectAsync();
    } catch {
      // ignore
    }
    this.connected = false;
    this.writeChar = null;
    this.notifyChar = null;
  }

  /** Send a BLE command and wait for the response */
  private async sendCommand(cmd: number, payload: Uint8Array): Promise<Uint8Array> {
    if (!this.writeChar || !this.notifyChar) {
      throw new Error('Not connected');
    }

    const packets = createBlePackets(payload, cmd, this.mtu);

    // Set up response listener before sending
    const responsePromise = this.waitForResponse(cmd);

    // Write each packet sequentially
    for (const packet of packets) {
      await this.writePacket(packet);
    }

    return responsePromise;
  }

  /** Write a single BLE packet to the write characteristic */
  private writePacket(data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      this.writeChar!.write(Buffer.from(data), false, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /** Wait for a complete response (possibly multi-packet) from the notify characteristic */
  private waitForResponse(expectedCmd: number, timeoutMs = 10000): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const receivedPackets: Array<{ seqNum: number; data: Uint8Array }> = [];
      let expectedTotal = -1;

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`BLE response timeout for cmd ${expectedCmd}`));
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        this.notifyChar?.removeAllListeners('data');
      };

      this.notifyChar!.on('data', (buf: Buffer) => {
        const parsed = parseBlePacket(new Uint8Array(buf));
        if (!parsed) return;

        if (parsed.cmd !== expectedCmd) return;

        expectedTotal = parsed.totalPkgs;
        receivedPackets.push({ seqNum: parsed.seqNum, data: parsed.data });

        if (receivedPackets.length >= expectedTotal) {
          cleanup();
          resolve(reassembleBlePackets(receivedPackets));
        }
      });
    });
  }

  async getConfig(): Promise<DeviceConfig> {
    const reqBytes = proto.ble.ReqGetconfig.encode({
      cmd: BleCmd.GetWiFiConfig,
      blePsd: '',
      clientId: generateClientId(),
    }).finish();

    const resBytes = await this.sendCommand(BleCmd.GetWiFiConfig, reqBytes);
    const res = proto.ble.ResGetconfig.decode(resBytes);

    return {
      state: res.state,
      wifiMode: res.wifiMode,
      apMode: res.apMode,
      autoStart: res.autoStart,
      ssid: res.ssid,
      password: res.psd,
      ip: res.ip,
      apCountry: res.apCountry,
    };
  }

  async setApMode(_config: WifiConfig): Promise<void> {
    // Switch to AP mode. The device uses a fixed SSID (e.g. DWARF3_XXXXXX) and
    // the documented factory-default Wi-Fi password printed on the device. AP
    // credentials cannot be changed via BLE on current firmware, so the
    // WifiConfig argument is accepted for API symmetry but not applied here.
    const reqBytes = proto.ble.ReqAp.encode({
      cmd: BleCmd.SetApMode,
      wifiType: 0,
      autoStart: 1,
      countryList: 0,
      country: '',
      blePsd: '',
      clientId: generateClientId(),
      forceRestart: true,
    }).finish();

    await this.sendCommand(BleCmd.SetApMode, reqBytes);
  }

  /**
   * Push WiFi STA credentials and return the device's LAN IP.
   *
   * The device replies with `ResSta { code, ssid, psd, ip }` *immediately*.
   * `getConfig` does NOT reflect the new state on current firmware (v1.4–v1.5),
   * so the caller must use the IP from this return value — polling won't help.
   */
  async setStaMode(config: WifiConfig): Promise<StaResult> {
    const reqBytes = proto.ble.ReqSta.encode({
      cmd: BleCmd.SetSTAMode,
      autoStart: 1,
      blePsd: '',
      ssid: config.ssid,
      psd: config.password,
      clientId: generateClientId(),
    }).finish();

    const resBytes = await this.sendCommand(BleCmd.SetSTAMode, reqBytes);
    const res = proto.ble.ResSta.decode(resBytes);
    return {
      code: res.code,
      ssid: res.ssid || '',
      ip: res.ip || '',
      password: res.psd || '',
    };
  }

  /** Get AP info (SSID + password) by sending a dry SetApMode request */
  async getApInfo(): Promise<{ ssid: string; password: string }> {
    const reqBytes = proto.ble.ReqAp.encode({
      cmd: BleCmd.SetApMode,
      wifiType: 0,
      autoStart: 1,
      countryList: 0,
      country: '',
      blePsd: '',
      clientId: generateClientId(),
      forceRestart: false, // Don't restart — just read info
    }).finish();

    const resBytes = await this.sendCommand(BleCmd.SetApMode, reqBytes);
    const res = proto.ble.ResAp.decode(resBytes);
    return { ssid: res.ssid || '', password: res.psd || '' };
  }

  /** Scan for nearby WiFi networks */
  async scanWifi(): Promise<Array<{ ssid: string; signal: number; security: string }>> {
    const reqBytes = proto.ble.ReqGetwifilist.encode({
      cmd: BleCmd.GetWiFiList,
      clientId: generateClientId(),
    }).finish();

    const resBytes = await this.sendCommand(BleCmd.GetWiFiList, reqBytes);
    const res = proto.ble.ResWifilist.decode(resBytes);

    if (res.wifiInfoList && res.wifiInfoList.length > 0) {
      return res.wifiInfoList.map((w) => ({
        ssid: w.ssid || '',
        signal: w.signalLevel || 0,
        security: w.securityCapability || '',
      }));
    }
    // Fallback: just SSIDs without signal info
    return (res.ssid || []).map((s) => ({ ssid: s, signal: 0, security: '' }));
  }
}
