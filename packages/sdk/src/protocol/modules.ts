export enum ModuleId {
  NONE = 0,
  CAMERA_TELE = 1,
  CAMERA_WIDE = 2,
  ASTRO = 3,
  SYSTEM = 4,
  RGB_POWER = 5,
  MOTOR = 6,
  TRACK = 7,
  FOCUS = 8,
  NOTIFY = 9,
  PANORAMA = 10,
  ITIPS = 11,
  TEST = 12,
  SHOOTING_SCHEDULE = 13,
  TASK_CENTER = 14,
  PARAM = 15,
}

const CMD_MODULE_RANGES: Array<[number, number, ModuleId]> = [
  [10000, 10499, ModuleId.CAMERA_TELE],
  [11000, 11499, ModuleId.ASTRO],
  [12000, 12499, ModuleId.CAMERA_WIDE],
  [13000, 13299, ModuleId.SYSTEM],
  [13500, 13799, ModuleId.RGB_POWER],
  [14000, 14499, ModuleId.MOTOR],
  [14800, 14899, ModuleId.TRACK],
  [15000, 15199, ModuleId.FOCUS],
  [15200, 15499, ModuleId.NOTIFY],
  [15500, 15599, ModuleId.PANORAMA],
  [15700, 15799, ModuleId.ITIPS],
  [16100, 16399, ModuleId.SHOOTING_SCHEDULE],
  [16400, 16599, ModuleId.TASK_CENTER],
  [16700, 16799, ModuleId.PARAM],
];

export function cmdToModule(cmd: number): ModuleId {
  for (const [min, max, mod] of CMD_MODULE_RANGES) {
    if (cmd >= min && cmd <= max) return mod;
  }
  return ModuleId.NONE;
}
