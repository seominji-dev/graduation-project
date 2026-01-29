/**
 * Rate Limiting Middleware
 * IP-based request rate limiting for API protection
 */

import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Rate limit configuration from environment variables
 */
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "900000", // Default: 15 minutes
  10,
);
const RATE_LIMIT_MAX = parseInt(
  process.env.RATE_LIMIT_MAX || "100", // Default: 100 requests per window
  10,
);

/**
 * Standard error response for rate limit exceeded
 */
interface RateLimitErrorResponse {
  error: string;
  message: string;
  retryAfter: number;
}

/**
 * API Rate Limiter
 * Limits requests per IP address within the configured time window
 */
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: (_req: Request, res: Response): RateLimitErrorResponse => {
    const retryAfter = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
    res.setHeader("Retry-After", retryAfter);
    return {
      error: "TooManyRequests",
      message:
        "Too many requests from this IP, please try again after " +
        Math.ceil(RATE_LIMIT_WINDOW_MS / 60000) +
        " minutes",
      retryAfter,
    };
  },
  keyGenerator: (req: Request): string => {
    // Use X-Forwarded-For header if behind a proxy, otherwise use IP
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket.remoteAddress || "unknown";
  },
  skip: (_req: Request): boolean => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === "test";
  },
});

/**
 * Stricter rate limiter for sensitive endpoints (e.g., auth, submit)
 */
export const strictRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: Math.floor(RATE_LIMIT_MAX / 5), // 5x stricter (default: 20 requests)
  standardHeaders: true,
  legacyHeaders: false,
  message: (_req: Request, res: Response): RateLimitErrorResponse => {
    const retryAfter = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
    res.setHeader("Retry-After", retryAfter);
    return {
      error: "TooManyRequests",
      message:
        "Too many requests to this endpoint, please try again after " +
        Math.ceil(RATE_LIMIT_WINDOW_MS / 60000) +
        " minutes",
      retryAfter,
    };
  },
  keyGenerator: (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket.remoteAddress || "unknown";
  },
  skip: (_req: Request): boolean => {
    return process.env.NODE_ENV === "test";
  },
});

export default apiRateLimiter;
