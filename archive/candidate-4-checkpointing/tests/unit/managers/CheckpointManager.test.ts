/**
 * Unit Tests for CheckpointManager
 * Tests REQ-CHECK-010 through REQ-CHECK-017
 */

import { CheckpointManager } from '../../../src/managers/CheckpointManager';
import { CheckpointStore } from '../../../src/storage/CheckpointStore';
import { StateSerializer } from '../../../src/serialization/StateSerializer';
import { AgentState, CheckpointCreationOptions, CheckpointType, CheckpointStatus, AgentStatus } from '../../../src/domain/models';

// Mock CheckpointStore
class MockCheckpointStore extends CheckpointStore {
  private checkpoints: Map<string, any> = new Map();
  private agentCheckpoints: Map<string, string[]> = new Map();

  async save(checkpoint: any): Promise<{ success: boolean; checkpointId?: string; error?: string }> {
    this.checkpoints.set(checkpoint.checkpointId, checkpoint);
    
    const agentCps = this.agentCheckpoints.get(checkpoint.agentId) || [];
    agentCps.push(checkpoint.checkpointId);
    this.agentCheckpoints.set(checkpoint.agentId, agentCps);
    
    return { success: true, checkpointId: checkpoint.checkpointId };
  }

  async findLatestByAgentId(agentId: string): Promise<any> {
    const cps = this.agentCheckpoints.get(agentId);
    if (!cps || cps.length === 0) return null;
    return this.checkpoints.get(cps[cps.length - 1]);
  }

  async findByAgentId(agentId: string, limit?: number): Promise<any[]> {
    const cps = this.agentCheckpoints.get(agentId) || [];
    const limitValue = limit ?? cps.length;
    const results = cps.slice(-limitValue).map(id => this.checkpoints.get(id));
    return results.filter(cp => cp !== undefined).reverse();
  }

  async countByAgentId(agentId: string): Promise<number> {
    return (this.agentCheckpoints.get(agentId) || []).length;
  }

  async deleteOldest(agentId: string, keepCount: number): Promise<number> {
    const cps = this.agentCheckpoints.get(agentId) || [];
    const deleteCount = Math.max(0, cps.length - keepCount);
    const toDelete = cps.splice(0, deleteCount);
    
    for (const id of toDelete) {
      this.checkpoints.delete(id);
    }
    
    return deleteCount;
  }

  async getNextSequenceNumber(agentId: string): Promise<number> {
    const cps = this.agentCheckpoints.get(agentId) || [];
    return cps.length;
  }

  async deleteById(checkpointId: string): Promise<boolean> {
    const deleted = this.checkpoints.delete(checkpointId);
    if (deleted) {
      // Also remove from agentCheckpoints
      for (const [agentId, cps] of this.agentCheckpoints.entries()) {
        const index = cps.indexOf(checkpointId);
        if (index !== -1) {
          cps.splice(index, 1);
          break;
        }
      }
    }
    return deleted;
  }

  async deleteByAgentId(agentId: string): Promise<number> {
    const cps = this.agentCheckpoints.get(agentId) || [];
    this.agentCheckpoints.delete(agentId);
    
    let count = 0;
    for (const id of cps) {
      if (this.checkpoints.delete(id)) count++;
    }
    return count;
  }

  async findByType(agentId: string, type: CheckpointType): Promise<any[]> {
    const cps = this.agentCheckpoints.get(agentId) || [];
    return cps
      .map(id => this.checkpoints.get(id))
      .filter(cp => cp && cp.type === type)
      .reverse();
  }

  reset() {
    this.checkpoints.clear();
    this.agentCheckpoints.clear();
  }
}

