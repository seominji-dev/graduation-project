/**
 * MongoDB connection and models for Deadlock Detector
 */

import mongoose, { Schema, Model } from 'mongoose';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Agent document schema
 */
const AgentSchema = new Schema(
  {
    name: { type: String, required: true },
    state: {
      type: String,
      enum: ['active', 'waiting', 'blocked', 'terminated'],
      default: 'active',
    },
    heldResources: [{ type: String }],
    waitingFor: { type: String, default: null },
    priority: { type: Number, default: 5 },
  },
  {
    timestamps: true,
  },
);

/**
 * Resource document schema
 */
const ResourceSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['computational', 'storage', 'network', 'memory', 'custom'],
      default: 'custom',
    },
    heldBy: { type: String, default: null },
    waitQueue: [{ type: String }],
    totalInstances: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  },
);

/**
 * Deadlock event document schema
 */
const DeadlockEventSchema = new Schema(
  {
    cycleAgentIds: [{ type: String }],
    detectionTime: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
    resolutionAction: {
      type: String,
      enum: ['terminate', 'rollback', 'preempt'],
      default: null,
    },
    resolutionTime: { type: Date, default: null },
    victimAgentId: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

/**
 * Recovery action document schema
 */
const RecoveryActionSchema = new Schema(
  {
    agentId: { type: String, required: true },
    actionType: {
      type: String,
      enum: ['terminate', 'rollback', 'preempt'],
      required: true,
    },
    resourcesReleased: [{ type: String }],
    result: {
      type: String,
      enum: ['success', 'failed', 'skipped'],
      default: 'success',
    },
    timestamp: { type: Date, default: Date.now },
    reason: { type: String },
  },
  {
    timestamps: true,
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AgentModel: Model<any> = mongoose.model('Agent', AgentSchema);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ResourceModel: Model<any> = mongoose.model('Resource', ResourceSchema);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DeadlockEventModel: Model<any> = mongoose.model('DeadlockEvent', DeadlockEventSchema);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RecoveryActionModel: Model<any> = mongoose.model('RecoveryAction', RecoveryActionSchema);

/**
 * Connect to MongoDB
 */
export async function connectToMongoDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB', { uri: config.mongodb.uri });
  } catch (error) {
    logger.error('MongoDB connection error', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectFromMongoDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('MongoDB disconnection error', error);
    throw error;
  }
}
