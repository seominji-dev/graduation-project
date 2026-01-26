/**
 * Prometheus Metrics for Memory Manager
 * Collects HTTP request metrics and memory management specific metrics
 */

import { Request, Response, NextFunction } from 'express';
import client, {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

// Create a custom registry
const register = new Registry();

// Add default metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({ register });

// ============================================
// HTTP Metrics (Common)
// ============================================

/**
 * HTTP Request Counter
 * Counts total number of HTTP requests by method, route, and status code
 */
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * HTTP Request Duration Histogram
 * Measures response time in seconds
 */
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * HTTP Errors Counter
 * Counts total number of HTTP errors (4xx and 5xx)
 */
const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code', 'error_type'],
  registers: [register],
});

// ============================================
// Memory Manager Specific Metrics
// ============================================

/**
 * Cache Hit Rate Tracking
 * Separate counters for hits and misses to calculate rate
 */
const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_level', 'agent_id'],
  registers: [register],
});

const cacheMissesTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_level', 'agent_id'],
  registers: [register],
});

/**
 * Cache Hit Rate Gauge (calculated)
 * Current cache hit rate (0-1)
 */
const cacheHitRate = new Gauge({
  name: 'cache_hit_rate',
  help: 'Current cache hit rate (0-1)',
  labelNames: ['cache_level'],
  registers: [register],
});

/**
 * Memory Usage Gauges
 * Memory usage by level (L1, L2, L3)
 */
const memoryUsageBytes = new Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes by cache level',
  labelNames: ['cache_level', 'type'],
  registers: [register],
});

/**
 * Cache Entry Count
 * Number of entries in each cache level
 */
const cacheEntryCount = new Gauge({
  name: 'cache_entry_count',
  help: 'Number of entries in each cache level',
  labelNames: ['cache_level'],
  registers: [register],
});

/**
 * Page Faults Counter
 * Counts page faults (cache misses requiring disk/network access)
 */
const pageFaultsTotal = new Counter({
  name: 'page_faults_total',
  help: 'Total number of page faults',
  labelNames: ['fault_type', 'agent_id'],
  registers: [register],
});

/**
 * Memory Operations Duration
 * Time taken for memory operations
 */
const memoryOperationDuration = new Histogram({
  name: 'memory_operation_duration_seconds',
  help: 'Duration of memory operations in seconds',
  labelNames: ['operation', 'cache_level'],
  buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

/**
 * Eviction Counter
 * Counts cache evictions by level
 */
const cacheEvictionsTotal = new Counter({
  name: 'cache_evictions_total',
  help: 'Total number of cache evictions',
  labelNames: ['cache_level', 'reason'],
  registers: [register],
});

// ============================================
// Express Middleware
// ============================================

/**
 * Prometheus metrics middleware for Express
 * Records HTTP request metrics
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationInSeconds = Number(endTime - startTime) / 1e9;

    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Record request count
    httpRequestsTotal.labels(method, route, statusCode).inc();

    // Record request duration
    httpRequestDuration.labels(method, route, statusCode).observe(durationInSeconds);

    // Record errors
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      httpErrorsTotal.labels(method, route, statusCode, errorType).inc();
    }
  });

  next();
}

/**
 * Metrics endpoint handler
 * Returns Prometheus-formatted metrics
 */
export async function metricsHandler(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end('Error collecting metrics');
  }
}

// ============================================
// Metric Helper Functions
// ============================================

/**
 * Record cache hit
 */
export function recordCacheHit(cacheLevel: string, agentId: string = 'unknown'): void {
  cacheHitsTotal.labels(cacheLevel, agentId).inc();
}

/**
 * Record cache miss
 */
export function recordCacheMiss(cacheLevel: string, agentId: string = 'unknown'): void {
  cacheMissesTotal.labels(cacheLevel, agentId).inc();
}

/**
 * Update cache hit rate
 */
export function updateCacheHitRate(cacheLevel: string, rate: number): void {
  cacheHitRate.labels(cacheLevel).set(rate);
}

/**
 * Set memory usage
 */
export function setMemoryUsage(cacheLevel: string, type: string, bytes: number): void {
  memoryUsageBytes.labels(cacheLevel, type).set(bytes);
}

/**
 * Set cache entry count
 */
export function setCacheEntryCount(cacheLevel: string, count: number): void {
  cacheEntryCount.labels(cacheLevel).set(count);
}

/**
 * Record page fault
 */
export function recordPageFault(faultType: 'soft' | 'hard', agentId: string = 'unknown'): void {
  pageFaultsTotal.labels(faultType, agentId).inc();
}

/**
 * Observe memory operation duration
 */
export function observeMemoryOperationDuration(
  operation: 'get' | 'put' | 'delete' | 'search',
  cacheLevel: string,
  durationSeconds: number
): void {
  memoryOperationDuration.labels(operation, cacheLevel).observe(durationSeconds);
}

/**
 * Record cache eviction
 */
export function recordCacheEviction(cacheLevel: string, reason: 'lru' | 'ttl' | 'manual'): void {
  cacheEvictionsTotal.labels(cacheLevel, reason).inc();
}

// Export registry and metrics for testing
export {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
  cacheHitsTotal,
  cacheMissesTotal,
  cacheHitRate,
  memoryUsageBytes,
  cacheEntryCount,
  pageFaultsTotal,
  memoryOperationDuration,
  cacheEvictionsTotal,
};
