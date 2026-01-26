/**
 * Shared Logger Implementation
 *
 * Production-grade logging utility with configurable log levels.
 * Provides structured logging for all candidate projects.
 */

/* eslint-disable no-console -- Logger utility intentionally uses console methods for output */

import { LogLevel, LOG_LEVEL_NAMES, LoggerConfig, LogEntry, ILogger } from './types';

/**
 * Parse log level from string
 */
function parseLogLevel(level?: string): LogLevel | undefined {
  if (!level) return undefined;
  const upperLevel = level.toUpperCase();
  switch (upperLevel) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    default:
      return undefined;
  }
}

/**
 * Get default log level based on environment
 */
function getDefaultLogLevel(): LogLevel {
  const envLevel = parseLogLevel(process.env.LOG_LEVEL);
  if (envLevel !== undefined) {
    return envLevel;
  }
  return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
}

/**
 * Check if running in production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Logger class implementing ILogger interface
 */
export class Logger implements ILogger {
  private config: Required<LoggerConfig>;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? getDefaultLogLevel(),
      prefix: config.prefix ?? '',
      timestamp: config.timestamp ?? true,
      jsonFormat: config.jsonFormat ?? isProduction(),
    };
  }

  /**
   * Check if the given log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Format message for output
   */
  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level];

    if (this.config.jsonFormat) {
      const entry: LogEntry = {
        timestamp,
        level: levelName,
        message,
        ...(this.config.prefix && { prefix: this.config.prefix }),
        ...(meta !== undefined && { meta }),
      };
      return JSON.stringify(entry);
    }

    const parts: string[] = [];
    if (this.config.timestamp) {
      parts.push(`[${timestamp}]`);
    }
    parts.push(`[${levelName}]`);
    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }
    parts.push(message);
    if (meta !== undefined) {
      parts.push(JSON.stringify(meta));
    }

    return parts.join(' ');
  }

  /**
   * Log debug level message
   */
  debug(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  /**
   * Log info level message
   */
  info(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  /**
   * Log warn level message
   */
  warn(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
  }

  /**
   * Log error level message
   */
  error(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      // Handle Error objects specially
      let errorMeta = meta;
      if (meta instanceof Error) {
        errorMeta = {
          name: meta.name,
          message: meta.message,
          stack: meta.stack,
        };
      }
      console.error(this.formatMessage(LogLevel.ERROR, message, errorMeta));
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    const childPrefix = this.config.prefix
      ? `${this.config.prefix}:${prefix}`
      : prefix;
    return new Logger({
      ...this.config,
      prefix: childPrefix,
    });
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }
}

/**
 * Create a new logger instance with the given prefix
 */
export function createLogger(prefix: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger({ ...config, prefix });
}

/**
 * Default logger instance
 */
export const logger = new Logger();

export default logger;
