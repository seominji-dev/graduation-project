/**
 * Domain Models for Checkpointing System
 * Core domain entities and value objects
 */

import { z } from 'zod';

// Checkpoint Type Enum
export const CheckpointType = {
  FULL: 'full',
  INCREMENTAL: 'incremental',
} as const;

export type CheckpointType = (typeof CheckpointType)[keyof typeof CheckpointType];

// Checkpoint Status Enum
export const CheckpointStatus = {
  VALID: 'valid',
  CORRUPTED: 'corrupted',
  EXPIRED: 'expired',
} as const;

export type CheckpointStatus = (typeof CheckpointStatus)[keyof typeof CheckpointStatus];

// Agent Status Enum
export const AgentStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  CRASHED: 'crashed',
  RECOVERING: 'recovering',
} as const;

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

// Message Schema (for agent conversation history)
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

// Execution Position Schema
export const ExecutionPositionSchema = z.object({
  step: z.number(),
  functionName: z.string().optional(),
  line: z.number().optional(),
  context: z.string().optional(),
});

export type ExecutionPosition = z.infer<typeof ExecutionPositionSchema>;

// Agent State Schema (REQ-CHECK-001: JSON serialization)
export const AgentStateSchema = z.object({
  messages: z.array(MessageSchema),
  variables: z.record(z.any()),
  executionPosition: ExecutionPositionSchema.optional(),
  context: z.record(z.any()).optional(),
  status: z.enum(['idle', 'running', 'paused', 'crashed', 'recovering']).default('idle'),
  lastActivity: z.date().optional(),
});

export type AgentState = z.infer<typeof AgentStateSchema>;

// State Diff Schema (for incremental checkpoints)
export const StateDiffSchema = z.object({
  added: z.record(z.any()).default({}),
  modified: z.record(z.any()).default({}),
  deleted: z.array(z.string()).default([]),
});

export type StateDiff = z.infer<typeof StateDiffSchema>;

// Checkpoint Metadata Schema
export const CheckpointMetadataSchema = z.object({
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  agentVersion: z.string().optional(),
  checkpointReason: z.enum(['periodic', 'manual', 'milestone', 'shutdown']).default('periodic'),
});

export type CheckpointMetadata = z.infer<typeof CheckpointMetadataSchema>;

// Checkpoint Schema (Core domain entity)
export const CheckpointSchema = z.object({
  _id: z.string().optional(), // MongoDB ObjectId
  agentId: z.string().uuid(),
  checkpointId: z.string().uuid(),
  timestamp: z.date(),
  state: AgentStateSchema,
  metadata: CheckpointMetadataSchema,
  size: z.number().nonnegative(), // bytes
  type: z.enum(['full', 'incremental']),
  baseCheckpointId: z.string().uuid().optional(),
  diff: StateDiffSchema.optional(),
  isValid: z.boolean().default(true),
  status: z.enum(['valid', 'corrupted', 'expired']).default('valid'),
  sequenceNumber: z.number().nonnegative(),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;

// Agent Schema
export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  state: AgentStateSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  lastCheckpointId: z.string().uuid().optional(),
});

export type Agent = z.infer<typeof AgentSchema>;

// Recovery Result Schema
export const RecoveryResultSchema = z.object({
  success: z.boolean(),
  agentId: z.string().uuid(),
  checkpointId: z.string().uuid(),
  timestamp: z.date(),
  error: z.string().optional(),
  restoredState: AgentStateSchema.optional(),
  recoveryTime: z.number().nonnegative(), // milliseconds
});

export type RecoveryResult = z.infer<typeof RecoveryResultSchema>;

// Checkpoint Creation Options - make all fields optional
export interface CheckpointCreationOptions {
  type?: CheckpointType;
  description?: string;
  tags?: string[];
  reason?: 'periodic' | 'manual' | 'milestone' | 'shutdown';
  ttl?: number; // time to live in seconds
}
