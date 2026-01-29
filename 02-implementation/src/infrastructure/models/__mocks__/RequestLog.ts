/**
 * Mock RequestLog Model for Unit Tests
 */

import { IRequestLog } from "../RequestLog";

// Mock RequestLog model
class MockRequestLog {
  requestId: string;
  prompt: string;
  provider: string;
  modelName: string;
  priority: number;
  status: string;
  response?: string;
  tokensUsed?: number;
  processingTime: number;
  waitTime: number;
  completedAt?: Date;
  error?: string;
  queueLevel?: number;
  queueHistory?: number[];
  timeSliceUsed?: number;
  tenantId?: string;
  weight?: number;
  virtualTime?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<IRequestLog> = {}) {
    this.requestId = data.requestId || "test-request-id";
    this.prompt = data.prompt || "Test prompt";
    this.provider = data.provider || "ollama";
    this.modelName = data.modelName || "llama2";
    this.priority = data.priority || 1;
    this.status = data.status || "pending";
    this.processingTime = data.processingTime || 0;
    this.waitTime = data.waitTime || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save(): Promise<this> {
    return this;
  }

  static async create(data: Partial<IRequestLog>): Promise<MockRequestLog> {
    return new MockRequestLog(data);
  }

  static async findOne(): Promise<null> {
    return null;
  }

  static async findById(): Promise<null> {
    return null;
  }

  static async findByIdAndUpdate(): Promise<null> {
    return null;
  }

  static async updateOne(): Promise<{ modifiedCount: number }> {
    return { modifiedCount: 1 };
  }

  static async deleteOne(): Promise<{ deletedCount: number }> {
    return { deletedCount: 1 };
  }

  static async find(): Promise<{ exec: () => Promise<[]> }> {
    return { exec: async () => [] };
  }

  static async countDocuments(): Promise<number> {
    return 0;
  }
}

export const RequestLog = MockRequestLog as unknown as typeof MockRequestLog & {
  create: (data: Partial<IRequestLog>) => Promise<MockRequestLog>;
  findOne: () => Promise<null>;
  findById: () => Promise<null>;
  findByIdAndUpdate: () => Promise<null>;
  updateOne: () => Promise<{ modifiedCount: number }>;
  deleteOne: () => Promise<{ deletedCount: number }>;
  find: () => Promise<{ exec: () => Promise<[]> }>;
  countDocuments: () => Promise<number>;
};

export type { IRequestLog };
