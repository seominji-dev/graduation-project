/**
 * API Key Authentication Middleware
 *
 * Uses shared authentication middleware with project-specific configuration.
 */

import { createAuthMiddleware, createAuthMiddlewareOptional, extractApiKey, isValidApiKey, isPublicPath } from '@shared/middlewares';
import { config } from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthMiddleware');

/**
 * Public paths that don't require authentication
 */
const PUBLIC_PATHS = [
  '/api/health',
  '/health',
];

/**
 * Authentication middleware configured for this project
 */
export const authMiddleware = createAuthMiddleware({
  apiKey: config.auth.apiKey,
  publicPaths: PUBLIC_PATHS,
  logger: {
    warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
    debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
  },
});

/**
 * Optional authentication middleware (logs but doesn't block)
 */
export const authMiddlewareOptional = createAuthMiddlewareOptional({
  apiKey: config.auth.apiKey,
  publicPaths: PUBLIC_PATHS,
  logger: {
    warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
    debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
  },
});

// Re-export utilities for backward compatibility
export { extractApiKey, isValidApiKey, isPublicPath };
