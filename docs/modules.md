# Modules API Reference

All module instances are available as properties on the `DwarfClient`. Every method returns a `Promise<unknown>` that resolves with the decoded protobuf response from the telescope.

## CameraTeleModule (`dwarf.cameraTele`)

Telephoto camera control - 47 methods.

### Capture

| Method | Description |
|--------|-------------|
| `openCamera(binning?: boolean, rtspEncodeType?: number)` | Open the telephoto camera. `binning` defaults to `false`, `rtspEncodeType` defaults to `1` |
| `closeCamera()` | Close the telephoto camera |
| `takePhoto()` | Capture a single photo |
| `takePhotoRaw()` | Capture a RAW photo |
| `startBurst(count?: number)` | Start burst shooting. `count` is optional — omitting it sends an empty request and the firmware uses its stored `BURST_COUNT`. Precondition: a burst is only accepted after `taskCenter.switchShootingTech(ShootingTech.BURST)` |
| `setBurstCount(count, modeId?)` | Set the burst shot count. Maps a shot count to a firmware gear index; on-device write effect is currently unverified. `modeId` defaults to `1` |
| `stopBurst()` | Stop burst shooting (early cancel only) |
| `startRecord()` | Start video recording |
| `stopRecord()` | Stop video recording |
| `startTimelapse(interval, totalTime?)` | Start timelapse. `interval` in seconds |
| `stopTimelapse()` | Stop timelapse |

### Exposure & Gain

| Method | Description |
|--------|-------------|
| `setExposureMode(mode)` | Set exposure mode (0=auto, 1=manual) |
| `getExposureMode()` | Get current exposure mode |
| `setExposure(value)` | Set exposure value (seconds) |
| `getExposure()` | Get current exposure |
| `setGainMode(mode)` | Set gain mode |
| `getGainMode()` | Get current gain mode |
| `setGain(value)` | Set gain value |
| `getGain()` | Get current gain |

### Image Adjustments

| Method | Description |
|--------|-------------|
| `setBrightness(value)` | Set brightness |
| `getBrightness()` | Get brightness |
| `setContrast(value)` | Set contrast |
| `getContrast()` | Get contrast |
| `setSaturation(value)` | Set saturation |
| `getSaturation()` | Get saturation |
| `setHue(value)` | Set hue |
| `getHue()` | Get hue |
| `setSharpness(value)` | Set sharpness |
| `getSharpness()` | Get sharpness |

### White Balance

| Method | Description |
|--------|-------------|
| `setWhiteBalanceMode(mode)` | Set WB mode |
| `getWhiteBalanceMode()` | Get WB mode |
| `setWhiteBalanceScene(scene)` | Set WB scene preset |
| `getWhiteBalanceScene()` | Get WB scene |
| `setWhiteBalanceCT(value)` | Set color temperature |
| `getWhiteBalanceCT()` | Get color temperature |

### Other

| Method | Description |
|--------|-------------|
| `setIRCut(mode)` | Set IR cut filter mode |
| `getIRCut()` | Get IR cut filter state |
| `setAllParams(params)` | Set all camera parameters at once |
| `getAllParams()` | Get all camera parameters |
| `setFeatureParam(id, value)` | Set a specific feature parameter |
| `getAllFeatureParams()` | Get all feature parameters |
| `setJpgQuality(quality)` | Set JPEG quality |
| `setRtspBitrateType(type)` | Set RTSP stream bitrate |
| `switchResolution(width, height)` | Switch camera resolution |
| `switchFramerate(fps)` | Switch framerate |
| `switchCropRatio(ratio)` | Switch crop ratio |
| `setPreviewQuality(quality)` | Set preview stream quality |

---

## CameraWideModule (`dwarf.cameraWide`)

Wide-angle camera control - 36 methods. Mirrors many telephoto camera methods.

### Capture

