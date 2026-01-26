/**
 * Shared Middlewares Module
 *
 * Unified middleware system for all candidate projects.
 * Provides consistent authentication, error handling, and request tracing.
 *
 * @example
 * ```typescript
 * // Import middleware factories
 * import {
 *   createAuthMiddleware,
 *   createErrorHandler,
 *   correlationIdMiddleware,
 * } from '@shared/middlewares';
 *
 * // Create configured middlewares
 * const auth = createAuthMiddleware({
 *   apiKey: config.auth.apiKey,
 *   publicPaths: ['/api/health'],
 *   logger: myLogger,
 * });
 *
 * const errorHandler = createErrorHandler({
 *   logger: myLogger,
 * });
 *
 * // Apply middlewares
 * app.use(correlationIdMiddleware);
 * app.use(auth);
 * // ... routes ...
 * app.use(errorHandler);
 * ```
 */

// Correlation ID Middleware
export {
  correlationIdMiddleware,
  getCorrelationId,
  getRequestContext,
  runWithCorrelationId,
  requestContext,
  CORRELATION_ID_HEADER,
} from './correlationId';
export type { RequestContext } from './correlationId';

// Authentication Middleware
export {
  createAuthMiddleware,
  createAuthMiddlewareOptional,
  extractApiKey,
  isValidApiKey,
  isPublicPath,
  DEFAULT_PUBLIC_PATHS,
} from './auth';
export type { AuthMiddlewareOptions, AuthLogger } from './auth';

// Error Handler Middleware
export {
  createErrorHandler,
  notFoundHandler,
  asyncHandler,
  isAppError,
} from './errorHandler';
export type {
  ErrorHandlerOptions,
  ErrorLogger,
  ErrorResponse,
  BaseAppError,
} from './errorHandler';
