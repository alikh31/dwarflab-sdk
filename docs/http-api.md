# HTTP API Reference

The DWARFLAB telescope exposes a JSON REST API on port 8082. The SDK wraps these endpoints with typed methods accessible via `dwarf.device`, `dwarf.album`, and `dwarf.firmware`.

All HTTP responses follow this format:
```json
{
  "data": "<T>",
  "code": 0,
  "message": null
}
```

Where `code == 0` indicates success.

## DeviceHttpApi (`dwarf.device`)

Device information and management.

### `getDeviceInfo(): Promise<DeviceInfo>`

Returns device identity and status.

```typescript
const info = await dwarf.device.getDeviceInfo();
console.log(info.deviceName);   // "DWARF3_ABCD"
console.log(info.macAddress);   // "AA:BB:CC:DD:EE:FF"
console.log(info.sdCardAvailable); // true
```

**Response type:**
```typescript
interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  macAddress: string;
  wifiSsid: string;
  sdCardAvailable: boolean;
  serialNumber: string;
  activated: boolean;
}
```

**Endpoint:** `POST /deviceInfo`

### `setDeviceNameAndPassword(name, password): Promise<void>`

Change the device's WiFi name and password.

```typescript
await dwarf.device.setDeviceNameAndPassword('MyDWARF3', 'newpassword');
```

**Endpoint:** `POST /setDeviceNameAndPsd`

### `resetDevice(): Promise<void>`

Perform a factory reset. The device will restart.

**Endpoint:** `POST /resetDeviceInfo`

### `getResetState(): Promise<ResetState>`

Poll whether a factory reset has completed.

**Endpoint:** `POST /getResetState`

### `getLogInfo(): Promise<LogInfo>`

Get device log metadata.

```typescript
interface LogInfo {
  logPath: string;
  logSize: number;
}
```

**Endpoint:** `GET /logInfo`

### `downloadLog(): Promise<ArrayBuffer>`

Download the device log file as raw bytes.

**Endpoint:** `GET /downloadLog`

---

## AlbumHttpApi (`dwarf.album`)

Media browsing and management.

### `getMediaCounts(): Promise<MediaCount[]>`

Count media files grouped by type. Returns an array of per-type entries.

```typescript
const counts = await dwarf.album.getMediaCounts();
// [ { mediaType: 0, count: 42 }, { mediaType: 1, count: 15 }, ... ]
```

**Response type:**
```typescript
interface MediaCount {
  mediaType: number;
  count: number;
}
```

**Endpoint:** `POST /album/list/mediaCounts`

### `getMediaList(mediaType, pageIndex, pageSize?): Promise<MediaInfo[]>`

Get a paginated list of media files. Returns a bare array of `MediaInfo` items.
`mediaType` is a filter category — an individual item's own `mediaType` may differ
from the filter you passed.

```typescript
const items = await dwarf.album.getMediaList(0, 0, 20);
console.log(items.length);          // up to 20
console.log(items[0].fileName);     // "IMG_20240115_234500.jpg"
console.log(items[0].modificationTime); // 1705361100 (unix epoch seconds)
```

**Response type:**
```typescript
interface MediaInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
  mediaType: number;           // canonical type on the item (may differ from filter)
  modificationTime: number;    // unix epoch seconds
  thumbnailPath?: string;
  camId?: number;              // 0 = tele, 1 = wide
  astroSubType?: number;
  astroTargetName?: string;
  astroImageDetails?: AstroImageDetails; // only set for stacked astro shots
  fileState?: number;
}
```

**Endpoint:** `POST /album/list/mediaInfos`

### `deleteMedia(items): Promise<Array<{ filePath, fileName, mediaType, isSuccess }>>`

Delete media files. Returns a per-item success array so you can tell which
deletions actually succeeded.

```typescript
const results = await dwarf.album.deleteMedia([
  { filePath: '/sdcard/DCIM/IMG_001.jpg', mediaType: 0 },
]);
console.log(results[0].isSuccess); // true
```

**Arguments:** `Array<{ filePath: string; fileName?: string; mediaType: number; subType?: number }>`

**Endpoint:** `POST /album/delete`

### `getFitsList(srcDir): Promise<FitsFile[]>`

List FITS files from an astrophotography session.

```typescript
const fits = await dwarf.album.getFitsList('/sdcard/Astro/2024-01-15');
console.log(fits[0].fileName); // "frame_001.fits"
```

**Endpoint:** `POST /album/astro/fitsList`

### `deleteFits(files): Promise<void>`

Delete specific FITS files.

**Endpoint:** `POST /album/astro/deleteFits`

### `getMediaByFilePath(filePath): Promise<MediaInfo>`

Look up a specific media file by its path.

**Endpoint:** `POST /album/getMediaInfoByFilePath`

### `fileUrl(devicePath, host): string`

Build a URL to fetch a file (or its thumbnail) directly from the device. The
telescope serves the SD card root over its web server on port 80, so you can use
the returned URL as an `<img src>` or pass it to `fetch`. The path is
URI-encoded for you, which matters because astro target names often contain
spaces (e.g. `NGC 3628`).

```typescript
const item = (await dwarf.album.getMediaList(0, 0, 1))[0];
const url = dwarf.album.fileUrl(item.thumbnailPath!, '192.168.1.100');
// "http://192.168.1.100/DWARF3/Videos/Thumbnail/...jpg"
```

This is a local helper that builds a string — it does not make a request itself.

---

## FirmwareHttpApi (`dwarf.firmware`)

Firmware and camera configuration.

### `applyUpdate(version): Promise<void>`

Trigger a firmware update to the specified version.

```typescript
await dwarf.firmware.applyUpdate('2.1.0');
```

**Endpoint:** `GET /update?version={ver}`

### `getDefaultParamsConfig(): Promise<ParamConfig>`

Get default camera parameters and their valid ranges.

```typescript
const config = await dwarf.firmware.getDefaultParamsConfig();
```

**Endpoint:** `GET /getDefaultParamsConfig`

### `getSupportedShootingModes(): Promise<ShootingMode[]>`

List all shooting modes supported by the device.

```typescript
const modes = await dwarf.firmware.getSupportedShootingModes();
// [{ modeId: 0, name: "Photo" }, { modeId: 1, name: "Video" }, ...]
```

**Endpoint:** `GET /shootingMode/getSupportedShootingModes`

### `getShootingModeParams(modeId): Promise<ParamConfig>`

Get parameters and settings for a specific shooting mode.

```typescript
const astroParams = await dwarf.firmware.getShootingModeParams(2);
```

**Endpoint:** `POST /shootingMode/getParamAndSetting`

---

## Direct HTTP Access

For endpoints not covered by the wrappers, use the `HttpTransport` directly:

```typescript
// Access the underlying transport
const result = await dwarf.http.get('/some/endpoint');
const data = await dwarf.http.post('/some/endpoint', { key: 'value' });
const raw = await dwarf.http.getRaw('/downloadSomething');
```