| Method | Description |
|--------|-------------|
| `openCamera(rtspEncodeType?: number)` | Open the wide camera. `rtspEncodeType` defaults to `1` |
| `closeCamera()` | Close the wide camera |
| `takePhoto()` | Capture a photo |
| `takePhotoRaw()` | Capture RAW photo |
| `startBurst(count?: number)` | Start burst shooting. `count` is optional — omitting it sends an empty request and the firmware uses its stored `BURST_COUNT`. Precondition: a burst is only accepted after `taskCenter.switchShootingTech(ShootingTech.BURST)` |
| `setBurstCount(count, modeId?)` | Set the burst shot count. Maps a shot count to a firmware gear index; on-device write effect is currently unverified. `modeId` defaults to `1` |
| `stopBurst()` | Stop burst (early cancel only) |
| `startRecord()` | Start recording |
| `stopRecord()` | Stop recording |
| `startTimelapse(interval, totalTime?)` | Start timelapse |
| `stopTimelapse()` | Stop timelapse |

### Exposure & Gain

| Method | Description |
|--------|-------------|
| `setExposureMode(mode)` | Set exposure mode |
| `getExposureMode()` | Get exposure mode |
| `setExposure(value)` | Set exposure value |
| `getExposure()` | Get exposure |
| `setGain(value)` | Set gain |
| `getGain()` | Get gain |

### Image Adjustments

| Method | Description |
|--------|-------------|
| `setBrightness(value)` | Set brightness |
| `getBrightness()` | Get brightness |
| `setContrast(value)` | Set contrast |
| `getContrast()` | Get contrast |
| `setSaturation(value)` | Set saturation |
| `getSaturation()` | Get saturation |
| `setHue(value)` | Set hue |
| `getHue()` | Get hue |
| `setSharpness(value)` | Set sharpness |
| `getSharpness()` | Get sharpness |

### White Balance

| Method | Description |
|--------|-------------|
| `setWhiteBalanceMode(mode)` | Set WB mode |
| `getWhiteBalanceMode()` | Get WB mode |
| `setWhiteBalanceScene(scene)` | Set WB scene preset |
| `setWhiteBalanceCT(value)` | Set color temperature |
| `getWhiteBalanceCT()` | Get color temperature |

### Other

| Method | Description |
|--------|-------------|
| `getAllParams()` | Get all camera parameters |
| `setAllParams(params)` | Set all camera parameters at once |
| `setRtspBitrateType(type)` | Set RTSP stream bitrate |
| `setPreviewQuality(quality)` | Set preview stream quality |

---

## AstroModule (`dwarf.astro`)

Astrophotography workflows - 33 methods.

### Calibration

| Method | Description |
|--------|-------------|
| `startCalibration(lon, lat)` | Start star alignment calibration with GPS coordinates |
| `stopCalibration()` | Cancel calibration |

### GoTo

| Method | Description |
|--------|-------------|
| `gotoDSO(ra, dec, targetName?)` | Slew to a deep-sky object by RA/Dec |
| `gotoSolarSystem(index, lon, lat, targetName?)` | Slew to a solar system object by index |
| `stopGoto()` | Cancel goto slew |
| `oneClickGotoDSO(ra, dec, targetName?, lon?, lat?)` | Calibrate + goto DSO in one step |
| `oneClickGotoSolarSystem(index, targetName?, lon?, lat?)` | Calibrate + goto planet in one step |
| `stopOneClickGoto()` | Cancel one-click goto |

### Live Stacking

| Method | Description |
|--------|-------------|
| `startLiveStacking(irIndex = -1, forceStart = false)` | Start live stacking on telephoto camera. `irIndex` is the current IR-filter index (-1 = none selected); `forceStart` bypasses preflight checks |
| `stopLiveStacking()` | Stop live stacking |
| `fastStopLiveStacking()` | Immediately stop (skip final processing) |
| `startWideLiveStacking(forceStart = false)` | Start live stacking on wide camera |
| `stopWideLiveStacking()` | Stop wide camera live stacking |
| `fastStopWideLiveStacking()` | Immediately stop wide stacking |
| `recoverStacking()` | Best-effort recovery from a stuck stacking session. Resolves with `{ issued: string[]; failed: string[] }` |
| `queryStackingState()` | Read current live-stacking state for both cameras. Resolves with `{ tele, wide }` snapshot |

