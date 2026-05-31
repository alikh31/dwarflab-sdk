export const BLE_UUIDS = {
  SERVICE: '0000ffe0-0000-1000-8000-00805f9b34fb',
  WRITE_CHAR: '0000ffe1-0000-1000-8000-00805f9b34fb',
  NOTIFY_CHAR: '0000ffe2-0000-1000-8000-00805f9b34fb',
  /** DWARF 3/4 models use a single characteristic for both read and write */
  DWARF_CHAR: '00009999-0000-1000-8000-00805f9b34fb',
} as const;

/** Short (16-bit) UUID forms — noble normalizes UUIDs to lowercase without hyphens */
export const BLE_SHORT_UUIDS = {
  SERVICE: 'ffe0',
  WRITE_CHAR: 'ffe1',
  NOTIFY_CHAR: 'ffe2',
  DWARF_CHAR: '9999',
} as const;

/**
 * All known characteristic UUIDs (short form) that DWARF devices use for BLE communication.
 * Different hardware revisions use different UUIDs.
 */
export const KNOWN_CHAR_UUIDS = [
  BLE_SHORT_UUIDS.WRITE_CHAR,
  BLE_SHORT_UUIDS.NOTIFY_CHAR,
  BLE_SHORT_UUIDS.DWARF_CHAR,
] as const;

export const DWARF_NAME_PREFIX = 'DWARF';
