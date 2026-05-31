/**
 * BURST_COUNT is a GEAR INDEX, not a literal shot count (it maps to the
 * firmware's "Burst count" gear setting). Setting the param to a literal shot
 * count (e.g. value=5) selects the WRONG gear — `setBurstCount` must map the
 * caller's desired shot count to the gear index the firmware expects.
 *
 * Gear table (shots → gearIndex), from the device's burst-count gear config:
 *   3→0, 5→3, 10→6, 15→9, 20→12, 30→15, 40→18, 50→21, 60→24, 70→27, 80→30,
 *   90→33, 100→36, 120→39, 150→42, 200→45, 300→48, 400→51, 500→54, 600→57,
 *   700→60, 900→63
 * (The device also has a "continuous mode" free range min 3 / max 999 — not
 * used by this gear-based helper.)
 */
export const BURST_COUNT_GEARS: ReadonlyArray<{ shots: number; gearIndex: number }> = [
  { shots: 3, gearIndex: 0 },
  { shots: 5, gearIndex: 3 },
  { shots: 10, gearIndex: 6 },
  { shots: 15, gearIndex: 9 },
  { shots: 20, gearIndex: 12 },
  { shots: 30, gearIndex: 15 },
  { shots: 40, gearIndex: 18 },
  { shots: 50, gearIndex: 21 },
  { shots: 60, gearIndex: 24 },
  { shots: 70, gearIndex: 27 },
  { shots: 80, gearIndex: 30 },
  { shots: 90, gearIndex: 33 },
  { shots: 100, gearIndex: 36 },
  { shots: 120, gearIndex: 39 },
  { shots: 150, gearIndex: 42 },
  { shots: 200, gearIndex: 45 },
  { shots: 300, gearIndex: 48 },
  { shots: 400, gearIndex: 51 },
  { shots: 500, gearIndex: 54 },
  { shots: 600, gearIndex: 57 },
  { shots: 700, gearIndex: 60 },
  { shots: 900, gearIndex: 63 },
];

/**
 * Map a desired shot count to the firmware's BURST_COUNT gear index. If `shots`
 * isn't an exact gear value, snaps to the nearest gear (ties round down to the
 * smaller count — conservative). Returns the gear index to write as the
 * `BURST_COUNT` param value.
 */
export function shotsToBurstGearIndex(shots: number): number {
  let best = BURST_COUNT_GEARS[0];
  let bestDelta = Math.abs(shots - best.shots);
  for (const gear of BURST_COUNT_GEARS) {
    const delta = Math.abs(shots - gear.shots);
    // `<` (not `<=`) keeps the earlier/smaller gear on a tie.
    if (delta < bestDelta) {
      best = gear;
      bestDelta = delta;
    }
  }
  return best.gearIndex;
}
