/**
 * Logger utility for Deadlock Detector
 *
 * Provides structured logging with different log levels.
 * Replaces direct console.log usage for production-ready logging.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

class Logger {
  private logLevel: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && Object.values(LogLevel).includes(envLevel as LogLevel)) {
      return envLevel as LogLevel;
    }
    return this.isProduction ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ' ' + JSON.stringify(context) : '';

    if (this.isProduction) {
      const entry: LogEntry = {
        timestamp,
        level,
        message,
        ...(context && { context }),
      };
      return JSON.stringify(entry);
    }

    return '[' + timestamp + '] [' + level + '] ' + message + contextStr;
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  public info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      // eslint-disable-next-line no-console
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      // eslint-disable-next-line no-console
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  public error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext =
        error instanceof Error
          ? { ...context, errorName: error.name, errorMessage: error.message, stack: error.stack }
          : { ...context, error: String(error) };
      // eslint-disable-next-line no-console
      console.error(this.formatMessage(LogLevel.ERROR, message, errorContext));
    }
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

export const logger = new Logger();

export default logger;
