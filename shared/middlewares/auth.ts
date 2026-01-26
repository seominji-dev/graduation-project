/**
 * API Key Authentication Middleware
 *
 * Validates API key from request headers for secure endpoint access.
 * Supports both X-API-Key and Authorization: Bearer formats.
 *
 * Security features:
 * - Timing-safe comparison to prevent timing attacks
 * - Structured error responses
 * - Authentication failure logging
 * - Configurable public paths
 */

import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';

/**
 * Logger interface for authentication middleware
 * Allows injection of project-specific logger
 */
export interface AuthLogger {
  warn(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Default console logger
 */
const defaultLogger: AuthLogger = {
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn('[AuthMiddleware]', message, meta ? JSON.stringify(meta) : '');
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[AuthMiddleware]', message, meta ? JSON.stringify(meta) : '');
    }
  },
};

/**
 * Configuration options for authentication middleware
 */
export interface AuthMiddlewareOptions {
  /** Expected API key for validation */
  apiKey: string;
  /** Paths that don't require authentication */
  publicPaths?: string[];
  /** Custom logger instance */
  logger?: AuthLogger;
}

/**
 * Default public paths that don't require authentication
 */
const DEFAULT_PUBLIC_PATHS = ['/api/health', '/health'];

/**
 * Check if a path is public (no auth required)
 */
function isPublicPath(path: string, publicPaths: string[]): boolean {
  return publicPaths.some(
    (publicPath) => path === publicPath || path.startsWith(publicPath + '/')
  );
}

/**
 * Extract API key from request headers
 * Supports:
 * - X-API-Key: <api-key>
 * - Authorization: Bearer <api-key>
 */
export function extractApiKey(req: Request): string | null {
  // Check X-API-Key header first
  const xApiKey = req.headers['x-api-key'];
  if (typeof xApiKey === 'string' && xApiKey.length > 0) {
    return xApiKey;
  }

  // Check Authorization header (Bearer token)
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token.length > 0) {
      return token;
    }
  }

  return null;
}

/**
 * Timing-safe comparison of API keys
 * Prevents timing attacks by ensuring constant-time comparison
 */
export function isValidApiKey(providedKey: string, expectedKey: string): boolean {
  try {
    // Ensure both keys are the same length for timing-safe comparison
    const providedBuffer = Buffer.from(providedKey, 'utf8');
    const expectedBuffer = Buffer.from(expectedKey, 'utf8');

    // If lengths differ, still perform comparison to maintain constant time
    if (providedBuffer.length !== expectedBuffer.length) {
      // Compare with itself to maintain timing consistency
      timingSafeEqual(expectedBuffer, expectedBuffer);
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Create authentication middleware with configuration
 *
 * @param options - Configuration options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * import { createAuthMiddleware } from '@shared/middlewares';
 * import { config } from './config';
 * import logger from './utils/logger';
 *
 * const authMiddleware = createAuthMiddleware({
 *   apiKey: config.auth.apiKey,
 *   publicPaths: ['/api/health', '/health', '/api/stats'],
 *   logger: logger,
 * });
 *
 * app.use(authMiddleware);
 * ```
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions) {
  const { apiKey, publicPaths = DEFAULT_PUBLIC_PATHS, logger = defaultLogger } = options;

  return function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Skip authentication for public paths
    if (isPublicPath(req.path, publicPaths)) {
      return next();
    }

    const extractedApiKey = extractApiKey(req);

    if (!extractedApiKey) {
      logger.warn('Authentication failed: Missing API key', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message:
          'API key is required. Provide via X-API-Key header or Authorization: Bearer token.',
      });
      return;
    }

    if (!isValidApiKey(extractedApiKey, apiKey)) {
      logger.warn('Authentication failed: Invalid API key', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid API key.',
      });
      return;
    }

    // Authentication successful
    logger.debug('Authentication successful', {
      path: req.path,
      method: req.method,
    });

    next();
  };
}

/**
 * Create optional authentication middleware (logs but doesn't block)
 *
 * @param options - Configuration options
 * @returns Express middleware function
 */
export function createAuthMiddlewareOptional(options: AuthMiddlewareOptions) {
  const { apiKey, publicPaths = DEFAULT_PUBLIC_PATHS, logger = defaultLogger } = options;

  return function authMiddlewareOptional(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (isPublicPath(req.path, publicPaths)) {
      return next();
    }

    const extractedApiKey = extractApiKey(req);

    if (!extractedApiKey || !isValidApiKey(extractedApiKey, apiKey)) {
      logger.warn('Authentication warning: Invalid or missing API key (optional mode)', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
    }

    next();
  };
}

export { isPublicPath, DEFAULT_PUBLIC_PATHS };
