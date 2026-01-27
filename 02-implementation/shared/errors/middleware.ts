/**
 * Express Error Handling Middleware
 *
 * Provides standardized error handling for Express applications.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from './AppError';

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
 * Global error handler middleware for Express
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isAppError = AppError.isAppError(err);

  const statusCode = isAppError ? err.statusCode : 500;
  const isOperational = isAppError ? err.isOperational : false;
  const timestamp = isAppError ? err.timestamp.toISOString() : new Date().toISOString();

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
    console.warn('[ErrorHandler]', JSON.stringify(logData));
  } else {
    console.error('[ErrorHandler]', JSON.stringify(logData));
  }

  // Build base response
  const errorResponse: ErrorResponse['error'] = {
    name: err.name,
    message: err.message,
    statusCode,
    isOperational,
    timestamp,
  };

  // Add optional properties if they exist
  if ('details' in err && err.details !== undefined) {
    errorResponse.details = err.details;
  }
  if ('resourceType' in err && typeof err.resourceType === 'string') {
    errorResponse.resourceType = err.resourceType;
  }
  if ('resourceId' in err && typeof err.resourceId === 'string') {
    errorResponse.resourceId = err.resourceId;
  }
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  const response: ErrorResponse = {
    success: false,
    error: errorResponse,
  };

  res.status(statusCode).json(response);
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
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
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
