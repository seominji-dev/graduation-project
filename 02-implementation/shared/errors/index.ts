/**
 * Shared Error Module
 *
 * Unified error handling system for all candidate projects.
 * Provides consistent error types with statusCode and isOperational properties.
 *
 * @example
 * // Import specific error types
 * import { ValidationError, NotFoundError } from '@shared/errors';
 *
 * // Throw validation error
 * throw ValidationError.missingField('agentId');
 *
 * // Throw not found error
 * throw NotFoundError.forResource('Checkpoint', checkpointId);
 *
 * @example
 * // Check if error is operational
 * import { AppError } from '@shared/errors';
 *
 * if (AppError.isAppError(error) && error.isOperational) {
 *   // Safe to show to user
 * }
 */

// Base error
export { AppError } from './AppError';
export type { AppErrorOptions } from './AppError';

// Specific error types
export { ValidationError } from './ValidationError';
export type { ValidationErrorOptions, ValidationErrorDetails } from './ValidationError';

export { NotFoundError } from './NotFoundError';
export type { NotFoundErrorOptions } from './NotFoundError';

export { DatabaseError } from './DatabaseError';
export type {
  DatabaseErrorOptions,
  DatabaseType,
  DatabaseOperation,
} from './DatabaseError';

export { ServiceError } from './ServiceError';
export type { ServiceErrorOptions, ServiceName } from './ServiceError';

export { ConfigurationError } from './ConfigurationError';
export type { ConfigurationErrorOptions } from './ConfigurationError';

// Re-export middleware
export { errorHandler, notFoundHandler, asyncHandler } from './middleware';
export type { ErrorResponse } from './middleware';
