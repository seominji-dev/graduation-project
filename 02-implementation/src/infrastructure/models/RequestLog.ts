/**
 * MongoDB Schema for Request Logging
 * Stores all LLM requests and responses for analytics
 */

import mongoose, { Schema, Document } from "mongoose";
import { RequestPriority, RequestStatus } from "../../domain/models";

// Request Log Interface
export interface IRequestLog extends Document {
  requestId: string;
  prompt: string;
  provider: string;
  modelName: string;
  priority: RequestPriority;
  status: RequestStatus;
  response?: string;
  tokensUsed?: number;
  processingTime: number; // milliseconds (REQ-SCHED-002)
  waitTime: number; // milliseconds (time queued to time started)
  completedAt?: Date;
  error?: string;
  // MLFQ-specific fields
  queueLevel?: number; // Current queue level (0-3)
  queueHistory?: number[]; // History of queue levels visited
  timeSliceUsed?: number; // Time slice used in current quantum (ms)
  // WFQ-specific fields
  tenantId?: string; // Tenant ID for multi-tenant scheduling
  weight?: number; // Tenant weight for WFQ
  virtualTime?: number; // Virtual finish time for WFQ
  createdAt: Date;
  updatedAt: Date;
}

// Request Log Schema
const RequestLogSchema = new Schema<IRequestLog>(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    modelName: {
      type: String,
      required: true,
    },
    priority: {
      type: Number,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      index: true,
    },
    response: {
      type: String,
    },
    tokensUsed: {
      type: Number,
    },
    processingTime: {
      type: Number,
      required: true,
    },
    waitTime: {
      type: Number,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
    // MLFQ-specific fields
    queueLevel: {
      type: Number,
      default: 0,
    },
    queueHistory: {
      type: [Number],
      default: [],
    },
    timeSliceUsed: {
      type: Number,
      default: 0,
    },
    // WFQ-specific fields
    tenantId: {
      type: String,
      default: "default",
      index: true,
    },
    weight: {
      type: Number,
      default: 10,
    },
    virtualTime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "request_logs",
  },
);

// Indexes for efficient queries
RequestLogSchema.index({ createdAt: -1 });
RequestLogSchema.index({ status: 1, createdAt: -1 });
RequestLogSchema.index({ priority: 1, status: 1 });
RequestLogSchema.index({ queueLevel: 1, status: 1 }); // MLFQ index
RequestLogSchema.index({ tenantId: 1, status: 1 }); // WFQ index
RequestLogSchema.index({ virtualTime: 1, status: 1 }); // WFQ virtual time index

// Export model
export const RequestLog = mongoose.model<IRequestLog>(
  "RequestLog",
  RequestLogSchema,
);
