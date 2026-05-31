# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Both packages (`@alikh/dwarflab-sdk` and `@alikh/dwarflab-ble`) are versioned
together.

## [Unreleased]

## [0.1.1] - 2026-05-31

First release published through the automated, tokenless CI pipeline
(npm Trusted Publishing / OIDC), with provenance attestation.

### Changed

- Build tooling: the monorepo now builds `@alikh/dwarflab-sdk` before
  `@alikh/dwarflab-ble` explicitly, so a clean checkout builds, typechecks, and
  tests without a pre-existing `dist/`. CI runs lint → build → typecheck → test.
- Expanded the maintainer release checklist in `CONTRIBUTING.md`.

No runtime/API changes — source of both packages is identical to `0.1.0`.

## [0.1.0] - 2026-05-31

Initial public release.

### Added

- `@alikh/dwarflab-sdk` — core SDK for DWARFLAB DWARF telescopes:
  - WebSocket transport (port 9900) with automatic reconnection and
    request/response correlation.
  - HTTP REST API wrappers (`device`, `album`, `firmware`).
  - 12 high-level control modules (camera tele/wide, astro, system, power,
    motor, tracking, focus, panorama, schedule, task center, params) — 190+
    ergonomic methods over 310+ protocol commands.
  - Typed protobuf codec with request/response encoding and decoding.
  - 38 typed notification events and a `NOTIFICATION_CMD_TO_EVENT` map.
  - `DeviceStateTracker` for reactive device state (battery, temperature,
    SD card, …).
  - Burst support with the shooting-technique precondition and firmware
    self-stop semantics; live-stacking, calibration, GoTo, and EQ-solving APIs.
  - Dual ESM + CJS output with TypeScript declarations.
- `@alikh/dwarflab-ble` — BLE Wi-Fi setup and device discovery (Node.js only),
  including chunked packet framing with CRC-16/MODBUS.
- Documentation under `docs/` and per-package READMEs.

### Notes

- Verified against DWARF 3 hardware (firmware v1.5.x). DWARF 2, DWARF 3 Plus,
  and DWARF Mini are protocol-compatible but **untested** — reports welcome.
- This is an **unofficial** project and is not affiliated with DWARFLAB.

[Unreleased]: https://github.com/alikh31/dwarflab-sdk/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/alikh31/dwarflab-sdk/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/alikh31/dwarflab-sdk/releases/tag/v0.1.0
