/**
 * Logger Utility for Deadlock Detector
 *
 * Standalone logger implementation for project-specific logging.
 * Enhanced with Correlation ID support for distributed tracing.
 */

/* eslint-disable no-console -- Logger utility intentionally uses console methods for output */

import { getCorrelationId } from '../api/middlewares/correlationId.js';

/**
 * Log levels with numeric values for comparison
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log level name mapping
 */
export const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Component/module prefix for log messages */
  prefix?: string;
  /** Include timestamp in log output (default: true) */
  timestamp?: boolean;
  /** Use JSON format for structured logging (default: auto based on NODE_ENV) */
  jsonFormat?: boolean;
}

/**
 * Structured log entry for JSON output
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  correlationId: string;
  prefix?: string;
  message: string;
  meta?: unknown;
}

/**
 * Logger interface for consistent logging
 */
export interface ILogger {
  /** Log debug level message */
  debug(message: string, meta?: unknown): void;
  /** Log info level message */
  info(message: string, meta?: unknown): void;
  /** Log warn level message */
  warn(message: string, meta?: unknown): void;
  /** Log error level message */
  error(message: string, meta?: unknown): void;
  /** Create a child logger with a specific prefix */
  child(prefix: string): ILogger;
  /** Set log level dynamically */
  setLevel(level: LogLevel): void;
  /** Get current log level */
  getLevel(): LogLevel;
}

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
    const correlationId = getCorrelationId();

    if (this.config.jsonFormat) {
      const entry: LogEntry = {
        timestamp,
        level: levelName,
        correlationId,
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
    parts.push(`[${correlationId}]`);
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

// Create project-specific logger instance
export const logger = createLogger('DeadlockDetector');

export default logger;
