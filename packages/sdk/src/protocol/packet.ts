import { dwarflab } from '../generated/proto.js';
import { MessageType } from './message-types.js';
import { cmdToModule, ModuleId } from './modules.js';

const PROTOCOL_MAJOR = 1;
const PROTOCOL_MINOR = 20;

export interface PacketHeader {
  majorVersion: number;
  minorVersion: number;
  deviceId: number;
  moduleId: ModuleId;
  cmd: number;
  type: MessageType;
  clientId: string;
}

export interface Packet extends PacketHeader {
  data: Uint8Array;
}

export function encodePacket(
  cmd: number,
  type: MessageType,
  data: Uint8Array,
  clientId: string,
  deviceId = 0,
): Uint8Array {
  const moduleId = cmdToModule(cmd);
  const wsPacket = dwarflab.base.WsPacket.create({
    majorVersion: PROTOCOL_MAJOR,
    minorVersion: PROTOCOL_MINOR,
    deviceId,
    moduleId,
    cmd,
    type,
    data,
    clientId,
  });
  return dwarflab.base.WsPacket.encode(wsPacket).finish();
}

export function decodePacket(buf: Uint8Array): Packet {
  const wsPacket = dwarflab.base.WsPacket.decode(buf);
  return {
    majorVersion: wsPacket.majorVersion,
    minorVersion: wsPacket.minorVersion,
    deviceId: wsPacket.deviceId,
    moduleId: wsPacket.moduleId as number as ModuleId,
    cmd: wsPacket.cmd,
    type: wsPacket.type as number as MessageType,
    data: wsPacket.data instanceof Uint8Array
      ? wsPacket.data
      : new Uint8Array(wsPacket.data ?? []),
    clientId: wsPacket.clientId,
  };
}

export function createRequestPacket(
  cmd: number,
  payload: Uint8Array,
  clientId: string,
  deviceId = 0,
): Uint8Array {
  return encodePacket(cmd, MessageType.REQUEST, payload, clientId, deviceId);
}
