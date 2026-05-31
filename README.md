# DWARFLAB SDK

> **Unofficial** TypeScript SDK for controlling [DWARFLAB](https://dwarflab.com) DWARF smart telescopes over WebSocket, HTTP, and BLE.

[![CI](https://github.com/alikh31/dwarflab-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/alikh31/dwarflab-sdk/actions/workflows/ci.yml)
[![npm @alikh/dwarflab-sdk](https://img.shields.io/npm/v/@alikh/dwarflab-sdk.svg?label=%40alikh%2Fdwarflab-sdk)](https://www.npmjs.com/package/@alikh/dwarflab-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> [!IMPORTANT]
> This is an **independent, community-built** project. It is **not affiliated with,
> authorized, or endorsed by DWARFLAB**. "DWARF" and "DWARFLAB" are trademarks of
> their respective owner and are used here only to describe the hardware this SDK
> talks to. The protocol description was derived by observing a telescope's own
> network traffic; it may be incomplete or change between firmware versions. Use at
> your own risk — see the [disclaimer](#disclaimer).

## Packages

| Package | Description | Runtime |
|---------|-------------|---------|
| [`@alikh/dwarflab-sdk`](./packages/sdk/) | Core SDK — WebSocket + HTTP + protobuf protocol | Browser + Node.js |
| [`@alikh/dwarflab-ble`](./packages/ble/) | BLE Wi-Fi setup and device discovery | Node.js only |

## Quick Start

```bash
npm install @alikh/dwarflab-sdk
```

### Browser

```typescript
import { DwarfClient, DeviceType } from '@alikh/dwarflab-sdk';

const dwarf = new DwarfClient({
  host: '192.168.88.1',
  deviceType: DeviceType.DWARF3,
});

await dwarf.connect();
await dwarf.cameraTele.openCamera();
await dwarf.cameraTele.takePhoto();
dwarf.disconnect();
```

### Node.js

```typescript
import { DwarfClient, DeviceType } from '@alikh/dwarflab-sdk';
import WebSocket from 'ws'; // Node.js needs a WebSocket implementation

const dwarf = new DwarfClient({
  host: '192.168.88.1',
  deviceType: DeviceType.DWARF3,
  WebSocket,
});

await dwarf.connect();
await dwarf.system.setLocation(-122.4, 37.7); // lon, lat — required before astro ops
await dwarf.astro.startCalibration(-122.4, 37.7);
await dwarf.astro.gotoDSO(83.822, -5.391, 'M42');
await dwarf.astro.startLiveStacking();
```

## Features

- **310+ telescope commands** across 12 control modules (190+ ergonomic methods)
- **Typed protobuf protocol** with request/response encoding and decoding
- **WebSocket transport** with automatic reconnection and request/response correlation
- **HTTP REST API** for device info, album browsing, and firmware config
- **38 typed notification events** for real-time status (battery, stacking progress, GoTo state, …)
- **Reactive device-state tracking** (battery, temperature, SD card, …)
- **Dual ESM + CJS output** with full TypeScript declarations
- **BLE package** for initial Wi-Fi setup over Bluetooth (Node.js)

## Device support

The SDK speaks the DWARF WebSocket/HTTP/BLE protocol. The protocol is shared
across the DWARF family, but the device IDs the SDK actually recognizes are:

| Device | `DeviceType` | Status |
|--------|--------------|--------|
| DWARF 3 | `DeviceType.DWARF3` | ✅ **Verified** on real hardware (firmware v1.5.x) |
| DWARF 2 | `DeviceType.DWARF2` | ⚠️ Protocol-compatible, **untested** |
| DWARF 3 Plus | `DeviceType.DWARF3B` | ⚠️ Protocol-compatible, **untested** |
| DWARF Mini | `DeviceType.DWARF_MINI` | ⚠️ Protocol-compatible, **untested** |

All devices use the default Wi-Fi AP `192.168.88.1` and WebSocket port `9900`.

> Only the DWARF 3 has been validated against physical hardware. The other models
> share the same command surface and are expected to work, but are unverified —
> reports (success or failure) are very welcome via [issues](https://github.com/alikh31/dwarflab-sdk/issues).

## Feature support matrix

| Area | Status | Notes |
|------|--------|-------|
| Connection (WebSocket + reconnect) | ✅ Verified | Request/response correlation, keepalive |
| HTTP API (device info, album, firmware) | ✅ Verified | |
| Tele/wide camera control + params | ✅ Verified | Exposure, gain, WB, ISP, RTSP bitrate, etc. |
| Photo / record / timelapse | ✅ Verified | |
| Burst | ✅ Verified | Requires `ShootingTech.BURST` first; firmware self-stops at N |
| Live stacking (tele + wide) | ✅ Verified | Needs calibration + GoTo done unless `forceStart` |
| Calibration / GoTo / EQ solving | ✅ Verified | Multi-step; progress arrives via notifications |
| Manual + auto focus | ✅ Verified | |
| Motor / joystick slew | ✅ Verified | |
| Object tracking / sentry | 🟡 Partial | Commands wired; not all paths hardware-verified |
| Panorama | 🟡 Partial | Commands wired; limited live testing |
| Shooting schedule | 🟡 Partial | Commands wired; limited live testing |
| Dark-frame management | 🟡 Partial | Commands wired |
| `setBurstCount` write-effect | 🟠 Unverified | Encodes + dispatches correctly; on-device effect unconfirmed |
| BLE Wi-Fi setup | 🟡 Partial | Verified on DWARF 3; framing + CRC unit-tested |

Legend: ✅ verified on hardware · 🟡 implemented, partially tested · 🟠 implemented, effect unverified.

## Architecture

```
DwarfClient
  ├── WebSocketTransport (port 9900) ── binary protobuf over WebSocket
  │     ├── cameraTele   ├── tracking   ├── schedule
  │     ├── cameraWide   ├── focus      ├── taskCenter
  │     ├── astro        ├── panorama   └── params
  │     ├── system       ├── motor
  │     └── power
  │
  └── HttpTransport (port 8082) ── JSON REST API
        ├── device    (device info, reset, logs)
        ├── album     (media listing, deletion, FITS)
        └── firmware  (updates, shooting-mode config)
```

See [`docs/architecture.md`](./docs/architecture.md) for the full breakdown.

## Documentation

- [Architecture](./docs/architecture.md) — how the SDK is structured
- [Modules API Reference](./docs/modules.md) — all 12 WebSocket modules and their methods
- [HTTP API Reference](./docs/http-api.md) — REST endpoints for device, album, firmware
- [Notifications](./docs/notifications.md) — the real-time event system
- [Protocol Details](./docs/protocol.md) — wire format, packet structure, protobuf types
- [BLE Package](./docs/ble.md) — Bluetooth Wi-Fi setup guide
- [Examples](./docs/examples.md) — common usage patterns

## Development

```bash
npm install        # install workspace dependencies
npm run build      # build all packages (ESM + CJS + d.ts)
npm test           # run the test suites
npm run typecheck  # type-check all packages
npm run lint       # lint sources

# Regenerate protobuf bindings after editing proto/*.proto:
npm run proto:generate
```

This is an npm-workspaces monorepo. The protobuf TypeScript bindings in
`packages/sdk/src/generated/` are committed (so consumers don't need the protobuf
toolchain) and are produced from `proto/*.proto` by `npm run proto:generate`.

## Roadmap

- [ ] Verify on additional hardware (DWARF 2, DWARF 3 Plus, DWARF Mini)
- [ ] Confirm the `setBurstCount` on-device write effect
- [ ] Higher-level helpers for the multi-step astro workflows (calibration → GoTo → stack state machines)
- [ ] Decode the remaining notification payloads still surfaced as raw bytes
- [ ] UI-free example scripts / a small CLI
- [ ] Expand automated test coverage (transport with a mock WebSocket, codec round-trips)
- [ ] Mosaic, sky-target-finder, and AI-enhance high-level wrappers

## Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). Hardware
reports for non-DWARF-3 models are especially valuable.

## Disclaimer

This software is provided "as is", without warranty of any kind. It controls
physical hardware (motors, focus, power) and communicates with your telescope at
a low level. The authors are not responsible for any damage, data loss, or
malfunction resulting from its use. It is not an official DWARFLAB product and is
not supported by DWARFLAB. Always supervise your telescope while it is under
program control.

## License

[MIT](./LICENSE)
