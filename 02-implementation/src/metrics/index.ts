/**
 * Prometheus Metrics for LLM Scheduler
 * Collects HTTP request metrics and scheduler-specific metrics
 */

import { Request, Response, NextFunction } from "express";
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

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
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

/**
 * HTTP Request Duration Histogram
 * Measures response time in seconds
 */
const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * HTTP Errors Counter
 * Counts total number of HTTP errors (4xx and 5xx)
 */
const httpErrorsTotal = new Counter({
  name: "http_errors_total",
  help: "Total number of HTTP errors",
  labelNames: ["method", "route", "status_code", "error_type"],
  registers: [register],
});

// ============================================
// LLM Scheduler Specific Metrics
// ============================================

/**
 * Scheduling Queue Size Gauge
 * Current number of requests in the scheduling queue
 */
const schedulerQueueSize = new Gauge({
  name: "scheduler_queue_size",
  help: "Current number of requests in the scheduling queue",
  labelNames: ["queue_name", "priority"],
  registers: [register],
});

/**
 * Processed Requests Counter
 * Total number of LLM requests processed
 */
const schedulerRequestsProcessed = new Counter({
  name: "scheduler_requests_processed_total",
  help: "Total number of LLM requests processed by the scheduler",
  labelNames: ["tenant_id", "scheduler_type", "status"],
  registers: [register],
});

/**
 * LLM Request Processing Duration
 * Time taken to process LLM requests
 */
const llmRequestDuration = new Histogram({
  name: "llm_request_duration_seconds",
  help: "Duration of LLM request processing in seconds",
  labelNames: ["tenant_id", "model", "scheduler_type"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [register],
});

/**
 * Active Requests Gauge
 * Current number of requests being processed
 */
const schedulerActiveRequests = new Gauge({
  name: "scheduler_active_requests",
  help: "Current number of requests being processed",
  labelNames: ["scheduler_type"],
  registers: [register],
});

/**
 * Tenant Request Counter
 * Requests per tenant for fairness tracking
 */
const tenantRequestsTotal = new Counter({
  name: "tenant_requests_total",
  help: "Total requests per tenant",
  labelNames: ["tenant_id"],
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

  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const durationInSeconds = Number(endTime - startTime) / 1e9;

    const route: string =
      (req.route as { path?: string } | undefined)?.path ||
      req.path ||
      "unknown";
    const method: string = req.method;
    const statusCode: string = res.statusCode.toString();

    // Record request count
    httpRequestsTotal.labels(method, route, statusCode).inc();

    // Record request duration
    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(durationInSeconds);

    // Record errors
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? "server_error" : "client_error";
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
    res.set("Content-Type", register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end("Error collecting metrics");
  }
}

// ============================================
// Metric Helper Functions
// ============================================

/**
 * Update queue size metric
 */
export function setQueueSize(
  queueName: string,
  priority: string,
  size: number,
): void {
  schedulerQueueSize.labels(queueName, priority).set(size);
}

/**
 * Increment processed requests counter
 */
export function incProcessedRequests(
  tenantId: string,
  schedulerType: string,
  status: "success" | "failure",
): void {
  schedulerRequestsProcessed.labels(tenantId, schedulerType, status).inc();
}

/**
 * Observe LLM request duration
 */
export function observeLLMRequestDuration(
  tenantId: string,
  model: string,
  schedulerType: string,
  durationSeconds: number,
): void {
  llmRequestDuration
    .labels(tenantId, model, schedulerType)
    .observe(durationSeconds);
}

/**
 * Set active requests count
 */
export function setActiveRequests(schedulerType: string, count: number): void {
  schedulerActiveRequests.labels(schedulerType).set(count);
}

/**
 * Increment tenant request counter
 */
export function incTenantRequests(tenantId: string): void {
  tenantRequestsTotal.labels(tenantId).inc();
}

// Export registry and metrics for testing
export {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
  schedulerQueueSize,
  schedulerRequestsProcessed,
  llmRequestDuration,
  schedulerActiveRequests,
  tenantRequestsTotal,
};
