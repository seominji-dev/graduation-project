/**
 * Prometheus Metrics for Checkpointing System
 * Collects HTTP request metrics and checkpointing specific metrics
 */

import { Request, Response, NextFunction } from 'express';
import {
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
// Checkpointing Specific Metrics
// ============================================

/**
 * Checkpoints Created Counter
 * Total number of checkpoints created
 */
const checkpointsCreatedTotal = new Counter({
  name: 'checkpoints_created_total',
  help: 'Total number of checkpoints created',
  labelNames: ['agent_id', 'checkpoint_type', 'trigger'],
  registers: [register],
});

/**
 * Checkpoint Creation Duration Histogram
 * Time taken to create checkpoints
 */
const checkpointCreationDuration = new Histogram({
  name: 'checkpoint_creation_duration_seconds',
  help: 'Duration of checkpoint creation in seconds',
  labelNames: ['checkpoint_type', 'compression'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

/**
 * Recovery Duration Histogram
 * Time taken to recover from checkpoints
 */
const recoveryDuration = new Histogram({
  name: 'recovery_duration_seconds',
  help: 'Duration of recovery from checkpoint in seconds',
  labelNames: ['recovery_type', 'success'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

/**
 * Recovery Operations Counter
 * Total number of recovery operations
 */
const recoveriesTotal = new Counter({
  name: 'recoveries_total',
  help: 'Total number of recovery operations',
  labelNames: ['agent_id', 'recovery_type', 'success'],
  registers: [register],
});

/**
 * Checkpoint Size Histogram
 * Size of checkpoints in bytes
 */
const checkpointSizeBytes = new Histogram({
  name: 'checkpoint_size_bytes',
  help: 'Size of checkpoints in bytes',
  labelNames: ['agent_id', 'checkpoint_type'],
  buckets: [1024, 10240, 102400, 1048576, 10485760, 104857600], // 1KB to 100MB
  registers: [register],
});

/**
 * Active Checkpoints Gauge
 * Current number of stored checkpoints per agent
 */
const activeCheckpointsCount = new Gauge({
  name: 'active_checkpoints_count',
  help: 'Current number of stored checkpoints',
  labelNames: ['agent_id'],
  registers: [register],
});

/**
 * Total Storage Used Gauge
 * Total storage used by checkpoints in bytes
 */
const checkpointStorageBytes = new Gauge({
  name: 'checkpoint_storage_bytes',
  help: 'Total storage used by checkpoints in bytes',
  labelNames: ['agent_id'],
  registers: [register],
});

/**
 * Checkpoint Age Gauge
 * Age of the latest checkpoint in seconds
 */
const latestCheckpointAge = new Gauge({
  name: 'latest_checkpoint_age_seconds',
  help: 'Age of the latest checkpoint in seconds',
  labelNames: ['agent_id'],
  registers: [register],
});

/**
 * Rollback Operations Counter
 * Number of rollback operations performed
 */
const rollbacksTotal = new Counter({
  name: 'rollbacks_total',
  help: 'Total number of rollback operations',
  labelNames: ['agent_id', 'reason', 'success'],
  registers: [register],
});

/**
 * Checkpoint Cleanup Counter
 * Number of old checkpoints cleaned up
 */
const checkpointCleanupTotal = new Counter({
  name: 'checkpoint_cleanup_total',
  help: 'Total number of checkpoints cleaned up',
  labelNames: ['agent_id', 'reason'],
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
 * Record checkpoint creation
 */
export function recordCheckpointCreated(
  agentId: string,
  checkpointType: 'full' | 'incremental' | 'periodic',
  trigger: 'manual' | 'periodic' | 'event' | 'threshold'
): void {
  checkpointsCreatedTotal.labels(agentId, checkpointType, trigger).inc();
}

/**
 * Observe checkpoint creation duration
 */
export function observeCheckpointCreationDuration(
  checkpointType: 'full' | 'incremental' | 'periodic',
  compression: 'none' | 'gzip' | 'lz4',
  durationSeconds: number
): void {
  checkpointCreationDuration.labels(checkpointType, compression).observe(durationSeconds);
}

/**
 * Observe recovery duration
 */
export function observeRecoveryDuration(
  recoveryType: 'full' | 'partial' | 'rollback',
  success: boolean,
  durationSeconds: number
): void {
  recoveryDuration.labels(recoveryType, success.toString()).observe(durationSeconds);
}

/**
 * Record recovery operation
 */
export function recordRecovery(
  agentId: string,
  recoveryType: 'full' | 'partial' | 'rollback',
  success: boolean
): void {
  recoveriesTotal.labels(agentId, recoveryType, success.toString()).inc();
}

/**
 * Observe checkpoint size
 */
export function observeCheckpointSize(
  agentId: string,
  checkpointType: 'full' | 'incremental' | 'periodic',
  sizeBytes: number
): void {
  checkpointSizeBytes.labels(agentId, checkpointType).observe(sizeBytes);
}

/**
 * Set active checkpoints count for an agent
 */
export function setActiveCheckpointsCount(agentId: string, count: number): void {
  activeCheckpointsCount.labels(agentId).set(count);
}

/**
 * Set storage used by checkpoints for an agent
 */
export function setCheckpointStorageBytes(agentId: string, bytes: number): void {
  checkpointStorageBytes.labels(agentId).set(bytes);
}

/**
 * Set latest checkpoint age
 */
export function setLatestCheckpointAge(agentId: string, ageSeconds: number): void {
  latestCheckpointAge.labels(agentId).set(ageSeconds);
}

/**
 * Record rollback operation
 */
export function recordRollback(
  agentId: string,
  reason: 'error' | 'manual' | 'corruption' | 'version_mismatch',
  success: boolean
): void {
  rollbacksTotal.labels(agentId, reason, success.toString()).inc();
}

/**
 * Record checkpoint cleanup
 */
export function recordCheckpointCleanup(
  agentId: string,
  reason: 'max_count' | 'max_age' | 'manual'
): void {
  checkpointCleanupTotal.labels(agentId, reason).inc();
}

// Export registry and metrics for testing
export {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
  checkpointsCreatedTotal,
  checkpointCreationDuration,
  recoveryDuration,
  recoveriesTotal,
  checkpointSizeBytes,
  activeCheckpointsCount,
  checkpointStorageBytes,
  latestCheckpointAge,
  rollbacksTotal,
  checkpointCleanupTotal,
};
