# BLE Package Guide

The `@alikh/dwarflab-ble` package provides Bluetooth Low Energy communication for initial WiFi setup of DWARFLAB telescopes. This is typically the first step when connecting to a new or factory-reset device.

## When to Use BLE

BLE is used **before** the telescope is connected to a WiFi network. The typical flow:

1. **Scan** for nearby DWARF devices via BLE
2. **Connect** to the device over BLE
3. **Configure WiFi** (AP or STA mode)
4. **Disconnect** BLE
5. **Connect** via WebSocket using `@alikh/dwarflab-sdk`

## Installation

```bash
npm install @alikh/dwarflab-ble
```

### Prerequisites

BLE requires native system access. Platform setup:

**macOS:**
- Works out of the box with Xcode Command Line Tools installed

**Linux:**
```bash
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
sudo setcap cap_net_raw+eip $(eval readlink -f $(which node))
```

**Windows:**
- Requires a compatible BLE USB dongle
- Install WinUSB driver via [Zadig](https://zadig.akeo.ie/)

## Usage

### Scanning for Devices

```typescript
import { DwarfBle } from '@alikh/dwarflab-ble';

const ble = new DwarfBle();

// Scan for 10 seconds
const devices = await ble.scan({ timeout: 10000 });

for (const device of devices) {
  console.log(`${device.name} (${device.address}) RSSI: ${device.rssi}`);
}
// Output:
// DWARF3_A1B2 (aa:bb:cc:dd:ee:ff) RSSI: -42
// DWARF3_C3D4 (11:22:33:44:55:66) RSSI: -68
```

The scanner filters for devices whose BLE advertisement name starts with `DWARF`.

### Connecting to a Device

```typescript
const connection = await ble.connect(devices[0]);
```

### Reading Configuration

```typescript
const config = await connection.getConfig();
console.log('WiFi mode:', config.wifiMode); // numeric mode flag
console.log('SSID:', config.ssid);
console.log('IP:', config.ip);
```

**Response type:**
```typescript
interface DeviceConfig {
  state: number;
  wifiMode: number;
  apMode: number;
  autoStart: number;
  ssid: string;
  password: string;
  ip: string;
  apCountry: string;
}
```

### Setting WiFi Mode

**Station mode** (telescope joins your existing WiFi):
```typescript
const result = await connection.setStaMode({
  ssid: 'MyHomeWiFi',
  password: 'your-wifi-password',
});
console.log('Device LAN IP:', result.ip);
```

The device replies *immediately* with its LAN IP (and the SSID it joined). On
current firmware, `getConfig()` does **not** reflect the new STA state, and
polling it won't help — so always use the `ip` from the returned `StaResult` to
connect via the main SDK.

**Return type:**
```typescript
interface StaResult {
  code: number;
  ssid: string;
  ip: string;
  password: string;
}
```

**Access Point mode** (telescope hosts its own hotspot):
```typescript
await connection.setApMode({
  ssid: 'ignored',
  password: 'ignored',
});
```

This switches the device into AP mode. Note that **AP credentials cannot be
changed over BLE on current firmware** — the device keeps its fixed SSID
(e.g. `DWARF3_XXXXXX`) and its factory-default Wi-Fi password (printed on the
device). The `WifiConfig` argument is accepted only for API symmetry and is not
applied. In AP mode the telescope creates a WiFi network; connect your computer
to it, then use `192.168.88.1` as the host.

### Reading AP Info

Read the device's current AP SSID and password without switching modes:

```typescript
const ap = await connection.getApInfo(); // { ssid, password }
console.log('AP SSID:', ap.ssid);
```

### Scanning for WiFi Networks

Ask the device to scan for nearby WiFi networks (useful before calling `setStaMode`):

```typescript
const networks = await connection.scanWifi();
for (const net of networks) {
  console.log(net.ssid, net.signal, net.security);
}
// Returns Array<{ ssid: string; signal: number; security: string }>
```

### Disconnecting

```typescript
await connection.disconnect();
```

## Complete Example

```typescript
import { DwarfBle } from '@alikh/dwarflab-ble';
import { DwarfClient, DeviceType } from '@alikh/dwarflab-sdk';
import WebSocket from 'ws';

// Step 1: BLE WiFi setup
const ble = new DwarfBle();
const devices = await ble.scan({ timeout: 10000 });

if (devices.length === 0) {
  console.log('No DWARF devices found');
  process.exit(1);
}

const conn = await ble.connect(devices[0]);
const sta = await conn.setStaMode({ ssid: 'MyWiFi', password: 'your-wifi-password' });
await conn.disconnect();

// The device returns its LAN IP immediately — use it directly.
console.log('Telescope joined WiFi at', sta.ip);

// Step 2: Connect via SDK
const dwarf = new DwarfClient({
  host: sta.ip, // Telescope's IP on your network, from setStaMode
  deviceType: DeviceType.DWARF3,
  WebSocket,
});

await dwarf.connect();
const info = await dwarf.device.getDeviceInfo();
console.log('Connected to:', info.deviceName);
```

## BLE Protocol Details

### Service and Characteristics

| UUID | Type | Description |
|------|------|-------------|
| `ffe0` | Service | Main BLE service |
| `ffe1` | Write | Command characteristic |
| `ffe2` | Notify | Response characteristic |
| `9999` | Write + Notify | Single combined characteristic |

DWARF 3 uses a **single `9999` characteristic** for both writing commands and
receiving notifications. On connect, the SDK first looks for separate `ffe1`
(write) and `ffe2` (notify) characteristics, and falls back to the combined
`9999` characteristic if those aren't present. You don't need to pick one — the
connection discovers all characteristics and chooses automatically.

### Message Format

BLE messages use the same protobuf types as the WebSocket protocol:

- **ReqGetconfig** / **ResGetconfig** - Read current WiFi configuration
- **ReqSta** / **ResSta** - Set station mode (SSID/password) and return the LAN IP
- **ReqAp** / **ResAp** - Switch to AP mode / read AP info
- **ReqGetwifilist** / **ResWifilist** - Scan for nearby WiFi networks

Commands are written to the write characteristic and responses arrive as
notifications on the notify characteristic (which may be the same `9999`
characteristic).

### Packet Framing

Larger protobuf messages are split into BLE-compatible chunks (typically 20
bytes per write, based on the negotiated MTU). Each packet carries a command id
and sequence numbers, and the payload is protected by a **CRC-16/MODBUS**
checksum. The connection manager handles chunking on send and reassembly on
receive automatically.

## Limitations

- **Node.js only** - BLE requires native system APIs not available in browsers
- **Single connection** - Only one BLE connection at a time per `DwarfBle` instance
- **Range** - BLE range is typically 5-10 meters
- **Speed** - BLE is slow; use WiFi for all telescope control after initial setup