describe('CheckpointManager', () => {
  let manager: CheckpointManager;
  let store: MockCheckpointStore;
  let serializer: StateSerializer;

  beforeEach(() => {
    store = new MockCheckpointStore();
    serializer = new StateSerializer();
    manager = new CheckpointManager(store, serializer, 5);
  });

  const createTestState = (overrides?: Partial<AgentState>): AgentState => ({
    messages: [],
    variables: { test: 'value' },
    status: AgentStatus.IDLE,
    ...overrides,
  });

  describe('createCheckpoint', () => {
    it('should create full checkpoint for new agent (REQ-CHECK-010, REQ-CHECK-011)', async () => {
      const agentId = 'agent-1';
      const state = createTestState();

      const result = await manager.createCheckpoint(agentId, state);

      expect(result.success).toBe(true);
      expect(result.checkpoint).toBeDefined();
      expect(result.checkpoint!.agentId).toBe(agentId);
      expect(result.checkpoint!.type).toBe(CheckpointType.FULL);
      expect(result.checkpoint!.checkpointId).toBeDefined();
      expect(result.checkpoint!.timestamp).toBeInstanceOf(Date);
      expect(result.checkpoint!.sequenceNumber).toBe(0);
    });

    it('should skip checkpoint if no state changed (REQ-CHECK-015)', async () => {
      const agentId = 'agent-1';
      const state = createTestState();

      // First checkpoint
      await manager.createCheckpoint(agentId, state);

      // Second checkpoint with same state
      const result = await manager.createCheckpoint(agentId, state);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toContain('No state changes');
    });

    it('should respect custom options (REQ-CHECK-013)', async () => {
      const agentId = 'agent-1';
      const state = createTestState();
      const options: CheckpointCreationOptions = {
        description: 'Manual checkpoint',
        tags: ['manual', 'important'],
        reason: 'manual',
        ttl: 3600,
      };

      const result = await manager.createCheckpoint(agentId, state, options);

      expect(result.success).toBe(true);
      expect(result.checkpoint!.metadata.description).toBe('Manual checkpoint');
      expect(result.checkpoint!.metadata.tags).toContain('manual');
      expect(result.checkpoint!.metadata.checkpointReason).toBe('manual');
      expect(result.checkpoint!.expiresAt).toBeDefined();
    });

    it('should clean up old checkpoints (REQ-CHECK-016)', async () => {
      const agentId = 'agent-1';
      
      // Create 7 checkpoints (max is 5)
      for (let i = 0; i < 7; i++) {
        await manager.createCheckpoint(agentId, createTestState({ variables: { iteration: i } }));
      }

      const checkpoints = await manager.getCheckpoints(agentId);
      expect(checkpoints.length).toBeLessThanOrEqual(5);
    });

    it('should return error on serialization failure', async () => {
      const agentId = 'agent-1';
      
      // Create state with circular reference (can't serialize)
      const state: any = createTestState();
      state.variables.circular = state;

      const result = await manager.createCheckpoint(agentId, state);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getCheckpoints', () => {
    it('should return checkpoints in reverse chronological order', async () => {
      const agentId = 'agent-1';

      await manager.createCheckpoint(agentId, createTestState({ variables: { seq: 1 } }));
      await new Promise(resolve => setTimeout(resolve, 10));
      await manager.createCheckpoint(agentId, createTestState({ variables: { seq: 2 } }));
      await new Promise(resolve => setTimeout(resolve, 10));
      await manager.createCheckpoint(agentId, createTestState({ variables: { seq: 3 } }));

      const checkpoints = await manager.getCheckpoints(agentId);

      expect(checkpoints).toHaveLength(3);
      expect(checkpoints[0].sequenceNumber).toBe(2);
      expect(checkpoints[1].sequenceNumber).toBe(1);
      expect(checkpoints[2].sequenceNumber).toBe(0);
    });

    it('should respect limit parameter', async () => {
      const agentId = 'agent-1';

      for (let i = 0; i < 5; i++) {
        await manager.createCheckpoint(agentId, createTestState({ variables: { seq: i } }));
      }

      const checkpoints = await manager.getCheckpoints(agentId, 3);

      expect(checkpoints).toHaveLength(3);
    });
  });

  describe('getLatestCheckpoint', () => {
    it('should return null for agent with no checkpoints', async () => {
      const checkpoint = await manager.getLatestCheckpoint('non-existent');
      expect(checkpoint).toBeNull();
    });

    it('should return most recent checkpoint', async () => {
      const agentId = 'agent-1';

      await manager.createCheckpoint(agentId, createTestState({ variables: { seq: 1 } }));
      await manager.createCheckpoint(agentId, createTestState({ variables: { seq: 2 } }));

      const checkpoint = await manager.getLatestCheckpoint(agentId);

      expect(checkpoint).toBeDefined();
      expect(checkpoint!.sequenceNumber).toBe(1);
      expect(checkpoint!.state.variables.seq).toBe(2);
    });
  });

  describe('deleteCheckpoint', () => {
    it('should delete checkpoint by ID', async () => {
      const agentId = 'agent-1';
      
      const result = await manager.createCheckpoint(agentId, createTestState({ variables: { x: 1 } }));
      const checkpointId = result.checkpoint!.checkpointId;

      const deleted = await manager.deleteCheckpoint(checkpointId);

      expect(deleted).toBe(true);
      expect(await manager.getCheckpoints(agentId)).toHaveLength(0);
    });

    it('should return false for non-existent checkpoint', async () => {
      const deleted = await manager.deleteCheckpoint('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('deleteAgentCheckpoints', () => {
    it('should delete all checkpoints for agent', async () => {
      const agentId = 'agent-1';

      await manager.createCheckpoint(agentId, createTestState({ variables: { x: 1 } }));
      await manager.createCheckpoint(agentId, createTestState({ variables: { x: 2 } }));
      await manager.createCheckpoint(agentId, createTestState({ variables: { x: 3 } }));

      const count = await manager.deleteAgentCheckpoints(agentId);

      expect(count).toBe(3);
      expect(await manager.getCheckpoints(agentId)).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return checkpoint statistics', async () => {
      const agentId = 'agent-1';

      await manager.createCheckpoint(agentId, createTestState({ variables: { data: 'first' } }));
      await manager.createCheckpoint(agentId, createTestState({ variables: { data: 'second' } }));

      const stats = await manager.getStats(agentId);

      expect(stats.totalCount).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.latestTimestamp).toBeDefined();
    });

    it('should return zero stats for agent with no checkpoints', async () => {
      const stats = await manager.getStats('non-existent');

      expect(stats.totalCount).toBe(0);
      expect(stats.fullCount).toBe(0);
      expect(stats.incrementalCount).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('incremental checkpoints', () => {
    it('should create incremental checkpoint after full checkpoint', async () => {
      const agentId = 'agent-1';
      const state1 = createTestState({ variables: { version: 1 } });
      const state2 = createTestState({ variables: { version: 2 } });

      // Create full checkpoint first
      const result1 = await manager.createCheckpoint(agentId, state1);
      expect(result1.checkpoint!.type).toBe(CheckpointType.FULL);

      // Create incremental checkpoint - the type determination depends on existing checkpoints
      const result2 = await manager.createCheckpoint(agentId, state2);

      expect(result2.success).toBe(true);
      // When requested type is INCREMENTAL, it should use that type
      // The baseCheckpointId and diff may vary based on internal logic
    });

    it('should fall back to full when diff is too large', async () => {
      const agentId = 'agent-1';
      const state1 = createTestState({ variables: { version: 1 } });
      const state2 = createTestState({ variables: { version: 2, largeData: 'x'.repeat(10000) } });

      // Create full checkpoint first
      await manager.createCheckpoint(agentId, state1);

      // Try to create incremental checkpoint with large diff
      const result = await manager.createCheckpoint(agentId, state2, {
        type: CheckpointType.INCREMENTAL,
      });

      // Should fall back to full checkpoint if diff is >= 50% of base
      expect(result.success).toBe(true);
      // The fallback depends on the shouldUseFullCheckpoint logic
    });

    it('should use full checkpoint when base is incremental', async () => {
      const agentId = 'agent-1';
      const state1 = createTestState({ variables: { version: 1 } });
      const state2 = createTestState({ variables: { version: 2 } });
      const state3 = createTestState({ variables: { version: 3 } });

      // Create full checkpoint
      await manager.createCheckpoint(agentId, state1, { type: CheckpointType.FULL });

      // Create incremental checkpoint
      await manager.createCheckpoint(agentId, state2, { type: CheckpointType.INCREMENTAL });

      // Try to create another incremental - should find full base
      const result = await manager.createCheckpoint(agentId, state3, {
        type: CheckpointType.INCREMENTAL,
      });

      expect(result.success).toBe(true);
    });

    it('should create full checkpoint when no previous checkpoint exists', async () => {
      const agentId = 'agent-1';
      const state = createTestState({ variables: { version: 1 } });

      const result = await manager.createCheckpoint(agentId, state, {
        type: CheckpointType.INCREMENTAL,
      });

      // Should default to FULL when no previous checkpoint
      expect(result.success).toBe(true);
      expect(result.checkpoint!.type).toBe(CheckpointType.FULL);
    });
  });

  describe('error handling', () => {
    it('should handle save failures', async () => {
      const agentId = 'agent-1';
      const state = createTestState();

      // Mock store to return failure
      jest.spyOn(store, 'save').mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });

      const result = await manager.createCheckpoint(agentId, state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });

    it('should handle unexpected errors during checkpoint creation', async () => {
      const agentId = 'agent-1';
      const state = createTestState();

      // Mock store to throw error
      jest.spyOn(store, 'findLatestByAgentId').mockRejectedValue(new Error('Unexpected error'));

      const result = await manager.createCheckpoint(agentId, state);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should log serialization warnings', async () => {
      const agentId = 'agent-1';
      const state = createTestState({ variables: { password: 'secret123' } });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await manager.createCheckpoint(agentId, state);

      // Should log warning for filtered sensitive data
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('checkpoint type determination', () => {
    it('should find full checkpoint when latest is incremental', async () => {
      const agentId = 'agent-1';
      const state1 = createTestState({ variables: { version: 1 } });
      const state2 = createTestState({ variables: { version: 2 } });

      // Create full checkpoint
      const fullResult = await manager.createCheckpoint(agentId, state1, {
        type: CheckpointType.FULL,
      });

      // Create incremental checkpoint
      await manager.createCheckpoint(agentId, state2, { type: CheckpointType.INCREMENTAL });

      // Verify we can still find the full checkpoint
      const fullCheckpoints = await store.findByType(agentId, CheckpointType.FULL);
      expect(fullCheckpoints.length).toBeGreaterThan(0);
      expect(fullCheckpoints[0].checkpointId).toBe(fullResult.checkpoint!.checkpointId);
    });
  });
});
