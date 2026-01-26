/**
 * State Repository
 * Handles state queries and caching
 */

import { CheckpointStore } from './CheckpointStore.js';
import { Checkpoint, AgentState, CheckpointType, StateDiff } from '../domain/models.js';

export interface StateQueryOptions {
  includeDeleted?: boolean;
  maxAge?: number; // milliseconds
}

/**
 * StateRepository Class
 * Provides state retrieval operations
 */
export class StateRepository {
  private cache: Map<string, { state: AgentState; timestamp: number }>;
  private cacheTimeout: number;
  private store: CheckpointStore;

  constructor(store: CheckpointStore, cacheTimeout: number = 60000) { // 1 minute default
    this.store = store;
    this.cacheTimeout = cacheTimeout;
    this.cache = new Map();
  }

  /**
   * Get latest state for agent
   */
  async getLatestState(agentId: string): Promise<AgentState | null> {
    // Check cache first
    const cached = this.getFromCache(agentId);
    if (cached) {
      return cached;
    }

    // Fetch from store
    const checkpoint = await this.store.findLatestByAgentId(agentId);
    if (!checkpoint) {
      return null;
    }

    // Handle incremental checkpoints
    const state = await this.resolveState(checkpoint);
    this.putInCache(agentId, state);

    return state;
  }

  /**
   * Get state at specific checkpoint
   */
  async getStateAtCheckpoint(
    agentId: string,
    checkpointId: string
  ): Promise<AgentState | null> {
    const checkpoint = await this.store.findById(checkpointId);
    if (!checkpoint || checkpoint.agentId !== agentId) {
      return null;
    }

    return await this.resolveState(checkpoint);
  }

  /**
   * Get state history (list of states from checkpoints)
   */
  async getStateHistory(
    agentId: string,
    limit: number = 10
  ): Promise<Array<{ checkpointId: string; timestamp: Date; state: AgentState }>> {
    const checkpoints = await this.store.findByAgentId(agentId, limit);
    const result = [];

    for (const checkpoint of checkpoints) {
      const state = await this.resolveState(checkpoint);
      result.push({
        checkpointId: checkpoint.checkpointId,
        timestamp: checkpoint.timestamp,
        state,
      });
    }

    return result;
  }

  /**
   * Resolve state from checkpoint (handles incremental checkpoints)
   */
  private async resolveState(checkpoint: Checkpoint): Promise<AgentState> {
    // If it's a full checkpoint, return state directly
    if (checkpoint.type === CheckpointType.FULL || !checkpoint.baseCheckpointId) {
      return checkpoint.state;
    }

    // For incremental checkpoints, resolve base state first
    const baseCheckpoint = await this.store.findById(checkpoint.baseCheckpointId);
    if (!baseCheckpoint) {
      // Base checkpoint not found, return current state as-is
      return checkpoint.state;
    }

    const baseState = await this.resolveState(baseCheckpoint);

    // Apply diff
    return this.applyDiffToState(baseState, checkpoint.diff!);
  }

  /**
   * Apply diff to state (simplified version - StateSerializer has full implementation)
   */
  private applyDiffToState(
    baseState: AgentState,
    diff: StateDiff
  ): AgentState {
    const newState: AgentState = JSON.parse(JSON.stringify(baseState));

    if (diff?.added) {
      Object.assign(newState.variables, diff.added);
    }

    if (diff?.modified) {
      Object.assign(newState.variables, diff.modified);
      if ('messages' in diff.modified) {
        newState.messages = diff.modified.messages;
      }
      if ('executionPosition' in diff.modified) {
        newState.executionPosition = diff.modified.executionPosition;
      }
      if ('status' in diff.modified) {
        newState.status = diff.modified.status;
      }
    }

    if (diff?.deleted) {
      for (const path of diff.deleted) {
        if (path.startsWith('variables.')) {
          const key = path.substring('variables.'.length);
          delete newState.variables[key];
        }
      }
    }

    return newState;
  }

  /**
   * Check if agent has any checkpoints
   */
  async hasState(agentId: string): Promise<boolean> {
    const count = await this.store.countByAgentId(agentId);
    return count > 0;
  }

  /**
   * Get checkpoint count for agent
   */
  async getCheckpointCount(agentId: string): Promise<number> {
    return await this.store.countByAgentId(agentId);
  }

  /**
   * Cache management
   */
  private getFromCache(agentId: string): AgentState | null {
    const entry = this.cache.get(agentId);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.cacheTimeout) {
      this.cache.delete(agentId);
      return null;
    }

    return entry.state;
  }

  private putInCache(agentId: string, state: AgentState): void {
    this.cache.set(agentId, {
      state,
      timestamp: Date.now(),
    });
  }

  public clearCache(agentId?: string): void {
    if (agentId) {
      this.cache.delete(agentId);
    } else {
      this.cache.clear();
    }
  }
}
