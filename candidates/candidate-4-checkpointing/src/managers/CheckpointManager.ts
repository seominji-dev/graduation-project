/**
 * Checkpoint Manager
 * Manages checkpoint creation and lifecycle (REQ-CHECK-010 through REQ-CHECK-017)
 */

import { v4 as uuidv4 } from 'uuid';
import { CheckpointStore } from '../storage/CheckpointStore.js';
import { StateSerializer } from '../serialization/StateSerializer.js';
import {
  Checkpoint,
  CheckpointType,
  CheckpointStatus,
  AgentState,
  CheckpointCreationOptions,
  CheckpointMetadata,
  StateDiff,
} from '../domain/models.js';
import { logger } from '../utils/logger.js';

const log = logger.child('CheckpointManager');

export interface CheckpointCreationResult {
  success: boolean;
  checkpoint?: Checkpoint;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

/**
 * CheckpointManager Class
 * Core checkpoint creation logic
 */
export class CheckpointManager {
  private store: CheckpointStore;
  private serializer: StateSerializer;
  private maxCheckpointsPerAgent: number;

  constructor(
    store: CheckpointStore,
    serializer: StateSerializer,
    maxCheckpointsPerAgent: number = 10
  ) {
    this.store = store;
    this.serializer = serializer;
    this.maxCheckpointsPerAgent = maxCheckpointsPerAgent;
  }

  /**
   * Create checkpoint (REQ-CHECK-010 through REQ-CHECK-014)
   */
  async createCheckpoint(
    agentId: string,
    state: AgentState,
    options: CheckpointCreationOptions = {}
  ): Promise<CheckpointCreationResult> {
    try {
      // Check if state has changed (REQ-CHECK-015)
      const latestCheckpoint = await this.store.findLatestByAgentId(agentId);
      if (latestCheckpoint && !this.hasStateChanged(latestCheckpoint.state, state)) {
        return {
          success: true,
          skipped: true,
          reason: 'No state changes since last checkpoint',
        };
      }

      // Determine checkpoint type
      const checkpointType = await this.determineCheckpointType(
        agentId,
        state,
        latestCheckpoint,
        options.type
      );

      // Serialize state
      const serializationResult = this.serializer.serialize(state);
      if (!serializationResult.success) {
        return {
          success: false,
          error: serializationResult.error || 'Serialization failed',
        };
      }

      // Log warnings from serialization
      for (const warning of serializationResult.warnings) {
        log.warn(warning);
      }

      // Calculate diff for incremental checkpoints (REQ-CHECK-017, REQ-CHECK-019)
      let diff: StateDiff | undefined;
      let baseCheckpointId: string | undefined;

      if (checkpointType === CheckpointType.INCREMENTAL && latestCheckpoint) {
        diff = this.serializer.calculateDiff(latestCheckpoint.state, state);
        baseCheckpointId = latestCheckpoint.checkpointId;

        // Check if diff is too large (REQ-CHECK-021)
        if (this.serializer.shouldUseFullCheckpoint(state, diff)) {
          // Fall back to full checkpoint
          diff = undefined;
          baseCheckpointId = undefined;
        }
      }

      // Create metadata
      const metadata: CheckpointMetadata = {
        description: options.description,
        tags: options.tags || [],
        checkpointReason: options.reason || 'manual',
      };

      // Get sequence number
      const sequenceNumber = await this.store.getNextSequenceNumber(agentId);

      // Calculate expiration
      const expiresAt = options.ttl 
        ? new Date(Date.now() + options.ttl * 1000)
        : undefined;

      // Create checkpoint object (REQ-CHECK-001 through REQ-CHECK-003)
      const checkpoint: Checkpoint = {
        agentId,
        checkpointId: uuidv4(),
        timestamp: new Date(),
        state,
        metadata,
        size: serializationResult.size,
        type: checkpointType,
        baseCheckpointId,
        diff,
        isValid: true,
        status: CheckpointStatus.VALID,
        sequenceNumber,
        createdAt: new Date(),
        expiresAt,
      };

      // Save to store
      const saveResult = await this.store.save(checkpoint);
      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error || 'Failed to save checkpoint',
        };
      }

      // Clean up old checkpoints if needed (REQ-CHECK-016)
      await this.cleanupOldCheckpoints(agentId);

      return {
        success: true,
        checkpoint,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get latest checkpoint for agent
   */
  async getLatestCheckpoint(agentId: string): Promise<Checkpoint | null> {
    return await this.store.findLatestByAgentId(agentId);
  }

  /**
   * Get all checkpoints for agent
   */
  async getCheckpoints(agentId: string, limit?: number): Promise<Checkpoint[]> {
    return await this.store.findByAgentId(agentId, limit);
  }

  /**
   * Delete checkpoint
   */
  async deleteCheckpoint(checkpointId: string): Promise<boolean> {
    return await this.store.deleteById(checkpointId);
  }

  /**
   * Delete all checkpoints for agent
   */
  async deleteAgentCheckpoints(agentId: string): Promise<number> {
    return await this.store.deleteByAgentId(agentId);
  }

  /**
   * Get checkpoint statistics
   */
  async getStats(agentId: string): Promise<{
    totalCount: number;
    fullCount: number;
    incrementalCount: number;
    totalSize: number;
    latestTimestamp?: Date;
  }> {
    const checkpoints = await this.store.findByAgentId(agentId);
    
    return {
      totalCount: checkpoints.length,
      fullCount: checkpoints.filter(cp => cp.type === CheckpointType.FULL).length,
      incrementalCount: checkpoints.filter(cp => cp.type === CheckpointType.INCREMENTAL).length,
      totalSize: checkpoints.reduce((sum, cp) => sum + cp.size, 0),
      latestTimestamp: checkpoints[0]?.timestamp,
    };
  }

  /**
   * Determine if should use incremental checkpoint
   */
  private async determineCheckpointType(
    agentId: string,
    state: AgentState,
    latestCheckpoint: Checkpoint | null,
    requestedType: CheckpointType | undefined
  ): Promise<CheckpointType> {
    const effectiveType = requestedType ?? CheckpointType.FULL;

    // If explicitly requested, use that type
    if (effectiveType !== CheckpointType.FULL) {
      // Only use incremental if we have a base
      if (latestCheckpoint && latestCheckpoint.type === CheckpointType.FULL) {
        return CheckpointType.INCREMENTAL;
      }
    }

    // Default to full for first checkpoint
    if (!latestCheckpoint) {
      return CheckpointType.FULL;
    }

    // Check if base for incremental still exists
    if (latestCheckpoint.type === CheckpointType.INCREMENTAL) {
      // Find latest full checkpoint
      const fullCheckpoints = await this.store.findByType(agentId, CheckpointType.FULL);
      if (fullCheckpoints.length === 0) {
        return CheckpointType.FULL;
      }
    }

    return effectiveType;
  }

  /**
   * Check if state has changed (REQ-CHECK-015)
   */
  private hasStateChanged(previousState: AgentState, currentState: AgentState): boolean {
    // Simple comparison - check key properties
    if (previousState.status !== currentState.status) return true;
    if (previousState.messages.length !== currentState.messages.length) return true;
    
    const prevVarsJson = JSON.stringify(previousState.variables);
    const currVarsJson = JSON.stringify(currentState.variables);
    if (prevVarsJson !== currVarsJson) return true;

    return false;
  }

  /**
   * Clean up old checkpoints (REQ-CHECK-016)
   */
  private async cleanupOldCheckpoints(agentId: string): Promise<void> {
    await this.store.deleteOldest(agentId, this.maxCheckpointsPerAgent);
  }
}
