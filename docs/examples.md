# Examples

Common usage patterns for the DWARFLAB SDK.

## Basic Connection

### Browser

```typescript
import { DwarfClient, DeviceType } from '@alikh/dwarflab-sdk';

const dwarf = new DwarfClient({
  host: '192.168.88.1',
  deviceType: DeviceType.DWARF3,
});

await dwarf.connect();
console.log('Connected:', dwarf.connected);

// ... use the telescope ...

dwarf.disconnect();
```

### Node.js

```typescript
import { DwarfClient, DeviceType } from '@alikh/dwarflab-sdk';
import WebSocket from 'ws';

const dwarf = new DwarfClient({
  host: '192.168.88.1',
  deviceType: DeviceType.DWARF3,
  WebSocket,
  logLevel: 'info', // See connection logs
});

await dwarf.connect();
```

### With Custom Options

```typescript
const dwarf = new DwarfClient({
  host: '192.168.88.1',
  port: 9900,
  httpPort: 8082,
  deviceType: DeviceType.DWARF3,
  WebSocket,
  reconnect: true,
  reconnectDelay: 2000,
  maxReconnectDelay: 60000,
  requestTimeout: 15000,
  logLevel: 'debug',
});
```

---

## Taking a Photo

```typescript
// Open camera, configure, shoot
await dwarf.cameraTele.openCamera();
await dwarf.cameraTele.setExposure(2);       // 2 seconds
await dwarf.cameraTele.setGain(80);
await dwarf.cameraTele.setBrightness(50);
await dwarf.cameraTele.takePhoto();
await dwarf.cameraTele.closeCamera();
```

### Burst Mode

A burst is a bounded N-shot capture. Before starting it you must switch the
shooting *technique* to `BURST` — the firmware rejects `startBurst()` otherwise.
The shot count comes from the device's stored `BURST_COUNT` param, so the
`count` argument is optional and the firmware ignores it for the total. The
burst self-stops once it has fired all its shots, so you normally don't need to
call `stopBurst()` — watch `NOTIFY_BURST_STATE` for the running/idle transition.

```typescript
import { Command, ShootingTech } from '@alikh/dwarflab-sdk';

await dwarf.cameraTele.openCamera();

// Required: enter BURST technique first
await dwarf.taskCenter.switchShootingTech(ShootingTech.BURST);

// Watch the burst state: state 1 = running, terminal {} (state 0) = idle/done
dwarf.on(Command.NOTIFY_BURST_STATE, (packet, decoded) => {
  console.log('Burst state:', decoded);
});

// count is optional — the firmware uses its stored BURST_COUNT regardless
await dwarf.cameraTele.startBurst();

// To set how many shots a burst fires, change the BURST_COUNT param instead:
// await dwarf.cameraTele.setBurstCount(10);
```

### Timelapse

```typescript
await dwarf.cameraTele.openCamera();
await dwarf.cameraTele.startTimelapse(
  30,    // 30 second interval
  3600,  // 1 hour total
);

// Stop early if needed
// await dwarf.cameraTele.stopTimelapse();
```

---

## Astrophotography Workflow

Astro operations need a location set on the device first; without it,
calibration, GoTo and stacking fail. `setLocation` takes `(lon, lat)`.

### GoTo and Live Stacking

```typescript
import { Command } from '@alikh/dwarflab-sdk';

// Step 1: Set location and calibrate (both take lon, lat)
await dwarf.system.setLocation(-122.4, 37.7);
await dwarf.astro.startCalibration(-122.4, 37.7);

// Monitor calibration progress
dwarf.on(Command.NOTIFY_STATE_ASTRO_CALIBRATION, (packet, decoded) => {
  console.log('Calibration:', decoded);
});

// Step 2: GoTo target (Orion Nebula)
await dwarf.astro.gotoDSO(83.822, -5.391, 'M42');

// Monitor goto progress
dwarf.on(Command.NOTIFY_STATE_ASTRO_GOTO, (packet, decoded) => {
  console.log('GoTo:', decoded);
});

// Step 3: Start live stacking.
// irIndex is the device's current IR-filter index (-1 = none/unknown);
// forceStart=false lets the firmware run its calibration/GoTo preflight checks.
await dwarf.astro.startLiveStacking(-1, false);

// Monitor stacking progress
dwarf.on(Command.NOTIFY_PROGRASS_CAPTURE_RAW_LIVE_STACKING, (packet, decoded) => {
  console.log('Stacking:', decoded);
});

// Step 4: Stop after some time
setTimeout(async () => {
  await dwarf.astro.stopLiveStacking();
}, 300000); // 5 minutes
```

