/**
 * Mongoose Schema for Checkpoint
 */

import mongoose, { Schema, Model, Document } from 'mongoose';
import {
  Checkpoint,
  CheckpointType,
  CheckpointStatus,
  AgentState,
  CheckpointMetadata,
  StateDiff,
} from '../domain/models.js';

interface CheckpointDocument extends Document, Omit<Checkpoint, '_id'> {}

const MessageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, required: true },
}, { _id: false });

const ExecutionPositionSchema = new Schema({
  step: { type: Number },
  functionName: { type: String },
  line: { type: Number },
  context: { type: String },
}, { _id: false });

const AgentStateSchema = new Schema({
  messages: { type: [MessageSchema], default: [] },
  variables: { type: Schema.Types.Mixed, default: {} },
  executionPosition: { type: ExecutionPositionSchema },
  context: { type: Schema.Types.Mixed, default: {} },
  status: { 
    type: String, 
    enum: ['idle', 'running', 'paused', 'crashed', 'recovering'],
    default: 'idle'
  },
  lastActivity: { type: Date },
}, { _id: false });

const StateDiffSchema = new Schema({
  added: { type: Schema.Types.Mixed, default: {} },
  modified: { type: Schema.Types.Mixed, default: {} },
  deleted: { type: [String], default: [] },
}, { _id: false });

const CheckpointMetadataSchema = new Schema({
  description: { type: String },
  tags: { type: [String], default: [] },
  agentVersion: { type: String },
  checkpointReason: { 
    type: String, 
    enum: ['periodic', 'manual', 'milestone', 'shutdown'],
    default: 'periodic'
  },
}, { _id: false });

const CheckpointSchema = new Schema<CheckpointDocument>({
  agentId: { type: String, required: true, index: true },
  checkpointId: { type: String, required: true, unique: true },
  timestamp: { type: Date, required: true, index: true },
  state: { type: AgentStateSchema, required: true },
  metadata: { type: CheckpointMetadataSchema, default: () => ({}) },
  size: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['full', 'incremental'],
    required: true 
  },
  baseCheckpointId: { type: String },
  diff: { type: StateDiffSchema },
  isValid: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['valid', 'corrupted', 'expired'],
    required: true,
    default: 'valid'
  },
  sequenceNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, required: true },
  expiresAt: { type: Date },
}, {
  timestamps: true,
});

// Compound indexes for common queries
CheckpointSchema.index({ agentId: 1, sequenceNumber: -1 });
CheckpointSchema.index({ agentId: 1, createdAt: -1 });
CheckpointSchema.index({ agentId: 1, type: 1 });

export const CheckpointModel: Model<CheckpointDocument> = 
  mongoose.model<CheckpointDocument>('Checkpoint', CheckpointSchema);
