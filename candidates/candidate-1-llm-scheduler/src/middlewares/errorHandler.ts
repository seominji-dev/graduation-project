/**
 * Global Error Handler Middleware
 *
 * Uses shared error classes for consistent error handling across all projects.
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
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

/**
 * Global error handler middleware
 * Wraps the shared error handler with project-specific logging
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error with project-specific logger
  const isAppError = AppError.isAppError(err);
  const statusCode = isAppError ? err.statusCode : 500;
  const isOperational = isAppError ? err.isOperational : false;

  const logData = {
    name: err.name,
    message: err.message,
    statusCode,
    isOperational,
    url: req.url,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (isOperational) {
    logger.warn('Operational error:', logData);
  } else {
    logger.error('System error:', logData);
  }

  // Delegate to shared error handler
  sharedErrorHandler(err, req, res, next);
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = sharedNotFoundHandler;

/**
 * Async handler wrapper
 */
export const asyncHandler = sharedAsyncHandler;

// Re-export error classes for convenience
export {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ServiceError,
};