### One-Click GoTo (Calibrate + Slew + Stack)

```typescript
// Combines calibration, goto, and stacking in one command.
// Signature: oneClickGotoDSO(ra, dec, targetName?, lon?, lat?)
await dwarf.astro.oneClickGotoDSO(
  83.822,     // RA
  -5.391,     // Dec
  'M42',      // Target name
  -122.4,     // Longitude
  37.7,       // Latitude
);
```

### Solar System Targets

```typescript
// gotoSolarSystem(index, lon, lat, targetName?) — location is required.
// GoTo Moon (solar system index varies by firmware)
await dwarf.astro.gotoSolarSystem(0, -122.4, 37.7, 'Moon');

// GoTo Jupiter
await dwarf.astro.gotoSolarSystem(5, -122.4, 37.7, 'Jupiter');
```

### Dark Frame Calibration

```typescript
// Capture dark frames (cap on lens)
await dwarf.astro.startCaptureDark();

// Check if dark frames exist
const result = await dwarf.astro.checkDark();
console.log('Dark frames:', result);
```

---

## Camera Settings

### White Balance

```typescript
// Auto white balance
await dwarf.cameraTele.setWhiteBalanceMode(0);

// Manual color temperature
await dwarf.cameraTele.setWhiteBalanceMode(1);
await dwarf.cameraTele.setWhiteBalanceCT(5500); // Kelvin
```

### IR Cut Filter

```typescript
await dwarf.cameraTele.setIRCut(0);  // IR cut on (normal)
await dwarf.cameraTele.setIRCut(1);  // IR cut off (astrophotography)
```

### Get All Parameters

```typescript
const params = await dwarf.cameraTele.getAllParams();
console.log(params);
```

---

## Motor Control

The joystick is *polar*: `joystick(vectorAngle, vectorLength?)` where
`vectorAngle` is in degrees (0 = up/north, 90 = right/east) and `vectorLength`
is a magnitude from 0 to 1 (defaults to 1).

### Joystick

```typescript
// Move up-and-to-the-right at full speed (angle 45, length 1)
await dwarf.motor.joystick(45, 1);

// Move straight up at half speed
await dwarf.motor.joystick(0, 0.5);

// Stop
await dwarf.motor.joystickStop();

// Nudge a fixed angle (also polar: angle in degrees, length 0..1)
await dwarf.motor.joystickFixedAngle(90, 1);
```

### Dual Camera Linkage

```typescript
// Link wide and tele camera movement
await dwarf.motor.dualCameraLinkage(true);

// Unlink
await dwarf.motor.dualCameraLinkage(false);
```

---

## Focus Control

```typescript
import { Command } from '@alikh/dwarflab-sdk';

// Auto focus
await dwarf.focus.autoFocus();

// Manual focus - step in
await dwarf.focus.manualSingleStep(0);

// Manual focus - step out
await dwarf.focus.manualSingleStep(1);

// Continuous focus
await dwarf.focus.startManualContinuous(0);
// ... wait ...
await dwarf.focus.stopManualContinuous();

// Astro auto focus (slow, precise)
await dwarf.focus.startAstroAutoFocus();
dwarf.on(Command.NOTIFY_ASTRO_AUTO_FOCUS_STATE, (packet, decoded) => {
  console.log('Astro AF:', decoded);
});
```

---

## Object Tracking

```typescript
import { Command } from '@alikh/dwarflab-sdk';

// Start tracking at screen coordinates
await dwarf.tracking.startTrack(500, 400);

// Stop tracking
await dwarf.tracking.stopTrack();

// Sentry mode (auto-detect and track)
await dwarf.tracking.startSentryMode();
dwarf.on(Command.NOTIFY_SENTRY_MODE_STATE, (packet, decoded) => {
  console.log('Sentry:', decoded);
});
```

---

## Panorama

```typescript
import { Command } from '@alikh/dwarflab-sdk';

// Capture a 3x3 panorama grid
await dwarf.panorama.startGrid(3, 3);

dwarf.on(Command.NOTIFY_PANORAMA_STATE, (packet, decoded) => {
  console.log('Panorama:', decoded);
});

// Stop if needed
// await dwarf.panorama.stop();
```

