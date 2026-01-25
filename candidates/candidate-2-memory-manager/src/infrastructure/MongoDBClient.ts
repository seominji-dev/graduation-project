/**
 * MongoDB Client for L3 Long-term Storage
 * Stores cold data and archived contexts
 * REQ-MEM-011: Persistent storage for evicted pages
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { MemoryPage, MemoryLevel, PageStatus } from '../domain/models';
import logger from '../utils/logger';

// MemoryPage Document Interface
export interface IMemoryPageDocument extends Document {
  id: string;
  agentId: string;
  key: string;
  value: string;
  embedding?: number[];
  level: MemoryLevel;
  status: PageStatus;
  accessCount: number;
  lastAccessedAt: Date;
  createdAt: Date;
  size: number;
  metadata?: Record<string, unknown>;
}

// Aggregation result interface
interface SizeAggregationResult {
  _id: null;
  totalSize: number;
}

// MemoryPage Schema
const MemoryPageSchema = new Schema<IMemoryPageDocument>({
  id: { type: String, required: true, unique: true },
  agentId: { type: String, required: true, index: true },
  key: { type: String, required: true },
  value: { type: String, required: true },
  embedding: { type: [Number] },
  level: {
    type: String,
    enum: Object.values(MemoryLevel),
    default: MemoryLevel.L3_DISK,
  },
  status: {
    type: String,
    enum: Object.values(PageStatus),
    default: PageStatus.IDLE,
  },
  accessCount: { type: Number, default: 0 },
  lastAccessedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, index: true },
  size: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed },
});

// Compound index for efficient queries
MemoryPageSchema.index({ agentId: 1, key: 1 }, { unique: true });
MemoryPageSchema.index({ agentId: 1, lastAccessedAt: -1 });

export interface MongoDBConfig {
  uri?: string;
  dbName?: string;
  collectionName?: string;
}

/**
 * MongoDB client wrapper for L3 storage operations
 */
export class MongoDBPageStore {
  private uri: string;
  private dbName: string;
  private collectionName: string;
  private MemoryPageModel: Model<IMemoryPageDocument>;
  private initialized: boolean = false;

  constructor(config: MongoDBConfig = {}) {
    this.uri = config.uri || 'mongodb://localhost:27017';
    this.dbName = config.dbName || 'memory_manager';
    this.collectionName = config.collectionName || 'archived_contexts';
    this.MemoryPageModel = mongoose.model<IMemoryPageDocument>(
      this.collectionName,
      MemoryPageSchema,
    );
  }

  /**
   * Initialize MongoDB connection
   */
  async initialize(): Promise<void> {
    try {
      await mongoose.connect(this.uri);
      this.initialized = true;
      logger.info(`MongoDB initialized: ${this.dbName}.${this.collectionName}`);
    } catch (error) {
      logger.error('Failed to initialize MongoDB:', error);
      throw error;
    }
  }

  /**
   * Store memory page in MongoDB
   */
  async storePage(page: MemoryPage): Promise<void> {
    if (!this.initialized) {
      throw new Error('MongoDB not initialized');
    }

    try {
      const doc = new this.MemoryPageModel({
        id: page.id,
        agentId: page.agentId,
        key: page.key,
        value: page.value,
        embedding: page.embedding,
        level: MemoryLevel.L3_DISK,
        status: page.status,
        accessCount: page.accessCount,
        lastAccessedAt: page.lastAccessedAt,
        createdAt: page.createdAt,
        size: page.size,
        metadata: page.metadata,
      });

      await doc.save();
    } catch (error) {
      logger.error('Failed to store page in MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get page by agentId and key
   */
  async getPage(agentId: string, key: string): Promise<MemoryPage | null> {
    if (!this.initialized) {
      throw new Error('MongoDB not initialized');
    }

    try {
      const doc = await this.MemoryPageModel.findOne({ agentId, key });
      return doc ? this.toMemoryPage(doc) : null;
    } catch (error) {
      logger.error('Failed to get page from MongoDB:', error);
      return null;
    }
  }

  /**
   * Update page in MongoDB
   */
  async updatePage(page: MemoryPage): Promise<void> {
    if (!this.initialized) {
      throw new Error('MongoDB not initialized');
    }

    try {
      await this.MemoryPageModel.updateOne(
        { agentId: page.agentId, key: page.key },
        {
          $set: {
            value: page.value,
            embedding: page.embedding,
            status: page.status,
            accessCount: page.accessCount,
            lastAccessedAt: page.lastAccessedAt,
            size: page.size,
            metadata: page.metadata,
          },
        },
      );
    } catch (error) {
      logger.error('Failed to update page in MongoDB:', error);
      throw error;
    }
  }

  /**
   * Delete page from MongoDB
   */
  async deletePage(agentId: string, key: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('MongoDB not initialized');
    }

    try {
      const result = await this.MemoryPageModel.deleteOne({ agentId, key });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Failed to delete page from MongoDB:', error);
      return false;
    }
  }

  /**
   * Get all pages for an agent
   */
  async getPagesByAgent(agentId: string): Promise<MemoryPage[]> {
    if (!this.initialized) {
      throw new Error('MongoDB not initialized');
    }

    try {
      const docs = await this.MemoryPageModel.find({ agentId }).sort({ lastAccessedAt: -1 }).exec();

      return docs.map(doc => this.toMemoryPage(doc));
    } catch (error) {
      logger.error('Failed to get pages from MongoDB:', error);
      return [];
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{
    count: number;
    totalSize: number;
  }> {
    if (!this.initialized) {
      throw new Error('MongoDB not initialized');
    }

    try {
      const count = await this.MemoryPageModel.countDocuments();
      const stats = await this.MemoryPageModel.aggregate<SizeAggregationResult>([
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$size' },
          },
        },
      ]).exec();

      return {
        count,
        totalSize: stats[0]?.totalSize ?? 0,
      };
    } catch (error) {
      logger.error('Failed to get MongoDB stats:', error);
      return { count: 0, totalSize: 0 };
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await this.MemoryPageModel.deleteMany({});
    } catch (error) {
      logger.error('Failed to clear MongoDB:', error);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    this.initialized = false;
  }

  /**
   * Convert MongoDB document to MemoryPage
   */
  private toMemoryPage(doc: IMemoryPageDocument): MemoryPage {
    return {
      id: doc.id,
      agentId: doc.agentId,
      key: doc.key,
      value: doc.value,
      embedding: doc.embedding,
      level: doc.level as MemoryLevel,
      status: doc.status as PageStatus,
      accessCount: doc.accessCount,
      lastAccessedAt: doc.lastAccessedAt,
      createdAt: doc.createdAt,
      size: doc.size,
      metadata: doc.metadata,
    };
  }
}
