# @alikh/dwarflab-sdk

TypeScript SDK for controlling DWARFLAB DWARF smart telescopes over WebSocket and HTTP. Works in both browser and Node.js environments.

> **Unofficial / independent project.** Not affiliated with, authorized, or
> endorsed by DWARFLAB. "DWARF" and "DWARFLAB" are trademarks of their respective
> owner and are used only to describe the hardware this SDK talks to. The protocol
> was derived by observing a telescope's own network traffic and may be incomplete
> or change between firmware versions. Use at your own risk.

## Installation

```bash
npm install @alikh/dwarflab-sdk

# Node.js also needs a WebSocket implementation
npm install ws
```

## Quick Start

```typescript
import { DwarfClient, DeviceType, Command } from '@alikh/dwarflab-sdk';
import WebSocket from 'ws'; // Only needed in Node.js

const dwarf = new DwarfClient({
  host: '192.168.88.1',
  deviceType: DeviceType.DWARF3,
  WebSocket, // Omit in browser
});

await dwarf.connect();

// Take a photo with the telephoto camera
await dwarf.cameraTele.openCamera();
await dwarf.cameraTele.setExposure(5);
await dwarf.cameraTele.takePhoto();

// Astrophotography workflow — set location first, then calibrate
await dwarf.system.setLocation(-122.4, 37.7); // lon, lat — required before astro ops
await dwarf.astro.startCalibration(-122.4, 37.7);
await dwarf.astro.gotoDSO(83.822, -5.391, 'M42');
await dwarf.astro.startLiveStacking();

// Listen for notifications (battery level updates)
const unsubscribe = dwarf.on(Command.NOTIFY_ELE, (packet, decoded) => {
  console.log('Battery level:', decoded.level); // percent, 0–100
});

// HTTP API
const deviceInfo = await dwarf.device.getDeviceInfo();
const media = await dwarf.album.getMediaList(0, 0, 20);

// Cleanup
unsubscribe();
dwarf.disconnect();
```

## Device support

The SDK speaks the DWARF WebSocket/HTTP protocol, which is shared across the DWARF
family. The device IDs the SDK actually recognizes are:

| Device | `DeviceType` | Status |
|--------|--------------|--------|
| DWARF 3 | `DeviceType.DWARF3` | ✅ **Verified** on real hardware |
| DWARF 2 | `DeviceType.DWARF2` | ⚠️ Protocol-compatible, **untested** |
| DWARF 3 Plus | `DeviceType.DWARF3B` | ⚠️ Protocol-compatible, **untested** |
| DWARF Mini | `DeviceType.DWARF_MINI` | ⚠️ Protocol-compatible, **untested** |

Only the DWARF 3 has been validated against physical hardware. The other models
share the same command surface and are expected to work, but are unverified. There
is no DWARF 3 Pro, Bilbo, DWARF 4, or Dragon — those were entries in older builds
and are not real devices.

## Client Options

```typescript
interface DwarfClientOptions {
  host: string;           // Telescope IP (default WiFi: '192.168.88.1')
  port?: number;          // WebSocket port (default: 9900)
  httpPort?: number;      // HTTP API port (default: 8082)
  deviceType?: DeviceType; // Device model (default: DWARF3)
  WebSocket?: unknown;    // WebSocket constructor for Node.js (pass `ws`)
  reconnect?: boolean;    // Auto-reconnect on disconnect (default: true)
  reconnectDelay?: number; // Initial reconnect delay ms (default: 1000)
  maxReconnectDelay?: number; // Max backoff delay ms (default: 30000)
  requestTimeout?: number; // Command timeout ms (default: 10000)
  logLevel?: LogLevel;    // 'debug' | 'info' | 'warn' | 'error' (default: 'warn')
}
```

## WebSocket Modules

All modules are accessed as properties on the `DwarfClient` instance. Together they
expose 310+ telescope commands:

| Property | Module | Methods | Description |
|----------|--------|---------|-------------|
| `cameraTele` | CameraTeleModule | 47 | Telephoto camera control |
| `cameraWide` | CameraWideModule | 36 | Wide-angle camera control |
| `astro` | AstroModule | 33 | Astrophotography workflows |
| `system` | SystemModule | 7 | Time, location, CPU mode |
| `power` | PowerModule | 6 | RGB LED, power, reboot |
| `motor` | MotorModule | 6 | Joystick, slew, dual-camera |
| `tracking` | TrackingModule | 13 | Object tracking, sentry mode |
| `focus` | FocusModule | 8 | Auto/manual focus |
| `panorama` | PanoramaModule | 12 | Panorama capture |
| `schedule` | ScheduleModule | 8 | Shooting schedules |
| `taskCenter` | TaskCenterModule | 8 | Task management |
| `params` | ParamsModule | 7 | Cross-camera parameter control |

## HTTP API

| Property | API | Description |
|----------|-----|-------------|
| `device` | DeviceHttpApi | Device info, factory reset, logs |
| `album` | AlbumHttpApi | Media listing, deletion, FITS files |
| `firmware` | FirmwareHttpApi | Firmware updates, camera config |

## Notifications

The telescope pushes real-time notifications over WebSocket. Listen for them with `dwarf.on()`:

```typescript
import { Command } from '@alikh/dwarflab-sdk';

// Battery updates — decoded.level is the charge percentage (0–100)
dwarf.on(Command.NOTIFY_ELE, (packet, decoded) => {
  console.log('Battery level:', decoded.level);
});

// Live stacking progress
dwarf.on(Command.NOTIFY_PROGRASS_CAPTURE_RAW_LIVE_STACKING, (packet, decoded) => {
  console.log('Stacking progress:', decoded);
});

// Goto state changes
dwarf.on(Command.NOTIFY_STATE_ASTRO_GOTO, (packet, decoded) => {
  console.log('Goto state:', decoded);
});
```

38 notification event types are available. See the [notifications docs](../../docs/notifications.md) for the full list.

## Advanced: Raw Protocol Access

For commands not covered by the high-level module APIs:

```typescript
import { Command, encodePayload, decodeResponse, proto } from '@alikh/dwarflab-sdk';

// Send any command with raw params
const result = await dwarf.sendCommand(Command.ASTRO_START_CALIBRATION, {
  lon: -122.4,
  lat: 37.7,
});

// Direct protobuf encoding
const payload = encodePayload(Command.CAMERA_TELE_SET_EXP, { value: 5 });

// Access raw protobuf types
const msg = proto.camera.ReqOpenCamera.create({ binning: 0 });
const bytes = proto.camera.ReqOpenCamera.encode(msg).finish();
```

## License

MIT