### Dark Frames

| Method | Description |
|--------|-------------|
| `startCaptureDark()` | Capture dark calibration frames |
| `stopCaptureDark()` | Stop dark frame capture |
| `checkDark()` | Check if dark frames are available |

### Equatorial Solving

| Method | Description |
|--------|-------------|
| `startEqSolving(lon, lat)` | Start equatorial solving with GPS coordinates |
| `stopEqSolving()` | Stop equatorial solving |

### Other

| Method | Description |
|--------|-------------|
| `goLive()` | Switch to live view mode |
| `startTrackSpecialTarget(ra, dec)` | Track a specific RA/Dec coordinate |
| `stopTrackSpecialTarget()` | Stop special target tracking |
| `startAiEnhance()` | Start AI image enhancement |
| `stopAiEnhance()` | Stop AI enhancement |
| `startMosaic(params)` | Start mosaic capture |
| `startSkyTargetFinder(params)` | Start sky target identification |
| `stopSkyTargetFinder()` | Stop target finder |
| `getShootingTime()` | Get accumulated shooting time |
| `getQuickSetList()` | Get quick settings presets |
| `setQuickSet(params)` | Apply a quick settings preset |
| `startOneClickShooting(params)` | One-click automated shooting |

---

## SystemModule (`dwarf.system`)

System configuration - 7 methods.

| Method | Description |
|--------|-------------|
| `setTime(timestamp)` | Set device clock (Unix timestamp) |
| `setTimezone(timezone)` | Set timezone string |
| `setMtpMode(mode)` | Enable/disable MTP file transfer mode |
| `setCpuMode(mode)` | Set CPU performance mode |
| `setMaster(isMaster)` | Set host/slave mode for multi-device |
| `setLowTempProtection(mode)` | Enable/disable low temperature protection |
| `setLocation(lon, lat, altitude?)` | Set GPS coordinates. `altitude` defaults to `0` |

---

## PowerModule (`dwarf.power`)

LED and power control - 6 methods.

| Method | Description |
|--------|-------------|
| `openRgb()` | Turn on the RGB LED ring |
| `closeRgb()` | Turn off the RGB LED ring |
| `powerDown()` | Shut down the telescope |
| `powerIndicatorOn()` | Turn on the power indicator LED |
| `powerIndicatorOff()` | Turn off the power indicator LED |
| `reboot()` | Reboot the telescope |

---

## MotorModule (`dwarf.motor`)

Motor and joystick control - 6 methods.

| Method | Description |
|--------|-------------|
| `run(params)` | Run motor with specified parameters |
| `stop()` | Stop all motor movement |
| `joystick(vectorAngle, vectorLength?)` | Continuous polar joystick. `vectorAngle` in degrees (0=up/north, 90=right/east); `vectorLength` is magnitude 0..1 (defaults to `1.0`) |
| `joystickFixedAngle(vectorAngle, vectorLength?)` | Move at a fixed angle. Same parameters as `joystick` |
| `joystickStop()` | Stop joystick movement |
| `dualCameraLinkage(enable)` | Link wide and tele camera movement |

---

## TrackingModule (`dwarf.tracking`)

Object tracking and sentry mode - 13 methods.

| Method | Description |
|--------|-------------|
| `startTrack(x, y)` | Start tracking object at screen coordinates |
| `stopTrack()` | Stop tracking |
| `startSentryMode(params?)` | Start automated sentry mode |
| `stopSentryMode()` | Stop sentry mode |
| `startMot(params?)` | Start motion tracking |
| `trackOne(x, y)` | Track one specific target |
| `startUfoTrack()` | Start UFO/satellite tracking mode |
| `stopUfoTrack()` | Stop UFO tracking |
| `wideTrackOne(x, y)` | Track target on wide camera |
| `switchMainPreview(cameraType)` | Switch main preview between cameras |
| `setUfoHandAutoMode(mode)` | Set UFO tracking auto/manual mode |
| `selectSentryScene(scene)` | Select sentry detection scene |
| `startTrackClick(x, y)` | Start track from click position |

