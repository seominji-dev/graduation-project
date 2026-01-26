/**
 * Shared Logger Types
 *
 * Common type definitions for the unified logging system.
 * Used across all candidate projects.
 */

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
  prefix?: string;
  message: string;
  meta?: unknown;
}

/**
 * Logger interface for consistent logging across all projects
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
