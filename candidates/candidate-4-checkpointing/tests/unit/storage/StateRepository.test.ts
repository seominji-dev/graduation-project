/**
 * Unit Tests for StateRepository
 * Tests state queries and caching operations
 */

import { StateRepository } from '../../../src/storage/StateRepository';
import { CheckpointStore } from '../../../src/storage/CheckpointStore';
import { Checkpoint, CheckpointType, CheckpointStatus, AgentState, AgentStatus } from '../../../src/domain/models';

// Mock CheckpointStore
class MockCheckpointStore extends CheckpointStore {
  private checkpoints: Map<string, Checkpoint> = new Map();
  private agentCheckpoints: Map<string, string[]> = new Map();
  private counts: Map<string, number> = new Map();

  addCheckpoint(checkpoint: Checkpoint) {
    this.checkpoints.set(checkpoint.checkpointId, checkpoint);
    const cps = this.agentCheckpoints.get(checkpoint.agentId) || [];
    cps.push(checkpoint.checkpointId);
    this.agentCheckpoints.set(checkpoint.agentId, cps);
  }

  setCount(agentId: string, count: number) {
    this.counts.set(agentId, count);
  }

  async findLatestByAgentId(agentId: string): Promise<Checkpoint | null> {
    const cps = this.agentCheckpoints.get(agentId) || [];
    if (cps.length === 0) return null;
    const latestId = cps[cps.length - 1];
    return { ...this.checkpoints.get(latestId)! };
  }

  async findById(checkpointId: string): Promise<Checkpoint | null> {
    const cp = this.checkpoints.get(checkpointId);
    return cp ? { ...cp } : null;
  }

  async findByAgentId(agentId: string, limit?: number): Promise<Checkpoint[]> {
    const cps = this.agentCheckpoints.get(agentId) || [];
    const limitValue = limit ?? cps.length;
    return cps.slice(-limitValue).map(id => ({ ...this.checkpoints.get(id)! })).reverse();
  }

  async countByAgentId(agentId: string): Promise<number> {
    return this.counts.get(agentId) || (this.agentCheckpoints.get(agentId)?.length || 0);
  }

  reset() {
    this.checkpoints.clear();
    this.agentCheckpoints.clear();
    this.counts.clear();
  }
}