---

## FocusModule (`dwarf.focus`)

Focus control - 8 methods.

| Method | Description |
|--------|-------------|
| `autoFocus()` | Trigger one-shot autofocus |
| `manualSingleStep(direction)` | Move focus one step. `direction`: 0=far/infinity, 1=near/close |
| `startManualContinuous(direction)` | Start continuous focus movement |
| `stopManualContinuous()` | Stop continuous focus |
| `startAstroAutoFocus()` | Start astro-specific autofocus (slow, precise) |
| `stopAstroAutoFocus()` | Cancel astro autofocus |
| `getInfinityPosition()` | Get saved infinity focus position |
| `setInfinityPosition(position)` | Save infinity focus position |

---

## PanoramaModule (`dwarf.panorama`)

Panorama capture and stitching - 12 methods.

| Method | Description |
|--------|-------------|
| `startGrid(rows, cols)` | Start panorama capture with grid dimensions |
| `stop()` | Stop panorama capture |
| `startStitchUpload(params)` | Start stitching and uploading |
| `stopStitchUpload()` | Stop stitch upload |
| `getCurrentUploadState()` | Get upload progress |
| `startCompress(params)` | Start compression |
| `stopCompress()` | Stop compression |
| `startFraming()` | Start framing mode |
| `stopFraming()` | Stop framing |
| `resetFraming()` | Reset framing selection |
| `updateFramingRect(params)` | Update framing rectangle |
| `stopFramingAndStartGrid()` | Confirm framing and start capture |

---

## ScheduleModule (`dwarf.schedule`)

Scheduled shooting sessions - 8 methods.

| Method | Description |
|--------|-------------|
| `sync(params)` | Sync schedule to device |
| `cancel(scheduleId)` | Cancel a scheduled session |
| `getAll()` | Get all schedules |
| `getById(scheduleId)` | Get a specific schedule |
| `replace(params)` | Replace a schedule |
| `unlock(scheduleId)` | Unlock a schedule for editing |
| `lock(scheduleId)` | Lock a schedule |
| `remove(scheduleId)` | Delete a schedule |

---

## TaskCenterModule (`dwarf.taskCenter`)

Task and shooting mode management - 8 methods.

| Method | Description |
|--------|-------------|
| `startTask(taskId, params?)` | Start a task by ID |
| `stopTask(taskId)` | Stop a running task |
| `switchShootingMode(mode)` | Switch shooting mode (the scene: photo, video, astro, etc.) |
| `switchShootingModeNoWait(mode)` | Best-effort `switchShootingMode` — returns the reply or `null` if none arrives |
| `switchShootingTech(tech)` | Switch shooting technique (SINGLE_SHOT=1, STACKING=2, BURST=3, VIDEO=4, TIMELAPSE=5, PANORAMA=6) |
| `enterCamera(encodeType?)` | Enter camera mode |
| `enterCameraNoWait(encodeType?)` | Best-effort `enterCamera`. `encodeType` defaults to `1` |
| `getDeviceStateInfo()` | Get comprehensive device state |

---

## ParamsModule (`dwarf.params`)

Cross-camera parameter control - 7 methods.

| Method | Description |
|--------|-------------|
| `setExposure(cameraType, value)` | Set exposure for any camera |
| `setGain(cameraType, value)` | Set gain for any camera |
| `setWhiteBalance(cameraType, value)` | Set white balance for any camera |
| `setIntParam(cameraType, paramId, value)` | Set arbitrary integer parameter |
| `setFloatParam(cameraType, paramId, value)` | Set arbitrary float parameter |
| `setBoolParam(cameraType, paramId, value)` | Set arbitrary boolean parameter |
| `setAutoParams(cameraType)` | Reset parameters to auto |

Camera types: `0` = telephoto, `1` = wide-angle.
