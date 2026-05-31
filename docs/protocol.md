# Protocol Details

This document covers the binary WebSocket protocol used by DWARFLAB telescopes.

## Wire Format

All WebSocket communication uses binary frames containing protobuf-encoded `WsPacket` messages.

### WsPacket Structure

```protobuf
message WsPacket {
  int32 majorVersion = 1;   // Always 1
  int32 minorVersion = 2;   // Always 20
  int32 deviceId = 3;       // Target device (0 for default)
  int32 moduleId = 4;       // Hardware module ID
  int32 cmd = 5;            // Command ID
  int32 type = 6;           // Message type
  bytes data = 7;           // Protobuf-encoded payload
  string clientId = 8;      // Request correlation ID
}
```

### Message Types

| Value | Name | Description |
|-------|------|-------------|
| 0 | REQUEST | Client to device command |
| 1 | RESPONSE | Device reply to a request |
| 2 | NOTIFICATION | Unsolicited device event push |
| 3 | REPLY | Acknowledgment reply |

### Request-Response Flow

1. Client generates a unique `clientId` (e.g., `sdk_1`, `sdk_2`, ...)
2. Client encodes a request protobuf message into the `data` field
3. Client wraps it in a `WsPacket` with `type=0` (REQUEST) and sends the binary frame
4. Device responds with a `WsPacket` where `type=1` (RESPONSE), same `cmd`, and same `clientId`
5. The SDK uses `cmd:clientId` as a correlation key to match responses to pending requests

```
Client                          Telescope
  |                                |
  |-- WsPacket(cmd=10000,         |
  |   type=0, clientId="sdk_1",   |
  |   data=ReqOpenCamera{})  ---> |
  |                                |
  |   <--- WsPacket(cmd=10000,    |
  |        type=1, clientId="sdk_1",
  |        data=ComResponse{code:0})
  |                                |
```

### Notification Flow

Notifications are unsolicited pushes from the device with `type=2`. They have no `clientId`.

```
Client                          Telescope
  |                                |
  |   <--- WsPacket(cmd=15210,    |
  |        type=2,                 |
  |        data=NotifyEle{         |
  |          percentage: 85,       |
  |          voltage: 12.1         |
  |        })                      |
  |                                |
```

## Module IDs

Each command belongs to a hardware module identified by its command range:

| ID | Module | Command Range |
|----|--------|--------------|
| 1 | CAMERA_TELE | 10000-10499 |
| 2 | ASTRO | 11000-11499 |
| 3 | CAMERA_WIDE | 12000-12499 |
| 4 | SYSTEM | 13000-13299 |
| 5 | RGB_POWER | 13500-13799 |
| 6 | MOTOR | 14000-14499 |
| 7 | TRACK | 14800-14899 |
| 8 | FOCUS | 15000-15199 |
| 9 | NOTIFY | 15200-15499 |
| 10 | PANORAMA | 15500-15599 |
| 11 | ITIPS | 15700-15799 |
| 12 | SHOOTING_SCHEDULE | 16100-16399 |
| 13 | TASK_CENTER | 16400-16599 |
| 14 | PARAM | 16700-16799 |

## Command-to-Protobuf Type Mapping

Each command has a registered request and response protobuf type. The codec registry maps these:

```typescript
import { encodePayload, decodeResponse, Command } from '@alikh/dwarflab-sdk';

// Encode a request
const payload = encodePayload(Command.ASTRO_START_CALIBRATION, {
  lon: -122.4,
  lat: 37.7,
});
// Uses: dwarflab.astro.ReqStartCalibration.encode(...)

// Decode a response
const decoded = decodeResponse(Command.ASTRO_START_CALIBRATION, responseData);
// Uses: dwarflab.base.ComResponse.decode(...)
```

### Common Response Types

Most commands return `ComResponse`:
```protobuf
message ComResponse {
  int32 code = 1;    // 0 = success, negative = error
}
```

Some commands have specialized responses:
- `ResGetAllParams` - Camera parameter dump
- `ResCheckDarkFrame` - Dark frame availability
- `ResGetDeviceStateInfo` - Full device state
- `ResSwitchShootingMode` - Mode switch result

## Error Codes

The protocol defines 129 error codes. All error values are negative integers. Code `0` means success.

Common errors:

| Code | Description |
|------|-------------|
| 0 | Success |
| -10500 | Camera open failed |
| -10504 | Camera already open |
| -11500 | Astro operation failed |
| -11504 | Calibration failed |
| -11506 | Plate solving failed |
| -11508 | Goto failed |
| -14500 | Motor error |
| -15000 | Focus error |

Use `getErrorMessage(code)` to get a human-readable description:

```typescript
import { getErrorMessage } from '@alikh/dwarflab-sdk';

console.log(getErrorMessage(-11504)); // "Calibration failed"
console.log(getErrorMessage(-99999)); // "Unknown error: -99999"
```

## Packet Encoding/Decoding

### Low-Level API

```typescript
import {
  encodePacket,
  decodePacket,
  Command,
  MessageType,
} from '@alikh/dwarflab-sdk';

// Encode a raw packet
const packetBytes = encodePacket(
  Command.CAMERA_TELE_OPEN_CAMERA,  // cmd
  MessageType.REQUEST,               // type
  payloadBytes,                      // data (Uint8Array)
  'my-client-id',                    // clientId
  0,                                 // deviceId
);

// Decode a received packet
const packet = decodePacket(receivedBytes);
console.log(packet.cmd);       // 10000
console.log(packet.type);      // 0
console.log(packet.clientId);  // "my-client-id"
console.log(packet.moduleId);  // 1 (CAMERA_TELE)
console.log(packet.data);      // Uint8Array
```

### Raw Protobuf Access

For advanced usage, the full generated protobuf namespace is exported:

```typescript
import { proto } from '@alikh/dwarflab-sdk';

// Encode directly
const msg = proto.camera.ReqOpenCamera.create({ binning: 0 });
const bytes = proto.camera.ReqOpenCamera.encode(msg).finish();

// Decode directly
const decoded = proto.camera.ResGetAllParams.decode(someBytes);

// Available namespaces:
// proto.base     - WsPacket, ComResponse, ComResWithInt, etc.
// proto.camera   - Camera request/response types
// proto.astro    - Astrophotography types
// proto.system   - System types
// proto.rgb      - RGB/power types
// proto.motor    - Motor types
// proto.track    - Tracking types
// proto.focus    - Focus types
// proto.panorama - Panorama types
// proto.task_center - Task center types
// proto.param    - Parameter types
// proto.voice    - Voice assistant types
```

## Proto Definitions

The `.proto` definitions that describe the wire format live in the `proto/`
directory at the repository root (16 files). The committed TypeScript bindings
in `packages/sdk/src/generated/` are produced from them with `protobufjs-cli`
(`pbjs` + `pbts`).

These definitions were derived by observing the telescope's own
request/response traffic and are an independent, unofficial description of the
protocol — they are **not** an official DWARFLAB schema and may be incomplete or
imprecise for commands this SDK does not exercise.
