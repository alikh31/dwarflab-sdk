import { describe, it, expect } from 'vitest';
import {
  BleCmd,
  crc16,
  createBlePackets,
  parseBlePacket,
  reassembleBlePackets,
} from '../src/index.js';

describe('crc16 (CRC-16/MODBUS)', () => {
  it('computes the standard MODBUS check value for "123456789"', () => {
    // The canonical CRC-16/MODBUS check value for the ASCII string
    // "123456789" is 0x4B37. This pins the table + algorithm.
    const data = new TextEncoder().encode('123456789');
    expect(crc16(data)).toBe(0x4b37);
  });

  it('returns 0xFFFF for empty input (initial value, no bytes consumed)', () => {
    expect(crc16(new Uint8Array(0))).toBe(0xffff);
  });
});

describe('createBlePackets', () => {
  it('frames a small payload into a single chunk with header + trailer', () => {
    const payload = new Uint8Array([0x01, 0x02, 0x03]);
    const packets = createBlePackets(payload, BleCmd.GetWiFiConfig, 20);
    expect(packets).toHaveLength(1);
    const pkt = packets[0];
    expect(pkt[0]).toBe(0xaa); // header marker
    expect(pkt[2]).toBe(BleCmd.GetWiFiConfig); // cmd
    expect(pkt[3]).toBe(0); // seqNum
    expect(pkt[4]).toBe(1); // totalPkgs
    expect(pkt[pkt.length - 1]).toBe(0x0d); // trailer marker
  });

  it('splits a payload larger than the MTU into multiple sequenced chunks', () => {
    // MTU 20 → 12 bytes overhead → 8 bytes payload per chunk.
    const payload = new Uint8Array(20).map((_, i) => i);
    const packets = createBlePackets(payload, BleCmd.SetSTAMode, 20);
    expect(packets.length).toBe(Math.ceil(20 / 8)); // 3 chunks
    packets.forEach((pkt, i) => {
      expect(pkt[0]).toBe(0xaa);
      expect(pkt[3]).toBe(i); // seqNum increments
      expect(pkt[4]).toBe(packets.length); // totalPkgs constant
    });
  });

  it('throws when the MTU is too small to hold the framing overhead', () => {
    expect(() => createBlePackets(new Uint8Array([1]), BleCmd.GetWiFiConfig, 8)).toThrow();
  });
});

describe('parseBlePacket + reassembleBlePackets', () => {
  it('round-trips a single-chunk payload through create → parse', () => {
    const payload = new Uint8Array([10, 20, 30, 40]);
    const [pkt] = createBlePackets(payload, BleCmd.GetWiFiList, 20);
    const parsed = parseBlePacket(pkt);
    expect(parsed).not.toBeNull();
    expect(parsed!.cmd).toBe(BleCmd.GetWiFiList);
    expect(parsed!.totalPkgs).toBe(1);
    expect(Array.from(parsed!.data)).toEqual(Array.from(payload));
  });

  it('reassembles a multi-chunk payload back to the original bytes', () => {
    const payload = new Uint8Array(20).map((_, i) => (i * 7) & 0xff);
    const packets = createBlePackets(payload, BleCmd.SetSTAMode, 20);
    const parsed = packets.map((p) => parseBlePacket(p)!).filter(Boolean);
    expect(parsed).toHaveLength(packets.length);
    const reassembled = reassembleBlePackets(parsed.map((p) => ({ seqNum: p.seqNum, data: p.data })));
    expect(Array.from(reassembled)).toEqual(Array.from(payload));
  });

  it('reassembles correctly even when chunks arrive out of order', () => {
    const payload = new Uint8Array(20).map((_, i) => i);
    const parsed = createBlePackets(payload, BleCmd.SetSTAMode, 20).map((p) => parseBlePacket(p)!);
    const shuffled = [...parsed].reverse(); // worst-case ordering
    const reassembled = reassembleBlePackets(shuffled.map((p) => ({ seqNum: p.seqNum, data: p.data })));
    expect(Array.from(reassembled)).toEqual(Array.from(payload));
  });

  it('returns null for a buffer that is too short or lacks the header marker', () => {
    expect(parseBlePacket(new Uint8Array([0x00, 0x01]))).toBeNull();
    // Long enough but wrong first byte.
    const bad = new Uint8Array(15);
    bad[0] = 0x00;
    expect(parseBlePacket(bad)).toBeNull();
  });
});