describe('StateRepository', () => {
  let repository: StateRepository;
  let store: MockCheckpointStore;

  const createTestCheckpoint = (
    agentId: string = 'agent-1',
    checkpointId: string = 'cp-1',
    state?: AgentState,
    type: CheckpointType = CheckpointType.FULL,
    baseCheckpointId?: string
  ): Checkpoint => ({
    agentId,
    checkpointId,
    timestamp: new Date(),
    state: state || {
      messages: [{ role: 'user' as const, content: 'Hello', timestamp: new Date() }],
      variables: { test: 'value' },
      status: AgentStatus.IDLE,
      lastActivity: new Date(),
    },
    metadata: { tags: [], checkpointReason: 'manual' },
    size: 1000,
    type,
    baseCheckpointId,
    isValid: true,
    status: CheckpointStatus.VALID,
    sequenceNumber: 0,
    createdAt: new Date(),
    expiresAt: undefined,
  });

  const createTestState = (overrides?: Partial<AgentState>): AgentState => ({
    messages: [],
    variables: { test: 'value' },
    status: AgentStatus.IDLE,
    lastActivity: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    store = new MockCheckpointStore();
    repository = new StateRepository(store, 1000); // 1 second cache timeout
  });

  describe('getLatestState', () => {
    it('should get latest state from store', async () => {
      const state = createTestState({ variables: { latest: true } });
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', state);
      store.addCheckpoint(checkpoint);

      const result = await repository.getLatestState('agent-1');

      expect(result).toBeDefined();
      expect(result!.variables.latest).toBe(true);
    });

    it('should cache retrieved state', async () => {
      const state = createTestState({ variables: { cached: true } });
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', state);
      store.addCheckpoint(checkpoint);

      // First call - from store
      const result1 = await repository.getLatestState('agent-1');

      // Second call - from cache
      const result2 = await repository.getLatestState('agent-1');

      expect(result1).toEqual(result2);
    });

    it('should return null for agent with no state', async () => {
      const result = await repository.getLatestState('non-existent');

      expect(result).toBeNull();
    });

    it('should resolve incremental checkpoint state', async () => {
      const baseState = createTestState({ variables: { a: 1, b: 2 } });
      const baseCheckpoint = createTestCheckpoint('agent-1', 'cp-base', baseState);

      const currentState = createTestState({ variables: { a: 1, b: 3, c: 4 } });
      const incrementalCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        currentState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incrementalCheckpoint.diff = {
        added: { c: 4 },
        modified: { b: 3 },
        deleted: [],
      };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(incrementalCheckpoint);

      const result = await repository.getLatestState('agent-1');

      expect(result!.variables).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should return current state when base checkpoint missing', async () => {
      const currentState = createTestState({ variables: { a: 1 } });
      const incrementalCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        currentState,
        CheckpointType.INCREMENTAL,
        'missing-base'
      );
      incrementalCheckpoint.diff = { added: {}, modified: {}, deleted: [] };

      store.addCheckpoint(incrementalCheckpoint);

      const result = await repository.getLatestState('agent-1');

      expect(result!.variables).toEqual({ a: 1 });
    });

    it('should invalidate expired cache entries', async () => {
      const state = createTestState({ variables: { expired: false } });
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', state);
      store.addCheckpoint(checkpoint);

      // First call
      await repository.getLatestState('agent-1');

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Update the state
      const newState = createTestState({ variables: { expired: true } });
      const newCheckpoint = createTestCheckpoint('agent-1', 'cp-2', newState);
      store.addCheckpoint(newCheckpoint);

      // Should fetch fresh data
      const result = await repository.getLatestState('agent-1');

      expect(result!.variables.expired).toBe(true);
    });
  });

  describe('getStateAtCheckpoint', () => {
    it('should get state at specific checkpoint', async () => {
      const state = createTestState({ variables: { specific: true } });
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', state);
      store.addCheckpoint(checkpoint);

      const result = await repository.getStateAtCheckpoint('agent-1', 'cp-1');

      expect(result).toBeDefined();
      expect(result!.variables.specific).toBe(true);
    });

    it('should return null for non-existent checkpoint', async () => {
      const result = await repository.getStateAtCheckpoint('agent-1', 'non-existent');

      expect(result).toBeNull();
    });

    it('should return null when checkpoint belongs to different agent', async () => {
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1');
      store.addCheckpoint(checkpoint);

      const result = await repository.getStateAtCheckpoint('agent-2', 'cp-1');

      expect(result).toBeNull();
    });

    it('should resolve incremental checkpoint at specific point', async () => {
      const baseState = createTestState({ variables: { version: 1 } });
      const baseCheckpoint = createTestCheckpoint('agent-1', 'cp-base', baseState);

      const newState = createTestState({ variables: { version: 2 } });
      const incrementalCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        newState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incrementalCheckpoint.diff = {
        added: {},
        modified: { version: 2 },
        deleted: [],
      };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(incrementalCheckpoint);

      const result = await repository.getStateAtCheckpoint('agent-1', 'cp-inc');

      expect(result!.variables.version).toBe(2);
    });
  });

  describe('getStateHistory', () => {
    it('should get state history for agent', async () => {
      const state1 = createTestState({ variables: { seq: 1 } });
      const cp1 = createTestCheckpoint('agent-1', 'cp-1', state1);

      const state2 = createTestState({ variables: { seq: 2 } });
      const cp2 = createTestCheckpoint('agent-1', 'cp-2', state2);
      cp2.sequenceNumber = 1;

      store.addCheckpoint(cp1);
      store.addCheckpoint(cp2);

      const history = await repository.getStateHistory('agent-1');

      expect(history).toHaveLength(2);
      expect(history[0].checkpointId).toBe('cp-2');
      expect(history[0].state.variables.seq).toBe(2);
      expect(history[1].checkpointId).toBe('cp-1');
      expect(history[1].state.variables.seq).toBe(1);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        const state = createTestState({ variables: { seq: i } });
        const cp = createTestCheckpoint('agent-1', `cp-${i}`, state);
        cp.sequenceNumber = i;
        store.addCheckpoint(cp);
      }

      const history = await repository.getStateHistory('agent-1', 3);

      expect(history.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array for agent with no history', async () => {
      const history = await repository.getStateHistory('non-existent');

      expect(history).toEqual([]);
    });

    it('should resolve incremental checkpoints in history', async () => {
      const baseState = createTestState({ variables: { a: 1 } });
      const baseCheckpoint = createTestCheckpoint('agent-1', 'cp-base', baseState);

      const incState = createTestState({ variables: { a: 1, b: 2 } });
      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        incState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = {
        added: { b: 2 },
        modified: {},
        deleted: [],
      };
      incCheckpoint.sequenceNumber = 1;

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(incCheckpoint);

      const history = await repository.getStateHistory('agent-1');

      // history[0] is inc (latest), history[1] is base (oldest)
      expect(history[0].state.variables).toEqual({ a: 1, b: 2 });
      expect(history[1].state.variables).toEqual({ a: 1 });
    });
  });

  describe('applyDiffToState (via incremental checkpoint)', () => {
    it('should apply added fields', async () => {
      const baseState = createTestState({ variables: { a: 1 } });
      const baseCheckpoint = createTestCheckpoint('agent-1', 'cp-base', baseState);

      const currentState = createTestState({ variables: { a: 1, b: 2, c: 3 } });
      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        currentState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = {
        added: { b: 2, c: 3 },
        modified: {},
        deleted: [],
      };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(incCheckpoint);

      const result = await repository.getLatestState('agent-1');

      expect(result!.variables).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should apply modified fields', async () => {
      const baseState = createTestState({ variables: { a: 1, b: 2 } });
      const baseCheckpoint = createTestCheckpoint('agent-1', 'cp-base', baseState);

      const currentState = createTestState({ variables: { a: 1, b: 5 } });
      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        currentState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = {
        added: {},
        modified: { b: 5 },
        deleted: [],
      };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(incCheckpoint);

      const result = await repository.getLatestState('agent-1');

      expect(result!.variables.b).toBe(5);
    });

    it('should apply modified messages', async () => {
      const baseState = createTestState({
        messages: [{ role: 'user' as const, content: 'Hello', timestamp: new Date() }],
      });
      const baseCheckpoint = createTestCheckpoint('agent-1', 'cp-base', baseState);

      const currentState = createTestState({
        messages: [
          { role: 'user' as const, content: 'Hello', timestamp: new Date() },
          { role: 'assistant' as const, content: 'Hi there!', timestamp: new Date() },
        ],
      });
      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        currentState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = {
        added: {},
        modified: { messages: currentState.messages },
        deleted: [],
      };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(incCheckpoint);

      const result = await repository.getLatestState('agent-1');

      expect(result!.messages).toHaveLength(2);
    });

    it('should apply modified executionPosition', async () => {
      const baseState = createTestState({
        executionPosition: { step: 1, functionName: 'func1' },
      });
      const baseCheckpoint = createTestCheckpoint('agent-1', 'cp-base', baseState);

      const currentState = createTestState({
        executionPosition: { step: 5, functionName: 'func2' },
      });
      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        currentState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = {
        added: {},
        modified: { executionPosition: currentState.executionPosition },
        deleted: [],
      };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(incCheckpoint);

      const result = await repository.getLatestState('agent-1');

      expect(result!.executionPosition!.step).toBe(5);
    });

    it('should apply modified status', async () => {
      const baseState = createTestState({ status: AgentStatus.IDLE });
      const baseCheckpoint = createTestCheckpoint('agent-1', 'cp-base', baseState);

      const currentState = createTestState({ status: AgentStatus.RUNNING });
      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        currentState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = {
        added: {},
        modified: { status: AgentStatus.RUNNING },
        deleted: [],
      };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(incCheckpoint);

      const result = await repository.getLatestState('agent-1');

      expect(result!.status).toBe(AgentStatus.RUNNING);
    });

    it('should apply deleted fields', async () => {
      const baseState = createTestState({ variables: { a: 1, b: 2, c: 3 } });
      const baseCheckpoint = createTestCheckpoint('agent-1', 'cp-base', baseState);

      const currentState = createTestState({ variables: { a: 1 } });
      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        currentState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = {
        added: {},
        modified: {},
        deleted: ['variables.b', 'variables.c'],
      };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(incCheckpoint);

      const result = await repository.getLatestState('agent-1');

      expect(result!.variables).toEqual({ a: 1 });
      expect(result!.variables.b).toBeUndefined();
      expect(result!.variables.c).toBeUndefined();
    });
  });

  describe('hasState', () => {
    it('should return true when agent has checkpoints', async () => {
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1');
      store.addCheckpoint(checkpoint);

      const hasState = await repository.hasState('agent-1');

      expect(hasState).toBe(true);
    });

    it('should return false when agent has no checkpoints', async () => {
      const hasState = await repository.hasState('non-existent');

      expect(hasState).toBe(false);
    });
  });

  describe('getCheckpointCount', () => {
    it('should return checkpoint count for agent', async () => {
      store.setCount('agent-1', 5);

      const count = await repository.getCheckpointCount('agent-1');

      expect(count).toBe(5);
    });

    it('should return 0 for agent with no checkpoints', async () => {
      const count = await repository.getCheckpointCount('non-existent');

      expect(count).toBe(0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific agent', async () => {
      const state = createTestState({ variables: { cached: true } });
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', state);
      store.addCheckpoint(checkpoint);

      // Populate cache
      await repository.getLatestState('agent-1');

      // Clear cache
      repository.clearCache('agent-1');

      // Should fetch from store again
      const result = await repository.getLatestState('agent-1');

      expect(result).toBeDefined();
    });

    it('should clear all cache when no agent specified', async () => {
      const state1 = createTestState({ variables: { agent: 1 } });
      const cp1 = createTestCheckpoint('agent-1', 'cp-1', state1);
      store.addCheckpoint(cp1);

      const state2 = createTestState({ variables: { agent: 2 } });
      const cp2 = createTestCheckpoint('agent-2', 'cp-2', state2);
      store.addCheckpoint(cp2);

      // Populate cache
      await repository.getLatestState('agent-1');
      await repository.getLatestState('agent-2');

      // Clear all cache
      repository.clearCache();

      // Both should still work
      const result1 = await repository.getLatestState('agent-1');
      const result2 = await repository.getLatestState('agent-2');

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('nested incremental checkpoints', () => {
    it('should resolve chain of incremental checkpoints', async () => {
      const baseState = createTestState({ variables: { a: 1 } });
      const baseCheckpoint = createTestCheckpoint('agent-1', 'cp-base', baseState);

      const inc1State = createTestState({ variables: { a: 1, b: 2 } });
      const inc1 = createTestCheckpoint(
        'agent-1',
        'cp-inc1',
        inc1State,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      inc1.diff = { added: { b: 2 }, modified: {}, deleted: [] };
      inc1.sequenceNumber = 1;

      const inc2State = createTestState({ variables: { a: 1, b: 2, c: 3 } });
      const inc2 = createTestCheckpoint(
        'agent-1',
        'cp-inc2',
        inc2State,
        CheckpointType.INCREMENTAL,
        'cp-inc1'
      );
      inc2.diff = { added: { c: 3 }, modified: {}, deleted: [] };
      inc2.sequenceNumber = 2;

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(inc1);
      store.addCheckpoint(inc2);

      const result = await repository.getLatestState('agent-1');

      expect(result!.variables).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should handle broken incremental chain', async () => {
      const baseState = createTestState({ variables: { a: 1 } });
      const baseCheckpoint = createTestCheckpoint('agent-1', 'cp-base', baseState);

      const incState = createTestState({ variables: { a: 1, b: 2 } });
      const inc = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        incState,
        CheckpointType.INCREMENTAL,
        'missing-base'
      );
      inc.diff = { added: { b: 2 }, modified: {}, deleted: [] };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(inc);

      const result = await repository.getLatestState('agent-1');

      // Should return current state as-is when base is missing
      expect(result!.variables).toEqual({ a: 1, b: 2 });
    });
  });
});
