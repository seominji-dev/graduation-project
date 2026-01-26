/**
 * Correlation ID Middleware for Distributed Tracing
 *
 * Implements request correlation across services using AsyncLocalStorage.
 * - Extracts X-Correlation-ID from request headers if present
 * - Generates a new UUID if no correlation ID is provided
 * - Sets X-Correlation-ID in response headers
 * - Stores correlation ID in AsyncLocalStorage for access throughout request lifecycle
 */

import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * Request context stored in AsyncLocalStorage
 */
export interface RequestContext {
  /** Unique correlation ID for distributed tracing */
  correlationId: string;
  /** Request start timestamp */
  startTime: number;
  /** Optional request path for logging */
  path?: string;
  /** Optional HTTP method */
  method?: string;
}

/**
 * Header name for correlation ID
 */
export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

/**
 * AsyncLocalStorage instance for request context
 * Provides access to correlation ID throughout the request lifecycle
 */
export const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current correlation ID from the request context
 * Returns 'unknown' if no context is available (e.g., outside of request handling)
 *
 * @returns The current correlation ID or 'unknown'
 */
export function getCorrelationId(): string {
  const context = requestContext.getStore();
  return context?.correlationId ?? 'unknown';
}

/**
 * Get the full request context
 * Returns undefined if no context is available
 *
 * @returns The current request context or undefined
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}

/**
 * Express middleware for correlation ID handling
 *
 * This middleware:
 * 1. Extracts X-Correlation-ID from incoming request headers (if present)
 * 2. Generates a new UUID v4 if no correlation ID is provided
 * 3. Sets X-Correlation-ID in response headers
 * 4. Creates a request context with AsyncLocalStorage for access throughout the request
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Extract correlation ID from request header or generate a new one
  const incomingCorrelationId = req.get(CORRELATION_ID_HEADER);
  const correlationId = incomingCorrelationId || randomUUID();

  // Set correlation ID in response header for client tracing
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  // Create request context
  const context: RequestContext = {
    correlationId,
    startTime: Date.now(),
    path: req.path,
    method: req.method,
  };

  // Run the rest of the request handling within the AsyncLocalStorage context
  requestContext.run(context, () => {
    next();
  });
}

/**
 * Higher-order function to wrap async handlers with correlation context
 * Useful for background tasks that need access to the correlation ID
 *
 * @param correlationId - The correlation ID to use for the context
 * @param fn - The async function to execute within the context
 * @returns The result of the async function
 */
export async function runWithCorrelationId<T>(
  correlationId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const context: RequestContext = {
    correlationId,
    startTime: Date.now(),
  };

  return requestContext.run(context, fn);
}

export default correlationIdMiddleware;
