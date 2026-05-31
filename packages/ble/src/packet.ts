/**
 * BLE Packet framing for DWARFLAB telescopes.
 *
 * Wire format per chunk:
 *   [0xAA][version][cmd][seqNum][totalPkgs][extProto:2B][dataLen:2B][data...][crc16:2B][0x0D]
 *
 * Header: 9 bytes, Trailer: 3 bytes (2B CRC + 1B terminator) = 12 bytes overhead per chunk.
 */

/** BLE command IDs. */
export const BleCmd = {
  Unknown: 0,
  GetWiFiConfig: 1,
  SetApMode: 2,
  SetSTAMode: 3,
  SetNamePwd: 4,
  Reset: 5,
  GetWiFiList: 6,
  GetDeviceInfo: 7,
} as const;

export type BleCmdValue = (typeof BleCmd)[keyof typeof BleCmd];

const HEADER_MARKER = 0xaa;
const TRAILER_MARKER = 0x0d;
const PROTOCOL_VERSION = 0x02;
const OVERHEAD = 12; // 9-byte header + 2-byte CRC + 1-byte trailer

/** CRC-16/MODBUS lookup table */
const CRC_TABLE = [
  0, 49345, 49537, 320, 49921, 960, 640, 49729, 50689, 1728, 1920, 51009,
  1280, 50625, 50305, 1088, 52225, 3264, 3456, 52545, 3840, 53185, 52865,
  3648, 2560, 51905, 52097, 2880, 51457, 2496, 2176, 51265, 55297, 6336,
  6528, 55617, 6912, 56257, 55937, 6720, 7680, 57025, 57217, 8000, 56577,
  7616, 7296, 56385, 5120, 54465, 54657, 5440, 55041, 6080, 5760, 54849,
  53761, 4800, 4992, 54081, 4352, 53697, 53377, 4160, 61441, 12480, 12672,
  61761, 13056, 62401, 62081, 12864, 13824, 63169, 63361, 14144, 62721,
  13760, 13440, 62529, 15360, 64705, 64897, 15680, 65281, 16320, 16000,
  65089, 64001, 15040, 15232, 64321, 14592, 63937, 63617, 14400, 10240,
  59585, 59777, 10560, 60161, 11200, 10880, 59969, 60929, 11968, 12160,
  61249, 11520, 60865, 60545, 11328, 58369, 9408, 9600, 58689, 9984, 59329,
  59009, 9792, 8704, 58049, 58241, 9024, 57601, 8640, 8320, 57409, 40961,
  24768, 24960, 41281, 25344, 41921, 41601, 25152, 26112, 42689, 42881,
  26432, 42241, 26048, 25728, 42049, 27648, 44225, 44417, 27968, 44801,
  28608, 28288, 44609, 43521, 27328, 27520, 43841, 26880, 43457, 43137,
  26688, 30720, 47297, 47489, 31040, 47873, 31680, 31360, 47681, 48641,
  32448, 32640, 48961, 32000, 48577, 48257, 31808, 46081, 29888, 30080,
  46401, 30464, 47041, 46721, 30272, 29184, 45761, 45953, 29504, 45313,
  29120, 28800, 45121, 20480, 37057, 37249, 20800, 37633, 21440, 21120,
  37441, 38401, 22208, 22400, 38721, 21760, 38337, 38017, 21568, 39937,
  23744, 23936, 40257, 24320, 40897, 40577, 24128, 23040, 39617, 39809,
  23360, 39169, 22976, 22656, 38977, 34817, 18624, 18816, 35137, 19200,
  35777, 35457, 19008, 19968, 36545, 36737, 20288, 36097, 19904, 19584,
  35905, 17408, 33985, 34177, 17728, 34561, 18368, 18048, 34369, 33281,
  17088, 17280, 33601, 16640, 33217, 32897, 16448,
];

/** CRC-16/MODBUS checksum */
export function crc16(data: Uint8Array): number {
  let crc = 0xffff;
  for (const byte of data) {
    crc = (crc >> 8) ^ CRC_TABLE[(byte ^ crc) & 0xff];
  }
  return crc & 0xffff;
}

/** Build the 9-byte BLE packet header */
function buildHeader(
  cmd: number,
  seqNum: number,
  totalPkgs: number,
  dataLen: number,
): Uint8Array {
  const header = new Uint8Array(9);
  header[0] = HEADER_MARKER;
  header[1] = PROTOCOL_VERSION;
  header[2] = cmd;
  header[3] = seqNum;
  header[4] = totalPkgs;
  // extendedProtocol = 0 (2 bytes, big-endian)
  header[5] = 0;
  header[6] = 0;
  // validDataLength (2 bytes, big-endian)
  header[7] = (dataLen >> 8) & 0xff;
  header[8] = dataLen & 0xff;
  return header;
}

/** Assemble a protobuf payload into BLE packets, chunked to fit the MTU */
export function createBlePackets(
  data: Uint8Array,
  cmd: number,
  mtu = 20,
): Uint8Array[] {
  const maxPayload = mtu - OVERHEAD;
  if (maxPayload <= 0) throw new Error('MTU too small for BLE packet overhead');

  const totalPkgs = Math.ceil(data.length / maxPayload) || 1;
  const packets: Uint8Array[] = [];

  for (let i = 0; i < totalPkgs; i++) {
    const offset = i * maxPayload;
    const chunk = data.slice(offset, Math.min(offset + maxPayload, data.length));
    const chunkLen = chunk.length;

    const header = buildHeader(cmd, i, totalPkgs, chunkLen);

    // CRC is computed over header + data
    const crcInput = new Uint8Array(9 + chunkLen);
    crcInput.set(header, 0);
    crcInput.set(chunk, 9);
    const checksum = crc16(crcInput);

    // Full packet: header(9) + data + crc(2) + trailer(1)
    const packet = new Uint8Array(9 + chunkLen + 3);
    packet.set(header, 0);
    packet.set(chunk, 9);
    packet[9 + chunkLen] = (checksum >> 8) & 0xff;
    packet[9 + chunkLen + 1] = checksum & 0xff;
    packet[9 + chunkLen + 2] = TRAILER_MARKER;

    packets.push(packet);
  }

  return packets;
}

/** Parse a received BLE packet, returns the payload data and cmd */
export function parseBlePacket(packet: Uint8Array): {
  cmd: number;
  seqNum: number;
  totalPkgs: number;
  data: Uint8Array;
} | null {
  if (packet.length < OVERHEAD || packet[0] !== HEADER_MARKER) return null;

  const cmd = packet[2];
  const seqNum = packet[3];
  const totalPkgs = packet[4];
  const dataLen = (packet[7] << 8) | packet[8];
  const data = packet.slice(9, 9 + dataLen);

  return { cmd, seqNum, totalPkgs, data };
}

/** Reassemble multiple BLE packets into a single protobuf payload */
export function reassembleBlePackets(
  packets: Array<{ seqNum: number; data: Uint8Array }>,
): Uint8Array {
  packets.sort((a, b) => a.seqNum - b.seqNum);
  const totalLen = packets.reduce((sum, p) => sum + p.data.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of packets) {
    result.set(p.data, offset);
    offset += p.data.length;
  }
  return result;
}
