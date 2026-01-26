/**
 * Global Error Handler Middleware Factory
 *
 * Provides a configurable error handler that wraps error processing
 * with project-specific logging while maintaining consistent error responses.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Base error interface compatible with AppError from @shared/errors
 */
export interface BaseAppError extends Error {
  statusCode: number;
  isOperational: boolean;
  timestamp?: Date;
  details?: unknown;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Logger interface for error handler middleware
 */
export interface ErrorLogger {
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Default console logger
 */
const defaultLogger: ErrorLogger = {
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn('[ErrorHandler]', message, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error('[ErrorHandler]', message, meta ? JSON.stringify(meta) : '');
  },
};

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    name: string;
    message: string;
    statusCode: number;
    isOperational: boolean;
    timestamp: string;
    details?: unknown;
    resourceType?: string;
    resourceId?: string;
    stack?: string;
  };
}

/**
 * Configuration options for error handler middleware
 */
export interface ErrorHandlerOptions {
  /** Custom logger instance */
  logger?: ErrorLogger;
  /** Include stack traces in development */
  includeStackInDev?: boolean;
}

/**
 * Check if error is an AppError (has statusCode and isOperational)
 */
export function isAppError(err: Error): err is BaseAppError {
  return (
    typeof (err as BaseAppError).statusCode === 'number' &&
    typeof (err as BaseAppError).isOperational === 'boolean'
  );
}

/**
 * Create error handler middleware with configuration
 *
 * @param options - Configuration options
 * @returns Express error handler middleware
 *
 * @example
 * ```typescript
 * import { createErrorHandler } from '@shared/middlewares';
 * import logger from './utils/logger';
 *
 * const errorHandler = createErrorHandler({
 *   logger: logger,
 *   includeStackInDev: true,
 * });
 *
 * // Use as last middleware
 * app.use(errorHandler);
 * ```
 */
export function createErrorHandler(options: ErrorHandlerOptions = {}) {
  const { logger = defaultLogger, includeStackInDev = true } = options;

  return function errorHandler(
    err: Error | BaseAppError,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    const appError = isAppError(err);
    const statusCode = appError ? err.statusCode : 500;
    const isOperational = appError ? err.isOperational : false;
    const timestamp = appError && err.timestamp
      ? err.timestamp.toISOString()
      : new Date().toISOString();

    // Build log data
    const logData: Record<string, unknown> = {
      name: err.name,
      message: err.message,
      statusCode,
      isOperational,
      url: req.url,
      method: req.method,
    };

    if (includeStackInDev && process.env.NODE_ENV === 'development') {
      logData.stack = err.stack;
    }

    // Log with appropriate severity
    if (isOperational) {
      logger.warn('Operational error:', logData);
    } else {
      logger.error('System error:', logData);
    }

    // Build response
    const errorResponse: ErrorResponse['error'] = {
      name: err.name,
      message: err.message,
      statusCode,
      isOperational,
      timestamp,
    };

    // Add optional properties if they exist
    if (appError) {
      if (err.details !== undefined) {
        errorResponse.details = err.details;
      }
      if (err.resourceType) {
        errorResponse.resourceType = err.resourceType;
      }
      if (err.resourceId) {
        errorResponse.resourceId = err.resourceId;
      }
    }

    if (includeStackInDev && process.env.NODE_ENV === 'development' && err.stack) {
      errorResponse.stack = err.stack;
    }

    const response: ErrorResponse = {
      success: false,
      error: errorResponse,
    };

    res.status(statusCode).json(response);
  };
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      name: 'NotFoundError',
      message: 'Route not found: ' + req.method + ' ' + req.url,
      statusCode: 404,
      isOperational: true,
      timestamp: new Date().toISOString(),
      path: req.url,
    },
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
