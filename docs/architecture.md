# Architecture

## Overview

The DWARFLAB SDK is organized as a monorepo with two packages:

```
dwarflab-sdk/
├── packages/
│   ├── sdk/          @alikh/dwarflab-sdk    Browser + Node.js
│   └── ble/          @alikh/dwarflab-ble    Node.js only
├── proto/            Protocol buffer definitions (.proto)
└── docs/             Documentation
```

The core SDK (`@alikh/dwarflab-sdk`) is browser-compatible and handles all telescope communication over WebSocket (port 9900) and HTTP (port 8082). The BLE package (`@alikh/dwarflab-ble`) is Node.js-only and handles Bluetooth Wi-Fi setup using `@abandonware/noble`.

## SDK Package Structure

```
packages/sdk/src/
├── index.ts                  Barrel export
├── client.ts                 DwarfClient - main entry point
├── connection/
│   ├── websocket-transport.ts   WebSocket with reconnect + request correlation
│   └── http-transport.ts        HTTP fetch wrapper
├── protocol/
│   ├── packet.ts             WsPacket binary encode/decode
│   ├── commands.ts           310+ command ID enum
│   ├── modules.ts            16 module IDs + command-to-module mapping
│   ├── message-types.ts      Request, Response, Notification, Reply
│   ├── error-codes.ts        129 error codes with messages
│   └── codec.ts              Command-to-protobuf type registry
├── generated/
│   ├── proto.js              protobufjs static module (90K lines)
│   └── proto.d.ts            TypeScript declarations (39K lines)
├── modules/                  High-level module APIs (12 files)
│   ├── camera-tele.ts
│   ├── camera-wide.ts
│   ├── astro.ts
│   ├── system.ts
│   ├── power.ts
│   ├── motor.ts
│   ├── tracking.ts
│   ├── focus.ts
│   ├── panorama.ts
│   ├── schedule.ts
│   ├── task-center.ts
│   └── params.ts
├── http/                     HTTP REST API wrappers
│   ├── device.ts
│   ├── album.ts
│   └── firmware.ts
├── notifications/
│   ├── emitter.ts            Typed notification event emitter
│   └── types.ts              38 notification event definitions
├── state/
│   ├── device-state.ts       Reactive device state tracker
│   └── enums.ts              DeviceType, CaptureState, MotorState, etc.
└── utils/
    ├── logger.ts             Leveled logger
    └── errors.ts             DwarfError class
```

## Two-Layer Design

### Layer 1: Protocol (Low-Level)

The protocol layer handles binary serialization, packet framing, and protobuf encoding/decoding. It is built on a set of `.proto` definitions that describe the telescope's WebSocket and BLE messages.

- **Protobuf types** are statically generated via `protobufjs-cli` (`pbjs` + `pbts`)
- **WsPacket** is the binary envelope wrapping all WebSocket messages
- **Codec registry** maps command IDs to their protobuf request/response types

```
Client code  -->  Module API  -->  codec.encodePayload()  -->  packet.encodePacket()  -->  WebSocket
WebSocket    -->  packet.decodePacket()  -->  codec.decodeResponse()  -->  Module API  -->  Client code
```

### Layer 2: Modules (High-Level)

Each hardware module on the telescope has a corresponding TypeScript class with ergonomic methods:

```typescript
// Instead of:
await dwarf.sendCommand(Command.ASTRO_START_GOTO_DSO, { ra: 83.822, dec: -5.391, targetName: 'M42' });

// You write:
await dwarf.astro.gotoDSO(83.822, -5.391, 'M42');
```

## Communication Protocols

### WebSocket (Port 9900)

Binary protobuf messages over WebSocket. All telescope control commands use this channel.

**Packet structure:**
```
WsPacket {
  majorVersion: 1
  minorVersion: 20
  deviceId: int
  moduleId: int      // Which hardware module
  cmd: int           // Command ID (10000-16706)
  type: int          // 0=request, 1=response, 2=notification, 3=reply
  data: bytes        // Protobuf-encoded payload
  clientId: string   // For request-response correlation
}
```

### HTTP (Port 8082)

JSON REST API for device management, media browsing, and firmware updates.

**Response format:**
```json
{
  "data": "<T>",
  "code": 0,
  "message": null
}
```

### BLE

Protobuf messages over BLE GATT characteristics. Used exclusively for WiFi configuration before network connectivity is established.

## Module Command Ranges

Commands are organized into modules based on their numeric ID:

| Module | Range | Description |
|--------|-------|-------------|
| CAMERA_TELE | 10000-10499 | Telephoto camera |
| ASTRO | 11000-11499 | Astrophotography |
| CAMERA_WIDE | 12000-12499 | Wide-angle camera |
| SYSTEM | 13000-13299 | System settings |
| RGB_POWER | 13500-13799 | LED and power |
| MOTOR | 14000-14499 | Motor control |
| TRACK | 14800-14899 | Object tracking |
| FOCUS | 15000-15199 | Focus control |
| NOTIFY | 15200-15499 | Notifications |
| PANORAMA | 15500-15599 | Panorama capture |
| ITIPS | 15700-15799 | Interactive tips |
| SHOOTING_SCHEDULE | 16100-16399 | Scheduled shoots |
| TASK_CENTER | 16400-16599 | Task management |
| PARAM | 16700-16799 | Parameter control |

## Build Output

Both packages produce dual ESM + CJS bundles with TypeScript declarations:

```
dist/
├── index.mjs       ESM module
├── index.cjs       CommonJS module
├── index.d.ts      TypeScript declarations (ESM)
└── index.d.cts     TypeScript declarations (CJS)
```
