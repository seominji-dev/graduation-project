/**
 * Rollback Executor
 * Executes the actual rollback logic (similar pattern to Deadlock Detector)
 */

import { CheckpointStore } from '../storage/CheckpointStore.js';
import { StateSerializer } from '../serialization/StateSerializer.js';
import { Checkpoint, CheckpointType, AgentState } from '../domain/models.js';

export interface RollbackResult {
  success: boolean;
  state: AgentState;
  checkpointId: string;
  resolvedFromIncremental: boolean;
  error?: string;
}

/**
 * RollbackExecutor Class
 * Executes the rollback to a specific checkpoint
 */
export class RollbackExecutor {
  private store: CheckpointStore;
  private serializer: StateSerializer;

  constructor(store: CheckpointStore, serializer?: StateSerializer) {
    this.store = store;
    this.serializer = serializer || new StateSerializer();
  }

  /**
   * Rollback agent to checkpoint state
   */
  async rollback(checkpoint: Checkpoint): Promise<AgentState> {
    // For full checkpoints, return state directly
    if (checkpoint.type === CheckpointType.FULL || !checkpoint.baseCheckpointId) {
      return this.cloneState(checkpoint.state);
    }

    // For incremental checkpoints, resolve full state
    return await this.resolveIncrementalCheckpoint(checkpoint);
  }

  /**
   * Rollback with detailed result
   */
  async rollbackWithResult(checkpoint: Checkpoint): Promise<RollbackResult> {
    try {
      const state = await this.rollback(checkpoint);

      return {
        success: true,
        state,
        checkpointId: checkpoint.checkpointId,
        resolvedFromIncremental: checkpoint.type === CheckpointType.INCREMENTAL,
      };
    } catch (error) {
      return {
        success: false,
        state: this.getInitialState(),
        checkpointId: checkpoint.checkpointId,
        resolvedFromIncremental: false,
        error: error instanceof Error ? error.message : 'Rollback failed',
      };
    }
  }

  /**
   * Resolve incremental checkpoint to full state
   */
  private async resolveIncrementalCheckpoint(
    checkpoint: Checkpoint
  ): Promise<AgentState> {
    if (!checkpoint.baseCheckpointId) {
      throw new Error('Incremental checkpoint missing base checkpoint ID');
    }

    // Find base checkpoint
    const baseCheckpoint = await this.store.findById(checkpoint.baseCheckpointId);
    if (!baseCheckpoint) {
      throw new Error(`Base checkpoint ${checkpoint.baseCheckpointId} not found`);
    }

    // Recursively resolve base if it's also incremental
    const baseState = baseCheckpoint.type === CheckpointType.INCREMENTAL
      ? await this.resolveIncrementalCheckpoint(baseCheckpoint)
      : this.cloneState(baseCheckpoint.state);

    // Apply diff
    if (checkpoint.diff) {
      return this.serializer.applyDiff(baseState, checkpoint.diff);
    }

    // If no diff, return base state
    return baseState;
  }

  /**
   * Clone state (deep copy)
   */
  private cloneState(state: AgentState): AgentState {
    return this.serializer.cloneState(state);
  }

  /**
   * Get initial empty state (for rollback failures)
   */
  private getInitialState(): AgentState {
    return {
      messages: [],
      variables: {},
      status: 'idle',
      lastActivity: new Date(),
    };
  }

  /**
   * Verify checkpoint can be rolled back
   */
  async canRollback(checkpoint: Checkpoint): Promise<{
    canRollback: boolean;
    reason?: string;
  }> {
    // Check validity
    if (!checkpoint.isValid) {
      return { canRollback: false, reason: 'Checkpoint is marked as invalid' };
    }

    // For incremental checkpoints, verify base exists
    if (checkpoint.type === CheckpointType.INCREMENTAL) {
      if (!checkpoint.baseCheckpointId) {
        return { canRollback: false, reason: 'Incremental checkpoint missing base ID' };
      }

      const baseExists = await this.store.findById(checkpoint.baseCheckpointId);
      if (!baseExists) {
        return { canRollback: false, reason: 'Base checkpoint not found' };
      }
    }

    return { canRollback: true };
  }

  /**
   * Preview what state would be after rollback
   */
  async previewRollback(checkpoint: Checkpoint): Promise<AgentState | null> {
    try {
      return await this.rollback(checkpoint);
    } catch {
      return null;
    }
  }
}
