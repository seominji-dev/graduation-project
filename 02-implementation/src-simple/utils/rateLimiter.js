/**
 * Rate Limiter - Token bucket (implemented as a 1-minute sliding window counter)
 * Limits requests based on subscription tier.
 *
 * Conceptually a token bucket: each tier has N tokens refilled over a 1-minute
 * window, one token consumed per request. The implementation stores per-tenant
 * timestamps and keeps only those within the current window, which is the
 * simplest faithful realisation of the same behaviour for a per-minute quota.
 *
 * This is a preprocessing step (not a scheduling algorithm).
 * It controls whether a request is allowed to enter the scheduler queue.
 */
const { TIERS } = require('./validation');

// Rate limits: maximum requests per minute per tier
const TIER_LIMITS = {
  [TIERS.ENTERPRISE]: 100,
  [TIERS.PREMIUM]: 50,
  [TIERS.STANDARD]: 10,
  [TIERS.FREE]: 5
};

const WINDOW_MS = 60 * 1000; // 1 minute window

class RateLimiter {
  constructor() {
    // Map of tenantId -> array of request timestamps
    this.windows = {};
  }

  /**
   * Check if a request from a tenant is allowed.
   * @param {string} tenantId - Tenant identifier
   * @param {string} tier - Subscription tier (enterprise/premium/standard/free)
   * @returns {{ allowed: boolean, remaining: number, resetIn: number }}
   */
  isAllowed(tenantId, tier) {
    const now = Date.now();
    const limit = TIER_LIMITS[tier] || TIER_LIMITS[TIERS.FREE];
    const windowStart = now - WINDOW_MS;

    // Initialize if first request from this tenant
    if (!this.windows[tenantId]) {
      this.windows[tenantId] = [];
    }

    // Remove timestamps outside the current window (sliding window cleanup)
    this.windows[tenantId] = this.windows[tenantId].filter(ts => ts > windowStart);

    const count = this.windows[tenantId].length;
    const remaining = Math.max(0, limit - count);

    if (count >= limit) {
      // Find the oldest timestamp to calculate when the window resets
      const oldest = this.windows[tenantId][0];
      const resetIn = Math.ceil((oldest + WINDOW_MS - now) / 1000);
      return { allowed: false, remaining: 0, resetIn };
    }

    // Record this request timestamp
    this.windows[tenantId].push(now);

    return { allowed: true, remaining: remaining - 1, resetIn: 0 };
  }

  /**
   * Clear all counters. Used for testing.
   */
  reset() {
    this.windows = {};
  }
}

module.exports = RateLimiter;
