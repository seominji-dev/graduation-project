/**
 * Logger Utility for LLM Scheduler
 *
 * Re-exports shared logger with project-specific default prefix.
 * Enhanced with Correlation ID support for distributed tracing.
 */

import {
  Logger as SharedLogger,
  createLogger as sharedCreateLogger,
  LogLevel,
  LOG_LEVEL_NAMES,
} from '@shared/logger';
import type { LoggerConfig, LogEntry, ILogger } from '@shared/logger';
import { getCorrelationId } from '../middlewares/correlationId';

/**
 * Enhanced Logger class that includes Correlation ID in all log messages
 */
export class Logger implements ILogger {
  private baseLogger: SharedLogger;

  constructor(prefix: string) {
    this.baseLogger = sharedCreateLogger(prefix);
  }

  /**
   * Get metadata with correlation ID included
   */
  private getEnhancedMeta(meta?: unknown): Record<string, unknown> {
    const correlationId = getCorrelationId();
    const baseMeta = meta !== undefined ? { data: meta } : {};
    return {
      correlationId,
      ...baseMeta,
    };
  }

  debug(message: string, meta?: unknown): void {
    this.baseLogger.debug(message, this.getEnhancedMeta(meta));
  }

  info(message: string, meta?: unknown): void {
    this.baseLogger.info(message, this.getEnhancedMeta(meta));
  }

  warn(message: string, meta?: unknown): void {
    this.baseLogger.warn(message, this.getEnhancedMeta(meta));
  }

  error(message: string, meta?: unknown): void {
    this.baseLogger.error(message, this.getEnhancedMeta(meta));
  }

  child(prefix: string): Logger {
    const currentPrefix = (this.baseLogger as unknown as { config: { prefix: string } }).config?.prefix || 'LLMScheduler';
    return new Logger(`${currentPrefix}:${prefix}`);
  }

  setLevel(level: LogLevel): void {
    this.baseLogger.setLevel(level);
  }

  getLevel(): LogLevel {
    return this.baseLogger.getLevel();
  }
}

// Create project-specific logger instance
export const logger = new Logger('LLMScheduler');

// Export for creating module-specific loggers
export const createLogger = (prefix: string): Logger => {
  return new Logger(`LLMScheduler:${prefix}`);
};

// Re-export types and utilities
export { LogLevel, LOG_LEVEL_NAMES };
export type { LoggerConfig, LogEntry, ILogger };

export default logger;
