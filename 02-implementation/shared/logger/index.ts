/**
 * Shared Logger Module
 *
 * Unified logging system for all candidate projects.
 * Provides consistent logging interface with configurable levels and formats.
 *
 * @example
 * // Import default logger
 * import { logger } from '@shared/logger';
 * logger.info('Application started');
 *
 * @example
 * // Create component-specific logger
 * import { createLogger } from '@shared/logger';
 * const log = createLogger('MyComponent');
 * log.debug('Processing data', { count: 42 });
 *
 * @example
 * // Create child logger
 * import { logger } from '@shared/logger';
 * const childLog = logger.child('SubModule');
 * childLog.warn('Something needs attention');
 */

// Export types
export { LogLevel, LOG_LEVEL_NAMES } from './types';
export type { LoggerConfig, LogEntry, ILogger } from './types';

// Export Logger class and factory
export { Logger, createLogger, logger } from './logger';

// Default export
export { logger as default } from './logger';
