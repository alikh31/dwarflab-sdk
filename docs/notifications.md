# Notifications

DWARFLAB telescopes push real-time status updates over WebSocket as notification packets. The SDK provides two ways to listen for these: raw command-based listeners and typed event names.

## Listening for Notifications

### By Command ID

```typescript
import { Command } from '@alikh/dwarflab-sdk';

// Battery status
const unsubscribe = dwarf.on(Command.NOTIFY_ELE, (packet, decoded) => {
  console.log('Battery:', decoded);
});

// Clean up when done
unsubscribe();
```

### By Response (for command responses)

```typescript
// Listen for responses to specific commands
const off = dwarf.onResponse(Command.CAMERA_TELE_GET_ALL_PARAMS, (packet, decoded) => {
  console.log('Camera params:', decoded);
});
```

## Notification Events

All 38 notification event types are listed below with their command IDs.

### Device Status

| Event Name | Command | Description |
|------------|---------|-------------|
| `battery` | `NOTIFY_ELE` (15201) | Battery percentage and voltage |
| `charging` | `NOTIFY_CHARGE` (15202) | Charging state |
| `sdCard` | `NOTIFY_SDCARD_INFO` (15203) | SD card status |
| `temperature` | `NOTIFY_TEMPERATURE` (15243) | Device temperature |
| `cmosTemperature` | `NOTIFY_CMOS_TEMPERATURE` (15292) | CMOS sensor temperature |
| `bodyStatus` | `NOTIFY_BODY_STATUS` (15262) | Overall body status |
| `powerOff` | `NOTIFY_POWER_OFF` (15229) | Device powering off |
| `cpuMode` | `NOTIFY_CPU_MODE` (15227) | CPU performance mode change |

### Astrophotography

| Event Name | Command | Description |
|------------|---------|-------------|
| `calibrationState` | `NOTIFY_STATE_ASTRO_CALIBRATION` (15210) | Star alignment calibration state |
| `gotoState` | `NOTIFY_STATE_ASTRO_GOTO` (15211) | GoTo slew state |
| `trackingState` | `NOTIFY_STATE_ASTRO_TRACKING` (15212) | Sidereal tracking state |
| `liveStackingState` | `NOTIFY_STATE_CAPTURE_RAW_LIVE_STACKING` (15208) | Live stacking start/stop/error |
| `liveStackingProgress` | `NOTIFY_PROGRASS_CAPTURE_RAW_LIVE_STACKING` (15209) | Stacked frame count, quality |
| `captureRawDarkState` | `NOTIFY_STATE_CAPTURE_RAW_DARK` (15206) | Dark frame capture state |
| `captureRawDarkProgress` | `NOTIFY_PROGRASS_CAPTURE_RAW_DARK` (15207) | Dark frame progress |
| `oneClickGotoState` | `NOTIFY_STATE_ASTRO_ONE_CLICK_GOTO` (15233) | One-click goto progress |
| `eqSolvingState` | `NOTIFY_EQ_SOLVING_STATE` (15239) | Equatorial solving state |
| `skyTargetFinderState` | `NOTIFY_SKY_TARGET_FINDER_STATE` (15296) | Sky target finder results |

### Camera

| Event Name | Command | Description |
|------------|---------|-------------|
| `teleSetParam` | `NOTIFY_TELE_SET_PARAM` (15213) | Tele camera parameter changed |
| `wideSetParam` | `NOTIFY_WIDE_SET_PARAM` (15214) | Wide camera parameter changed |
| `photoState` | `NOTIFY_PHOTO_STATE` (15273) | Photo capture state |
| `burstState` | `NOTIFY_BURST_STATE` (15274) | Burst capture state |
| `recordState` | `NOTIFY_RECORD_STATE` (15275) | Video recording state |
| `timelapseState` | `NOTIFY_TIMELAPSE_STATE` (15276) | Timelapse capture state |
| `pictureMatching` | `NOTIFY_TELE_WIDE_PICTURE_MATCHING` (15200) | Tele/wide image alignment |
| `streamType` | `NOTIFY_STREAM_TYPE` (15234) | Stream type change |
| `shootingMode` | `NOTIFY_SWITCH_SHOOTING_MODE` (15267) | Shooting mode changed |

### Tracking & Motor

| Event Name | Command | Description |
|------------|---------|-------------|
| `trackResult` | `NOTIFY_TRACK_RESULT` (15225) | Object tracking result |
| `normalTrackState` | `NOTIFY_NORMAL_TRACK_STATE` (15284) | Normal tracking state |
| `sentryModeState` | `NOTIFY_SENTRY_MODE_STATE` (15231) | Sentry mode state |
| `sentryMotorState` | `NOTIFY_SENTRY_MOTOR_STATE` (15289) | Sentry motor movement state |

### Focus & Panorama

| Event Name | Command | Description |
|------------|---------|-------------|
| `focusPosition` | `NOTIFY_FOCUS_POSITION` (15257) | Focus motor position |
| `astroAutoFocusState` | `NOTIFY_ASTRO_AUTO_FOCUS_STATE` (15278) | Astro autofocus progress |
| `normalAutoFocusState` | `NOTIFY_NORMAL_AUTO_FOCUS_STATE` (15279) | Normal autofocus progress |
| `panoramaState` | `NOTIFY_PANORAMA_STATE` (15277) | Panorama capture progress |

### System

| Event Name | Command | Description |
|------------|---------|-------------|
| `rgbState` | `NOTIFY_RGB_STATE` (15221) | RGB LED state |
| `powerIndState` | `NOTIFY_POWER_IND_STATE` (15222) | Power indicator state |
| `hostSlaveMode` | `NOTIFY_WS_HOST_SLAVE_MODE` (15223) | Host/slave mode change |

## Notification-to-Event Mapping

The SDK exports a `NOTIFICATION_CMD_TO_EVENT` map that translates command IDs to friendly event names:

```typescript
import { NOTIFICATION_CMD_TO_EVENT, Command } from '@alikh/dwarflab-sdk';

const eventName = NOTIFICATION_CMD_TO_EVENT[Command.NOTIFY_ELE];
// "battery"
```

## DeviceStateTracker

For a higher-level approach, the `DeviceStateTracker` automatically listens to common notifications and maintains a reactive state object. It begins listening as soon as it is constructed:

```typescript
import { DeviceStateTracker } from '@alikh/dwarflab-sdk';

const tracker = new DeviceStateTracker(dwarf);

// Access current state
console.log(tracker.state.batteryPercentage);
console.log(tracker.state.charging);
console.log(tracker.state.sdCardPresent);
console.log(tracker.state.temperature);
console.log(tracker.state.cmosTemperature);
console.log(tracker.state.connected);

// Stop tracking and remove listeners
tracker.destroy();
```
