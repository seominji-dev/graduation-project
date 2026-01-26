/**
 * Global Error Handler Middleware
 *
 * Uses shared error classes and middleware with project-specific logging.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ServiceError,
  errorHandler as sharedErrorHandler,
  notFoundHandler as sharedNotFoundHandler,
  asyncHandler as sharedAsyncHandler,
} from '@shared/errors';
import { createErrorHandler } from '@shared/middlewares';
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

/**
 * Global error handler middleware configured for this project
 */
export const errorHandler = createErrorHandler({
  logger: {
    warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
    error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
  },
  includeStackInDev: true,
});

/**
 * Not found handler for undefined routes
 */
export { notFoundHandler } from '@shared/middlewares';

/**
 * Async handler wrapper
 */
export { asyncHandler } from '@shared/middlewares';

// Re-export error classes for convenience
export {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ServiceError,
};
