import { Logger } from '../utils/logger.js';

export interface HttpTransportOptions {
  host: string;
  port?: number;
  timeout?: number;
  logger?: Logger;
}

export class HttpTransport {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly logger: Logger;

  constructor(options: HttpTransportOptions) {
    const port = options.port ?? 8082;
    this.baseUrl = `http://${options.host}:${port}`;
    this.timeout = options.timeout ?? 10000;
    this.logger = options.logger ?? new Logger();
  }

  async get<T = unknown>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    this.logger.debug('HTTP GET', url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    this.logger.debug('HTTP POST', url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async getRaw(path: string): Promise<ArrayBuffer> {
    const url = `${this.baseUrl}${path}`;
    this.logger.debug('HTTP GET (raw)', url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.arrayBuffer();
    } finally {
      clearTimeout(timer);
    }
  }
}
