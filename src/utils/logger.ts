import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: any;
}

class Logger {
  private logStream;

  constructor() {
    const logsDir = join(process.cwd(), 'logs');
    mkdirSync(logsDir, { recursive: true });
    this.logStream = createWriteStream(join(logsDir, 'app.log'), { flags: 'a' });
  }

  private redact(value: any): any {
    const sensitiveKeys = new Set([
      'password',
      'passwordHash',
      'oldPassword',
      'newPassword',
      'refreshToken',
      'accessToken',
      'authorization',
      'token',
      'secret',
      'smtpPass',
      'SMTP_PASS',
      'databaseUrl',
      'DATABASE_URL',
      'paddleSignature',
      'signature',
    ]);

    if (Array.isArray(value)) {
      return value.map(item => this.redact(item));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          sensitiveKeys.has(key) ? '[REDACTED]' : this.redact(item),
        ])
      );
    }

    return value;
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      metadata: this.redact(entry.metadata),
      timestamp: new Date().toISOString(),
    }) + '\n';
  }

  private writeLog(entry: LogEntry): void {
    const formattedLog = this.formatLog(entry);
    this.logStream.write(formattedLog);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(formattedLog.trim());
    }
  }

  error(message: string, metadata?: any): void {
    this.writeLog({ level: LogLevel.ERROR, message, metadata, timestamp: new Date().toISOString() });
  }

  warn(message: string, metadata?: any): void {
    this.writeLog({ level: LogLevel.WARN, message, metadata, timestamp: new Date().toISOString() });
  }

  info(message: string, metadata?: any): void {
    this.writeLog({ level: LogLevel.INFO, message, metadata, timestamp: new Date().toISOString() });
  }

  debug(message: string, metadata?: any): void {
    this.writeLog({ level: LogLevel.DEBUG, message, metadata, timestamp: new Date().toISOString() });
  }
}

export const logger = new Logger();
