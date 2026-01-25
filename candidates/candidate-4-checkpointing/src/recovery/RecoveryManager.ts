/**
 * Recovery Manager
 * Handles agent recovery from checkpoints (REQ-CHECK-024 through REQ-CHECK-032)
 */

import { CheckpointStore } from '../storage/CheckpointStore.js';
import { StateRepository } from '../storage/StateRepository.js';
import { RollbackExecutor } from './RollbackExecutor.js';
import { Checkpoint, AgentState, RecoveryResult, CheckpointStatus, AgentStatus } from '../domain/models.js';

export interface RecoveryOptions {
  checkpointId?: string;
  verifyIntegrity?: boolean;
  maxRetries?: number;
  fallbackToLatest?: boolean;
}

/**
 * RecoveryManager Class
 * Manages the recovery process from checkpoints
 */
export class RecoveryManager {
  private store: CheckpointStore;
  private stateRepository: StateRepository;
  private rollbackExecutor: RollbackExecutor;

  constructor(
    store: CheckpointStore,
    stateRepository: StateRepository,
    rollbackExecutor?: RollbackExecutor
  ) {
    this.store = store;
    this.stateRepository = stateRepository;
    this.rollbackExecutor = rollbackExecutor || new RollbackExecutor(store);
  }

  /**
   * Recover agent to specific checkpoint (REQ-CHECK-026)
   */
  async recover(
    agentId: string,
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    const maxRetries = options.maxRetries || 3;

    // Find checkpoint to restore from
    let checkpoint: Checkpoint | null = null;

    if (options.checkpointId) {
      // Specific checkpoint requested
      checkpoint = await this.store.findById(options.checkpointId);
      
      if (!checkpoint || checkpoint.agentId !== agentId) {
        return {
          success: false,
          agentId,
          checkpointId: options.checkpointId,
          timestamp: new Date(),
          recoveryTime: Date.now() - startTime,
          error: 'Checkpoint not found',
        };
      }
    } else {
      // Use latest valid checkpoint (REQ-CHECK-024)
      checkpoint = await this.findLatestValidCheckpoint(agentId);
      
      if (!checkpoint) {
        return {
          success: false,
          agentId,
          checkpointId: '',
          timestamp: new Date(),
          recoveryTime: Date.now() - startTime,
          error: 'No valid checkpoints found',
        };
      }
    }

    // Verify integrity if requested (REQ-CHECK-029)
    if (options.verifyIntegrity !== false) {
      const isValid = await this.store.verifyIntegrity(checkpoint.checkpointId);
      if (!isValid) {
        // Mark as corrupted and try next checkpoint (REQ-CHECK-027)
        await this.store.markAsCorrupted(checkpoint.checkpointId);
        
        if (options.fallbackToLatest !== false) {
          return await this.recover(agentId, {
            ...options,
            checkpointId: undefined,
            verifyIntegrity: false,
          });
        }

        return {
          success: false,
          agentId,
          checkpointId: checkpoint.checkpointId,
          timestamp: new Date(),
          recoveryTime: Date.now() - startTime,
          error: 'Checkpoint integrity verification failed',
        };
      }
    }

    // Perform rollback with retries
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const restoredState = await this.rollbackExecutor.rollback(checkpoint);

        // Set agent to paused state after recovery (REQ-CHECK-025)
        restoredState.status = AgentStatus.PAUSED;

        return {
          success: true,
          agentId,
          checkpointId: checkpoint.checkpointId,
          timestamp: new Date(),
          restoredState,
          recoveryTime: Date.now() - startTime,
        };
      } catch (error) {
        console.error(`Recovery attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt === maxRetries) {
          // All retries failed, try fallback (REQ-CHECK-030)
          if (options.fallbackToLatest !== false && options.checkpointId) {
            return await this.recover(agentId, {
              ...options,
              checkpointId: undefined,
            });
          }

          return {
            success: false,
            agentId,
            checkpointId: checkpoint.checkpointId,
            timestamp: new Date(),
            recoveryTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Recovery failed',
          };
        }

        // Try next checkpoint if specific one failed
        if (options.checkpointId && attempt === maxRetries) {
          const nextCheckpoint = await this.findNextValidCheckpoint(agentId, checkpoint.checkpointId);
          if (nextCheckpoint) {
            checkpoint = nextCheckpoint;
            // Reset attempts for new checkpoint
            attempt = 0;
          }
        }
      }
    }

    return {
      success: false,
      agentId,
      checkpointId: checkpoint.checkpointId,
      timestamp: new Date(),
      recoveryTime: Date.now() - startTime,
      error: 'Recovery failed after all retries',
    };
  }

  /**
   * Auto-recover on crash (REQ-CHECK-028)
   */
  async autoRecover(agentId: string): Promise<RecoveryResult> {
    return await this.recover(agentId, {
      verifyIntegrity: true,
      fallbackToLatest: true,
      maxRetries: 3,
    });
  }

  /**
   * Get available recovery points
   */
  async getRecoveryPoints(agentId: string): Promise<Array<{
    checkpointId: string;
    timestamp: Date;
    type: string;
    description?: string;
    isValid: boolean;
  }>> {
    const checkpoints = await this.store.findByAgentId(agentId);

    return checkpoints
      .filter(cp => cp.status === CheckpointStatus.VALID)
      .map(cp => ({
        checkpointId: cp.checkpointId,
        timestamp: cp.timestamp,
        type: cp.type,
        description: cp.metadata.description,
        isValid: cp.isValid,
      }));
  }

  /**
   * Find latest valid checkpoint for agent
   */
  private async findLatestValidCheckpoint(agentId: string): Promise<Checkpoint | null> {
    const checkpoints = await this.store.findByAgentId(agentId);

    for (const checkpoint of checkpoints) {
      if (checkpoint.status === CheckpointStatus.VALID && checkpoint.isValid) {
        return checkpoint;
      }
    }

    return null;
  }

  /**
   * Find next valid checkpoint after given one
   */
  private async findNextValidCheckpoint(
    agentId: string,
    afterCheckpointId: string
  ): Promise<Checkpoint | null> {
    const checkpoints = await this.store.findByAgentId(agentId);
    
    const afterIndex = checkpoints.findIndex(cp => cp.checkpointId === afterCheckpointId);
    if (afterIndex === -1) return null;

    for (let i = afterIndex + 1; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      if (cp.status === CheckpointStatus.VALID && cp.isValid) {
        return cp;
      }
    }

    return null;
  }

  /**
   * Validate checkpoint for recovery
   */
  async validateCheckpoint(checkpointId: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    const checkpoint = await this.store.findById(checkpointId);

    if (!checkpoint) {
      issues.push('Checkpoint not found');
      return { valid: false, issues };
    }

    // Check validity flag
    if (!checkpoint.isValid) {
      issues.push('Checkpoint marked as invalid');
    }

    // Check status
    if (checkpoint.status !== CheckpointStatus.VALID) {
      issues.push(`Checkpoint status is ${checkpoint.status}`);
    }

    // Check expiration
    if (checkpoint.expiresAt && checkpoint.expiresAt < new Date()) {
      issues.push('Checkpoint has expired');
    }

    // Verify integrity
    const integrityOk = await this.store.verifyIntegrity(checkpointId);
    if (!integrityOk) {
      issues.push('Checkpoint integrity check failed');
    }

    // For incremental checkpoints, check base exists
    if (checkpoint.type === 'incremental' && checkpoint.baseCheckpointId) {
      const baseExists = await this.store.findById(checkpoint.baseCheckpointId);
      if (!baseExists) {
        issues.push('Base checkpoint for incremental checkpoint not found');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