---

## System & Power

```typescript
// Sync time
await dwarf.system.setTime(Date.now());
await dwarf.system.setTimezone('America/Los_Angeles');

// Set GPS location (lon, lat)
await dwarf.system.setLocation(-122.4, 37.7);

// RGB LED
await dwarf.power.openRgb();
await dwarf.power.closeRgb();

// Power
await dwarf.power.reboot();
// await dwarf.power.powerDown();
```

---

## HTTP API

### Device Info

```typescript
const info = await dwarf.device.getDeviceInfo();
console.log('Name:', info.deviceName);
console.log('MAC:', info.macAddress);
console.log('SD Card:', info.sdCardAvailable);
```

### Media Management

```typescript
// Get per-type media counts — returns an array of { mediaType, count }
const counts = await dwarf.album.getMediaCounts();
for (const c of counts) {
  console.log(`type ${c.mediaType}: ${c.count} items`);
}

// Browse photos: getMediaList(mediaType, pageIndex, pageSize?) returns a bare
// array of MediaInfo (no { total, list } wrapper).
const photos = await dwarf.album.getMediaList(0, 0, 50);
for (const photo of photos) {
  console.log(`${photo.fileName} - ${photo.fileSize} bytes`);
}

// Delete media (mediaType comes from each item)
if (photos.length > 0) {
  await dwarf.album.deleteMedia([
    { filePath: photos[0].filePath, mediaType: photos[0].mediaType },
  ]);
}

// Browse FITS files from an astro session
const fits = await dwarf.album.getFitsList('/sdcard/Astro/session-001');
```

`MediaInfo` carries `fileName`, `filePath`, `fileSize`, `mediaType`,
`modificationTime` (unix epoch seconds), and optional fields like
`thumbnailPath`, `camId` (0 = tele, 1 = wide) and `astroTargetName`.

### Firmware

```typescript
// Get supported shooting modes
const modes = await dwarf.firmware.getSupportedShootingModes();

// Get default camera configuration
const config = await dwarf.firmware.getDefaultParamsConfig();
```

---

## Monitoring Battery

The battery notification payload exposes the charge as `level` (a percentage).

```typescript
import { Command } from '@alikh/dwarflab-sdk';

dwarf.on(Command.NOTIFY_ELE, (packet, decoded) => {
  const { level } = decoded as { level: number };
  console.log(`Battery: ${level}%`);
});

dwarf.on(Command.NOTIFY_CHARGE, (packet, decoded) => {
  console.log('Charging state:', decoded);
});
```

You can also let `DeviceStateTracker` maintain this for you:

```typescript
import { DeviceStateTracker } from '@alikh/dwarflab-sdk';

const tracker = new DeviceStateTracker(dwarf);
// tracker.state.batteryPercentage, .charging, .sdCardPresent, .temperature ...
```

---

## Scheduled Shooting

The schedule payload is firmware-dependent — the exact fields vary by device
and firmware version, so treat the object below as illustrative.

```typescript
// Create / sync a schedule entry
await dwarf.schedule.sync({
  scheduleId: 1,
  targetName: 'M42',
  ra: 83.822,
  dec: -5.391,
  startTime: Date.now() + 3600000, // 1 hour from now
  duration: 1800000,               // 30 minutes
});

// List all schedules
const schedules = await dwarf.schedule.getAll();

// Cancel a schedule
await dwarf.schedule.cancel(1);
```

---

## Error Handling

```typescript
import { DwarfError, getErrorMessage } from '@alikh/dwarflab-sdk';

try {
  await dwarf.astro.startCalibration(-122.4, 37.7);
} catch (err) {
  if (err instanceof DwarfError) {
    console.log('Error code:', err.code);
    console.log('Command:', err.cmd);
    console.log('Message:', getErrorMessage(err.code));
  } else {
    console.log('Connection error:', err);
  }
}
```

---

## Task Center

```typescript
import { ShootingMode } from '@alikh/dwarflab-sdk';

// Enter camera mode
await dwarf.taskCenter.enterCamera();

// Get full device state
const state = await dwarf.taskCenter.getDeviceStateInfo();
console.log(state);

// Switch shooting mode
await dwarf.taskCenter.switchShootingMode(ShootingMode.PHOTO); // 0
await dwarf.taskCenter.switchShootingMode(ShootingMode.ASTRO); // 2
```
