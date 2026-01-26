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
 */

import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * Public paths that don't require authentication
 */
const PUBLIC_PATHS = [
  '/api/health',
  '/health',
  '/api/stats',
];

/**
 * Check if a path is public (no auth required)
 */
function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(publicPath =>
    path === publicPath || path.startsWith(publicPath + '/')
  );
}

/**
 * Extract API key from request headers
 * Supports:
 * - X-API-Key: <api-key>
 * - Authorization: Bearer <api-key>
 */
function extractApiKey(req: Request): string | null {
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
function isValidApiKey(providedKey: string, expectedKey: string): boolean {
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
 * Authentication middleware
 * Validates API key for protected endpoints
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip authentication for public paths
  if (isPublicPath(req.path)) {
    return next();
  }

  const apiKey = extractApiKey(req);

  if (!apiKey) {
    logger.warn('Authentication failed: Missing API key', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'API key is required. Provide via X-API-Key header or Authorization: Bearer token.',
    });
    return;
  }

  if (!isValidApiKey(apiKey, config.auth.apiKey)) {
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
}

/**
 * Optional: Middleware that only logs but doesn't block (for development)
 */
export function authMiddlewareOptional(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (isPublicPath(req.path)) {
    return next();
  }

  const apiKey = extractApiKey(req);

  if (!apiKey || !isValidApiKey(apiKey, config.auth.apiKey)) {
    logger.warn('Authentication warning: Invalid or missing API key (optional mode)', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  next();
}

export { extractApiKey, isValidApiKey, isPublicPath };
