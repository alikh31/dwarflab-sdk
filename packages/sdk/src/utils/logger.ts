export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

export class Logger {
  private level: number;

  constructor(level: LogLevel = 'warn') {
    this.level = LEVEL_ORDER[level];
  }

  setLevel(level: LogLevel): void {
    this.level = LEVEL_ORDER[level];
  }

  debug(...args: unknown[]): void {
    if (this.level <= 0) console.debug('[dwarf]', ...args);
  }

  info(...args: unknown[]): void {
    if (this.level <= 1) console.info('[dwarf]', ...args);
  }

  warn(...args: unknown[]): void {
    if (this.level <= 2) console.warn('[dwarf]', ...args);
  }

  error(...args: unknown[]): void {
    if (this.level <= 3) console.error('[dwarf]', ...args);
  }
}
