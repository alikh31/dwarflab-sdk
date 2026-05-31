import type { BleDevice } from './types.js';
import { DWARF_NAME_PREFIX } from './characteristics.js';
import { BleConnection } from './connection.js';

export interface ScanOptions {
  timeout?: number;
  namePrefix?: string;
}

export class DwarfBle {
  private noble: unknown = null;

  async init(): Promise<void> {
    try {
      // Dynamic import for noble (Node.js only)
      const { default: noble } = await import('@abandonware/noble' as string);
      this.noble = noble;
    } catch {
      throw new Error(
        '@abandonware/noble is required for BLE functionality. Install it with: npm install @abandonware/noble',
      );
    }
  }

  async scan(options: ScanOptions = {}): Promise<BleDevice[]> {
    if (!this.noble) await this.init();
    const noble = this.noble as {
      startScanningAsync(serviceUUIDs?: string[], allowDuplicates?: boolean): Promise<void>;
      stopScanningAsync(): Promise<void>;
      on(event: string, callback: (peripheral: unknown) => void): void;
      removeAllListeners(event: string): void;
    };

    const timeout = options.timeout ?? 10000;
    const prefix = options.namePrefix ?? DWARF_NAME_PREFIX;
    const devices: BleDevice[] = [];

    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        noble.removeAllListeners('discover');
        try {
          await noble.stopScanningAsync();
        } catch { /* ignore */ }
        resolve(devices);
      }, timeout);

      noble.on('discover', (peripheral: unknown) => {
        const p = peripheral as { advertisement: { localName?: string }; address: string; rssi: number };
        const name = p.advertisement.localName ?? '';
        if (name.startsWith(prefix)) {
          devices.push({
            name,
            address: p.address,
            rssi: p.rssi,
            peripheral,
          });
        }
      });

      noble.startScanningAsync([], false).catch((err: Error) => {
        clearTimeout(timer);
        noble.removeAllListeners('discover');
        reject(err);
      });
    });
  }

  async connect(device: BleDevice): Promise<BleConnection> {
    const conn = new BleConnection(device);
    await conn.connect();
    return conn;
  }
}
