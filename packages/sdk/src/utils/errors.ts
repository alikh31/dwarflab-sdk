import { ErrorCode, getErrorMessage } from '../protocol/error-codes.js';

export class DwarfError extends Error {
  readonly code: number;
  readonly cmd: number;

  constructor(code: number, cmd: number, message?: string) {
    super(message ?? getErrorMessage(code));
    this.name = 'DwarfError';
    this.code = code;
    this.cmd = cmd;
  }

  get isOk(): boolean {
    return this.code === ErrorCode.OK;
  }
}
