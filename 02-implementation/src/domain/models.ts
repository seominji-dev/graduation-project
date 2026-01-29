/**
 * Domain Models for LLM Scheduler
 * Core domain entities and value objects
 */

import { z } from "zod";

// Request Priority Enum
export enum RequestPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
}

// Request Status Enum
export enum RequestStatus {
  PENDING = "pending",
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

// LLM Provider Schema
export const LLMProviderSchema = z.object({
  name: z.enum(["ollama", "openai"]),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
});

export type LLMProvider = z.infer<typeof LLMProviderSchema>;

// LLM Request Schema (REQ-SCHED-001: All requests must be queued)
export const LLMRequestSchema = z.object({
  id: z.string().uuid(),
  prompt: z.string().min(1),
  provider: LLMProviderSchema,
  priority: z.nativeEnum(RequestPriority).default(RequestPriority.NORMAL),
  status: z.nativeEnum(RequestStatus).default(RequestStatus.PENDING),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LLMRequest = z.infer<typeof LLMRequestSchema>;

// LLM Response Schema (REQ-SCHED-103: Complete and save result)
export const LLMResponseSchema = z.object({
  requestId: z.string().uuid(),
  content: z.string(),
  tokensUsed: z.number().optional(),
  processingTime: z.number(), // milliseconds (REQ-SCHED-002: Record processing time)
  completedAt: z.date(),
  error: z.string().optional(),
});

export type LLMResponse = z.infer<typeof LLMResponseSchema>;

// Queue Job Data Schema (Extended with WFQ support)
export const QueueJobSchema = z.object({
  requestId: z.string().uuid(),
  prompt: z.string(),
  provider: LLMProviderSchema,
  priority: z.nativeEnum(RequestPriority),
  attempts: z.number().default(0),
  queuedAt: z.date().optional(), // Timestamp when job was queued (for aging)
  tenantId: z.string().optional().default("default"), // Tenant ID for WFQ
  weight: z.number().optional().default(10), // Tenant weight for WFQ
});

export type QueueJob = z.infer<typeof QueueJobSchema>;

// Scheduler Metrics Schema
export const SchedulerMetricsSchema = z.object({
  totalRequests: z.number(),
  completedRequests: z.number(),
  failedRequests: z.number(),
  averageProcessingTime: z.number(),
  averageWaitTime: z.number(),
  queueLength: z.number(),
});

export type SchedulerMetrics = z.infer<typeof SchedulerMetricsSchema>;
