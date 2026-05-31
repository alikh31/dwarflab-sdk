# @alikh/dwarflab-ble

BLE (Bluetooth Low Energy) communication package for DWARFLAB DWARF telescopes. Used for initial WiFi configuration and device discovery before establishing a network connection.

> **Unofficial / independent project.** Not affiliated with, authorized, or
> endorsed by DWARFLAB. "DWARF" and "DWARFLAB" are trademarks of their respective
> owner and are used only to describe the hardware this package talks to. The
> protocol was derived by observing a telescope's own traffic and may be incomplete
> or change between firmware versions. Use at your own risk.

**Node.js only** — uses `@abandonware/noble` for BLE access.

## Installation

```bash
npm install @alikh/dwarflab-ble
```

### Prerequisites

BLE access requires platform-specific setup. See the [noble documentation](https://github.com/abandonware/noble#prerequisites) for your OS:

- **macOS**: Works out of the box
- **Linux**: Requires `libbluetooth-dev` and proper permissions (`sudo setcap cap_net_raw+eip $(eval readlink -f $(which node))`)
- **Windows**: Requires a compatible BLE dongle and WinUSB driver

## Quick Start

```typescript
import { DwarfBle } from '@alikh/dwarflab-ble';

const ble = new DwarfBle();

// Scan for nearby DWARF telescopes (filters advertisement names starting with "DWARF")
const devices = await ble.scan({ timeout: 10000 });
console.log('Found:', devices);
// [{ name: 'DWARF3_XXXX', address: 'aa:bb:cc:dd:ee:ff', rssi: -45, peripheral: ... }]

// Connect to a device
const connection = await ble.connect(devices[0]);

// Read the current device configuration
const config = await connection.getConfig();
console.log('WiFi mode:', config.wifiMode); // number (firmware-defined mode code)
console.log('Current SSID:', config.ssid);
console.log('Device IP:', config.ip);

// Put the telescope into STA mode (join your home WiFi).
// The device replies with its new LAN IP — use THIS ip to reach it afterward;
// getConfig() does not reflect the new state on current firmware.
const result = await connection.setStaMode({
  ssid: 'MyHomeWiFi',
  password: process.env.WIFI_PASSWORD!, // never hard-code a password
});
console.log('STA result code:', result.code);
console.log('Connect to the telescope at:', result.ip);

// Switch back to AP mode (telescope hosts its own hotspot).
// NOTE: AP SSID/password are fixed in firmware and cannot be changed over BLE,
// so setApMode takes no effective credentials.
await connection.setApMode({ ssid: '', password: '' });

// Disconnect
await connection.disconnect();
```

## API

### DwarfBle

The main entry point for BLE operations.

#### `scan(options?: ScanOptions): Promise<BleDevice[]>`

Scans for nearby DWARF telescopes, keeping only devices whose BLE advertisement
name starts with `DWARF` (override via `namePrefix`).

```typescript
interface ScanOptions {
  timeout?: number;    // Scan duration in ms (default: 10000)
  namePrefix?: string; // Advertisement name prefix to match (default: 'DWARF')
}

interface BleDevice {
  name: string;
  address: string;
  rssi: number;
  peripheral: unknown; // underlying noble peripheral, passed to connect()
}
```

#### `connect(device: BleDevice): Promise<BleConnection>`

Establishes a BLE GATT connection to the specified device.

### BleConnection

Manages the BLE connection and provides WiFi configuration methods.

#### `getConfig(): Promise<DeviceConfig>`

Reads the current device WiFi configuration.

#### `setStaMode(config: WifiConfig): Promise<StaResult>`

Configures the telescope to join an existing WiFi network (Station mode). The
device responds with its assigned LAN IP. Use the returned `ip` to reach the
telescope afterward — `getConfig()` does not reflect the new state on current
firmware, so polling it will not help.

#### `setApMode(config: WifiConfig): Promise<void>`

Switches the telescope to Access Point mode (it hosts its own hotspot). The AP
SSID and password are fixed in firmware and **cannot be changed over BLE**, so the
`WifiConfig` argument is accepted only for API symmetry and is not applied.

#### `getApInfo(): Promise<{ ssid: string; password: string }>`

Reads the telescope's current AP SSID and password without restarting it.

#### `scanWifi(): Promise<Array<{ ssid: string; signal: number; security: string }>>`

Asks the telescope to scan for nearby WiFi networks.

#### `disconnect(): Promise<void>`

Closes the BLE connection.

### Types

```typescript
interface WifiConfig {
  ssid: string;
  password: string;
}

interface DeviceConfig {
  state: number;     // device state code
  wifiMode: number;  // firmware-defined WiFi mode code
  apMode: number;
  autoStart: number;
  ssid: string;      // current SSID
  password: string;  // current WiFi password (do not log)
  ip: string;        // current LAN IP
  apCountry: string;
}

interface StaResult {
  code: number;  // result code from the device
  ssid: string;
  ip: string;    // the telescope's LAN IP after joining the network
  password: string; // echoed credential (do not log)
}
```

> **Never print or log a literal WiFi password.** `DeviceConfig.password` and
> `StaResult.password` may echo a real credential — treat them as secrets.

## BLE Protocol Details

DWARFLAB telescopes use a single BLE service with two characteristics:

| UUID | Direction | Purpose |
|------|-----------|---------|
| `ffe0` | Service | Main BLE service |
| `ffe1` | Write | Send commands (ReqGetconfig, ReqSta, ReqAp) |
| `ffe2` | Notify | Receive responses (ResGetconfig, ResSta, ResAp) |

Commands are serialized as protobuf messages and written to the `ffe1` characteristic. Responses arrive as notifications on `ffe2`.

## License

MIT
