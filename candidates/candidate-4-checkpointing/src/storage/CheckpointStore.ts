/**
 * Checkpoint Store
 * Handles persistence of checkpoints to MongoDB
 */

import { CheckpointModel } from './CheckpointSchema.js';
import { Checkpoint, CheckpointType, CheckpointStatus } from '../domain/models.js';
import { logger } from '../utils/logger.js';

const log = logger.child('CheckpointStore');

export interface StoreResult {
  success: boolean;
  checkpointId?: string;
  error?: string;
}

/**
 * CheckpointStore Class
 * Handles checkpoint CRUD operations (REQ-CHECK-010, REQ-CHECK-011, REQ-CHECK-043)
 */
export class CheckpointStore {
  /**
   * Save checkpoint to database (with retry for REQ-CHECK-043)
   */
  async save(checkpoint: Checkpoint): Promise<StoreResult> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const doc = new CheckpointModel(checkpoint);
        await doc.save();
        return {
          success: true,
          checkpointId: checkpoint.checkpointId,
        };
      } catch (error) {
        lastError = error as Error;
        log.error(
          `Checkpoint save attempt ${attempt}/${maxRetries} failed:`,
          error
        );

        if (attempt < maxRetries) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 100);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error during checkpoint save',
    };
  }

  /**
   * Find checkpoint by ID
   */
  async findById(checkpointId: string): Promise<Checkpoint | null> {
    try {
      const doc = await CheckpointModel.findOne({ checkpointId });
      return doc ? this.documentToCheckpoint(doc) : null;
    } catch (error) {
      log.error('Error finding checkpoint by ID:', error);
      return null;
    }
  }

  /**
   * Find latest checkpoint for agent
   */
  async findLatestByAgentId(agentId: string): Promise<Checkpoint | null> {
    try {
      const doc = await CheckpointModel
        .findOne({ 
          agentId,
          status: CheckpointStatus.VALID,
        })
        .sort({ sequenceNumber: -1 })
        .exec();
      return doc ? this.documentToCheckpoint(doc) : null;
    } catch (error) {
      log.error('Error finding latest checkpoint:', error);
      return null;
    }
  }

  /**
   * Find all checkpoints for agent
   */
  async findByAgentId(
    agentId: string,
    limit: number = 10
  ): Promise<Checkpoint[]> {
    try {
      const docs = await CheckpointModel
        .find({ agentId })
        .sort({ sequenceNumber: -1 })
        .limit(limit)
        .exec();
      return docs.map(doc => this.documentToCheckpoint(doc));
    } catch (error) {
      log.error('Error finding checkpoints by agent:', error);
      return [];
    }
  }

  /**
   * Find checkpoints by type
   */
  async findByType(agentId: string, type: CheckpointType): Promise<Checkpoint[]> {
    try {
      const docs = await CheckpointModel
        .find({ agentId, type })
        .sort({ sequenceNumber: -1 })
        .exec();
      return docs.map(doc => this.documentToCheckpoint(doc));
    } catch (error) {
      log.error('Error finding checkpoints by type:', error);
      return [];
    }
  }

  /**
   * Count checkpoints for agent
   */
  async countByAgentId(agentId: string): Promise<number> {
    try {
      return await CheckpointModel.countDocuments({ agentId });
    } catch (error) {
      log.error('Error counting checkpoints:', error);
      return 0;
    }
  }

  /**
   * Delete oldest checkpoints for agent (REQ-CHECK-016)
   */
  async deleteOldest(agentId: string, keepCount: number): Promise<number> {
    try {
      const checkpoints = await CheckpointModel
        .find({ agentId })
        .sort({ sequenceNumber: 1 })
        .exec();

      const deleteCount = Math.max(0, checkpoints.length - keepCount);
      const toDelete = checkpoints.slice(0, deleteCount);

      for (const checkpoint of toDelete) {
        await CheckpointModel.deleteOne({ checkpointId: checkpoint.checkpointId });
      }

      return deleteCount;
    } catch (error) {
      log.error('Error deleting oldest checkpoints:', error);
      return 0;
    }
  }

  /**
   * Delete checkpoint by ID
   */
  async deleteById(checkpointId: string): Promise<boolean> {
    try {
      const result = await CheckpointModel.deleteOne({ checkpointId });
      return result.deletedCount > 0;
    } catch (error) {
      log.error('Error deleting checkpoint:', error);
      return false;
    }
  }

  /**
   * Delete all checkpoints for agent
   */
  async deleteByAgentId(agentId: string): Promise<number> {
    try {
      const result = await CheckpointModel.deleteMany({ agentId });
      return result.deletedCount;
    } catch (error) {
      log.error('Error deleting agent checkpoints:', error);
      return 0;
    }
  }

  /**
   * Mark checkpoint as corrupted (REQ-CHECK-029)
   */
  async markAsCorrupted(checkpointId: string): Promise<boolean> {
    try {
      const result = await CheckpointModel.updateOne(
        { checkpointId },
        { 
          isValid: false,
          status: CheckpointStatus.CORRUPTED,
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      log.error('Error marking checkpoint as corrupted:', error);
      return false;
    }
  }

  /**
   * Clean up expired checkpoints
   */
  async deleteExpired(): Promise<number> {
    try {
      const result = await CheckpointModel.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      return result.deletedCount;
    } catch (error) {
      log.error('Error deleting expired checkpoints:', error);
      return 0;
    }
  }

  /**
   * Get next sequence number for agent
   */
  async getNextSequenceNumber(agentId: string): Promise<number> {
    try {
      const latest = await CheckpointModel
        .findOne({ agentId })
        .sort({ sequenceNumber: -1 })
        .exec();
      return (latest?.sequenceNumber ?? -1) + 1;
    } catch (error) {
      log.error('Error getting next sequence number:', error);
      return 0;
    }
  }

  /**
   * Verify checkpoint integrity (REQ-CHECK-044)
   */
  async verifyIntegrity(checkpointId: string): Promise<boolean> {
    try {
      const checkpoint = await this.findById(checkpointId);
      if (!checkpoint) return false;

      // Basic integrity checks
      if (!checkpoint.checkpointId || !checkpoint.agentId) return false;
      if (!checkpoint.state || !checkpoint.timestamp) return false;
      if (checkpoint.size <= 0) return false;

      // JSON serialization check
      try {
        JSON.stringify(checkpoint.state);
      } catch {
        return false;
      }

      return true;
    } catch (error) {
      log.error('Error verifying checkpoint integrity:', error);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private documentToCheckpoint(doc: any): Checkpoint {
    return {
      _id: doc._id?.toString(),
      agentId: doc.agentId,
      checkpointId: doc.checkpointId,
      timestamp: doc.timestamp,
      state: doc.state,
      metadata: doc.metadata,
      size: doc.size,
      type: doc.type,
      baseCheckpointId: doc.baseCheckpointId,
      diff: doc.diff,
      isValid: doc.isValid,
      status: doc.status,
      sequenceNumber: doc.sequenceNumber,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
    };
  }
}
