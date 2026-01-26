/**
 * Prometheus Metrics for Deadlock Detector
 * Collects HTTP request metrics and deadlock detection specific metrics
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
// Deadlock Detector Specific Metrics
// ============================================

/**
 * Detected Deadlocks Counter
 * Total number of deadlocks detected
 */
const deadlocksDetectedTotal = new Counter({
  name: 'deadlocks_detected_total',
  help: 'Total number of deadlocks detected',
  labelNames: ['detection_method', 'severity'],
  registers: [register],
});

/**
 * Deadlock Recovery Duration Histogram
 * Time taken to recover from deadlocks
 */
const deadlockRecoveryDuration = new Histogram({
  name: 'deadlock_recovery_duration_seconds',
  help: 'Duration of deadlock recovery in seconds',
  labelNames: ['recovery_strategy', 'success'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

/**
 * Active Agents Gauge
 * Current number of active agents in the system
 */
const activeAgentsCount = new Gauge({
  name: 'active_agents_count',
  help: 'Current number of active agents',
  registers: [register],
});

/**
 * Resource Lock Counter
 * Total number of resource locks acquired
 */
const resourceLocksTotal = new Counter({
  name: 'resource_locks_total',
  help: 'Total number of resource locks acquired',
  labelNames: ['resource_type', 'agent_id'],
  registers: [register],
});

/**
 * Wait-For Graph Edges Gauge
 * Current number of edges in the wait-for graph
 */
const waitForGraphEdges = new Gauge({
  name: 'wait_for_graph_edges',
  help: 'Current number of edges in the wait-for graph',
  registers: [register],
});

/**
 * Wait-For Graph Nodes Gauge
 * Current number of nodes (agents) in the wait-for graph
 */
const waitForGraphNodes = new Gauge({
  name: 'wait_for_graph_nodes',
  help: 'Current number of nodes in the wait-for graph',
  registers: [register],
});

/**
 * Cycle Detection Duration
 * Time taken to detect cycles in the wait-for graph
 */
const cycleDetectionDuration = new Histogram({
  name: 'cycle_detection_duration_seconds',
  help: 'Duration of cycle detection in seconds',
  labelNames: ['algorithm'],
  buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1],
  registers: [register],
});

/**
 * Victim Selection Counter
 * Number of times an agent was selected as victim
 */
const victimSelectionsTotal = new Counter({
  name: 'victim_selections_total',
  help: 'Total number of victim selections for deadlock resolution',
  labelNames: ['selection_strategy', 'agent_id'],
  registers: [register],
});

/**
 * Deadlock Prevention Counter
 * Number of deadlocks prevented by safety checks
 */
const deadlocksPreventedTotal = new Counter({
  name: 'deadlocks_prevented_total',
  help: 'Total number of deadlocks prevented',
  labelNames: ['prevention_method'],
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
  next: NextFunction,
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
  res: Response,
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
 * Record detected deadlock
 */
export function recordDeadlockDetected(
  detectionMethod: 'cycle_detection' | 'timeout' | 'manual',
  severity: 'low' | 'medium' | 'high' | 'critical',
): void {
  deadlocksDetectedTotal.labels(detectionMethod, severity).inc();
}

/**
 * Observe deadlock recovery duration
 */
export function observeDeadlockRecoveryDuration(
  recoveryStrategy: 'rollback' | 'abort' | 'preempt',
  success: boolean,
  durationSeconds: number,
): void {
  deadlockRecoveryDuration
    .labels(recoveryStrategy, success.toString())
    .observe(durationSeconds);
}

/**
 * Set active agents count
 */
export function setActiveAgentsCount(count: number): void {
  activeAgentsCount.set(count);
}

/**
 * Record resource lock
 */
export function recordResourceLock(resourceType: string, agentId: string): void {
  resourceLocksTotal.labels(resourceType, agentId).inc();
}

/**
 * Update wait-for graph metrics
 */
export function updateWaitForGraphMetrics(edges: number, nodes: number): void {
  waitForGraphEdges.set(edges);
  waitForGraphNodes.set(nodes);
}

/**
 * Observe cycle detection duration
 */
export function observeCycleDetectionDuration(
  algorithm: 'dfs' | 'tarjan' | 'kosaraju',
  durationSeconds: number,
): void {
  cycleDetectionDuration.labels(algorithm).observe(durationSeconds);
}

/**
 * Record victim selection
 */
export function recordVictimSelection(
  selectionStrategy: 'youngest' | 'oldest' | 'lowest_priority' | 'minimum_cost',
  agentId: string,
): void {
  victimSelectionsTotal.labels(selectionStrategy, agentId).inc();
}

/**
 * Record deadlock prevented
 */
export function recordDeadlockPrevented(
  preventionMethod: 'bankers_algorithm' | 'resource_ordering' | 'timeout',
): void {
  deadlocksPreventedTotal.labels(preventionMethod).inc();
}

// Export registry and metrics for testing
export {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
  deadlocksDetectedTotal,
  deadlockRecoveryDuration,
  activeAgentsCount,
  resourceLocksTotal,
  waitForGraphEdges,
  waitForGraphNodes,
  cycleDetectionDuration,
  victimSelectionsTotal,
  deadlocksPreventedTotal,
};
