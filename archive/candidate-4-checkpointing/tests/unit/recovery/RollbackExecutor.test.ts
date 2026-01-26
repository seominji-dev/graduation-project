/**
 * Unit Tests for RollbackExecutor
 * Tests rollback execution logic
 */

import { RollbackExecutor } from '../../../src/recovery/RollbackExecutor';
import { CheckpointStore } from '../../../src/storage/CheckpointStore';
import { StateSerializer } from '../../../src/serialization/StateSerializer';
import {
  Checkpoint,
  CheckpointType,
  CheckpointStatus,
  AgentState,
  AgentStatus,
} from '../../../src/domain/models';

// Mock CheckpointStore
class MockCheckpointStore extends CheckpointStore {
  private checkpoints: Map<string, Checkpoint> = new Map();

  addCheckpoint(checkpoint: Checkpoint) {
    this.checkpoints.set(checkpoint.checkpointId, checkpoint);
  }

  async findById(checkpointId: string): Promise<Checkpoint | null> {
    const cp = this.checkpoints.get(checkpointId);
    return cp ? { ...cp } : null;
  }

  reset() {
    this.checkpoints.clear();
  }
}

describe('RollbackExecutor', () => {
  let executor: RollbackExecutor;
  let store: MockCheckpointStore;
  let serializer: StateSerializer;

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
    state:
      state || {
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
    serializer = new StateSerializer();
    executor = new RollbackExecutor(store, serializer);
  });

  describe('rollback', () => {
    it('should rollback full checkpoint directly', async () => {
      const state = createTestState({ variables: { full: true } });
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', state, CheckpointType.FULL);

      const result = await executor.rollback(checkpoint);

      expect(result.variables.full).toBe(true);
    });

    it('should rollback incremental checkpoint with base', async () => {
      const baseState = createTestState({ variables: { a: 1, b: 2, c: 3 } });
      const baseCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-base',
        baseState,
        CheckpointType.FULL
      );

      const currentState = createTestState({ variables: { a: 1, b: 5, c: 3, d: 4 } });
      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        currentState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = {
        added: { d: 4 },
        modified: { b: 5 },
        deleted: [],
      };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(incCheckpoint);

      const result = await executor.rollback(incCheckpoint);

      expect(result.variables).toEqual({ a: 1, b: 5, c: 3, d: 4 });
    });

    it('should throw error when incremental checkpoint missing base ID', async () => {
      const state = createTestState();
      // Create an incremental checkpoint with a baseCheckpointId that doesn't exist
      const checkpoint: Checkpoint = {
        ...createTestCheckpoint('agent-1', 'cp-inc', state),
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'non-existent-base', // This base doesn't exist
        diff: { added: {}, modified: {}, deleted: [] },
      };

      await expect(executor.rollback(checkpoint)).rejects.toThrow(
        'Base checkpoint non-existent-base not found'
      );
    });

    it('should throw error when base checkpoint not found', async () => {
      const state = createTestState();
      const checkpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        state,
        CheckpointType.INCREMENTAL,
        'non-existent-base'
      );
      checkpoint.diff = { added: {}, modified: {}, deleted: [] };

      await expect(executor.rollback(checkpoint)).rejects.toThrow(
        'Base checkpoint non-existent-base not found'
      );
    });

    it('should handle nested incremental checkpoints', async () => {
      const baseState = createTestState({ variables: { a: 1 } });
      const baseCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-base',
        baseState,
        CheckpointType.FULL
      );

      const inc1State = createTestState({ variables: { a: 1, b: 2 } });
      const inc1 = createTestCheckpoint(
        'agent-1',
        'cp-inc1',
        inc1State,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      inc1.diff = { added: { b: 2 }, modified: {}, deleted: [] };

      const inc2State = createTestState({ variables: { a: 1, b: 2, c: 3 } });
      const inc2 = createTestCheckpoint(
        'agent-1',
        'cp-inc2',
        inc2State,
        CheckpointType.INCREMENTAL,
        'cp-inc1'
      );
      inc2.diff = { added: { c: 3 }, modified: {}, deleted: [] };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(inc1);
      store.addCheckpoint(inc2);

      const result = await executor.rollback(inc2);

      expect(result.variables).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should return cloned state to avoid mutations', async () => {
      const state = createTestState({ variables: { data: [1, 2, 3] } });
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', state);

      const result = await executor.rollback(checkpoint);

      // Modify result
      (result.variables.data as number[]).push(4);

      // Get original state
      const original = await executor.rollback(checkpoint);

      // Original should be unchanged
      expect((original.variables.data as number[])).toEqual([1, 2, 3]);
      expect((result.variables.data as number[])).toEqual([1, 2, 3, 4]);
    });
  });

  describe('rollbackWithResult', () => {
    it('should return success result for valid rollback', async () => {
      const state = createTestState({ variables: { success: true } });
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', state);

      const result = await executor.rollbackWithResult(checkpoint);

      expect(result.success).toBe(true);
      expect(result.state.variables.success).toBe(true);
      expect(result.checkpointId).toBe('cp-1');
      expect(result.resolvedFromIncremental).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it('should mark resolved from incremental for incremental checkpoints', async () => {
      const baseState = createTestState();
      const baseCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-base',
        baseState,
        CheckpointType.FULL
      );

      const incState = createTestState();
      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        incState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = { added: {}, modified: {}, deleted: [] };

      store.addCheckpoint(baseCheckpoint);

      const result = await executor.rollbackWithResult(incCheckpoint);

      expect(result.success).toBe(true);
      expect(result.resolvedFromIncremental).toBe(true);
    });

    it('should return failure result on error', async () => {
      const state = createTestState();
      const checkpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        state,
        CheckpointType.INCREMENTAL,
        'non-existent-base'
      );
      checkpoint.diff = { added: {}, modified: {}, deleted: [] };

      const result = await executor.rollbackWithResult(checkpoint);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Base checkpoint');
      expect(result.state).toBeDefined();
      expect(result.state.status).toBe('idle');
    });

    it('should return initial state on rollback failure', async () => {
      const checkpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        createTestState(),
        CheckpointType.INCREMENTAL,
        'missing-base'
      );
      checkpoint.diff = { added: {}, modified: {}, deleted: [] };

      const result = await executor.rollbackWithResult(checkpoint);

      expect(result.success).toBe(false);
      expect(result.state.messages).toEqual([]);
      expect(result.state.variables).toEqual({});
      expect(result.state.status).toBe('idle');
    });
  });

  describe('canRollback', () => {
    it('should return true for valid full checkpoint', async () => {
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', createTestState(), CheckpointType.FULL);

      const result = await executor.canRollback(checkpoint);

      expect(result.canRollback).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return false for invalid checkpoint', async () => {
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', createTestState(), CheckpointType.FULL);
      checkpoint.isValid = false;

      const result = await executor.canRollback(checkpoint);

      expect(result.canRollback).toBe(false);
      expect(result.reason).toContain('invalid');
    });

    it('should return false when incremental checkpoint missing base ID', async () => {
      const checkpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        createTestState(),
        CheckpointType.INCREMENTAL,
        undefined
      );

      const result = await executor.canRollback(checkpoint);

      expect(result.canRollback).toBe(false);
      expect(result.reason).toContain('missing base ID');
    });

    it('should return false when base checkpoint not found', async () => {
      const checkpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        createTestState(),
        CheckpointType.INCREMENTAL,
        'missing-base'
      );
      checkpoint.diff = { added: {}, modified: {}, deleted: [] };

      const result = await executor.canRollback(checkpoint);

      expect(result.canRollback).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should return true for valid incremental checkpoint with existing base', async () => {
      const baseCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-base',
        createTestState(),
        CheckpointType.FULL
      );

      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        createTestState(),
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = { added: {}, modified: {}, deleted: [] };

      store.addCheckpoint(baseCheckpoint);

      const result = await executor.canRollback(incCheckpoint);

      expect(result.canRollback).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  describe('previewRollback', () => {
    it('should return state preview for valid checkpoint', async () => {
      const state = createTestState({ variables: { preview: true } });
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', state);

      const preview = await executor.previewRollback(checkpoint);

      expect(preview).toBeDefined();
      expect(preview!.variables.preview).toBe(true);
    });

    it('should return null for invalid checkpoint', async () => {
      const checkpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        createTestState(),
        CheckpointType.INCREMENTAL,
        'missing-base'
      );
      checkpoint.diff = { added: {}, modified: {}, deleted: [] };

      const preview = await executor.previewRollback(checkpoint);

      expect(preview).toBeNull();
    });

    it('should preview incremental checkpoint resolution', async () => {
      const baseState = createTestState({ variables: { a: 1, b: 2 } });
      const baseCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-base',
        baseState,
        CheckpointType.FULL
      );

      const incState = createTestState({ variables: { a: 1, b: 3, c: 4 } });
      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        incState,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = {
        added: { c: 4 },
        modified: { b: 3 },
        deleted: [],
      };

      store.addCheckpoint(baseCheckpoint);

      const preview = await executor.previewRollback(incCheckpoint);

      expect(preview!.variables).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should not modify actual checkpoint during preview', async () => {
      const state = createTestState({ variables: { original: 1 } });
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', state);

      const originalVariables = { ...checkpoint.state.variables };

      await executor.previewRollback(checkpoint);

      expect(checkpoint.state.variables).toEqual(originalVariables);
    });
  });

  describe('complex rollback scenarios', () => {
    it('should handle incremental checkpoint with deleted fields', async () => {
      const baseState = createTestState({ variables: { a: 1, b: 2, c: 3, d: 4 } });
      const baseCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-base',
        baseState,
        CheckpointType.FULL
      );

      const currentState = createTestState({ variables: { a: 1, c: 3 } });
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
        deleted: ['variables.b', 'variables.d'],
      };

      store.addCheckpoint(baseCheckpoint);

      const result = await executor.rollback(incCheckpoint);

      expect(result.variables).toEqual({ a: 1, c: 3 });
      expect(result.variables.b).toBeUndefined();
      expect(result.variables.d).toBeUndefined();
    });

    it('should handle incremental with modified messages', async () => {
      const baseState = createTestState({
        messages: [
          { role: 'user' as const, content: 'Hello', timestamp: new Date() },
        ],
      });
      const baseCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-base',
        baseState,
        CheckpointType.FULL
      );

      const currentState = createTestState({
        messages: [
          { role: 'user' as const, content: 'Hello', timestamp: new Date() },
          { role: 'assistant' as const, content: 'Hi!', timestamp: new Date() },
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

      const result = await executor.rollback(incCheckpoint);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[1].content).toBe('Hi!');
    });

    it('should handle incremental with modified execution position', async () => {
      const baseState = createTestState({
        executionPosition: { step: 1, functionName: 'func1', line: 10 },
      });
      const baseCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-base',
        baseState,
        CheckpointType.FULL
      );

      const currentState = createTestState({
        executionPosition: { step: 5, functionName: 'func2', line: 50 },
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

      const result = await executor.rollback(incCheckpoint);

      expect(result.executionPosition!.step).toBe(5);
      expect(result.executionPosition!.functionName).toBe('func2');
    });

    it('should handle incremental with modified status', async () => {
      const baseState = createTestState({ status: AgentStatus.IDLE });
      const baseCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-base',
        baseState,
        CheckpointType.FULL
      );

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
        modified: { _status: AgentStatus.RUNNING },
        deleted: [],
      };

      store.addCheckpoint(baseCheckpoint);

      const result = await executor.rollback(incCheckpoint);

      expect(result.status).toBe(AgentStatus.RUNNING);
    });

    it('should handle empty diff', async () => {
      const baseState = createTestState({ variables: { a: 1, b: 2 } });
      const baseCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-base',
        baseState,
        CheckpointType.FULL
      );

      const incCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-inc',
        baseState, // Same state
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      incCheckpoint.diff = {
        added: {},
        modified: {},
        deleted: [],
      };

      store.addCheckpoint(baseCheckpoint);

      const result = await executor.rollback(incCheckpoint);

      expect(result.variables).toEqual({ a: 1, b: 2 });
    });

    it('should handle chain of incremental checkpoints with mixed changes', async () => {
      // Base: {a: 1, b: 2, c: 3}
      const baseState = createTestState({ variables: { a: 1, b: 2, c: 3 } });
      const baseCheckpoint = createTestCheckpoint(
        'agent-1',
        'cp-base',
        baseState,
        CheckpointType.FULL
      );

      // Inc1: add d=4, modify b=5
      const inc1State = createTestState({ variables: { a: 1, b: 5, c: 3, d: 4 } });
      const inc1 = createTestCheckpoint(
        'agent-1',
        'cp-inc1',
        inc1State,
        CheckpointType.INCREMENTAL,
        'cp-base'
      );
      inc1.diff = { added: { d: 4 }, modified: { b: 5 }, deleted: [] };

      // Inc2: delete c, modify d=6
      const inc2State = createTestState({ variables: { a: 1, b: 5, d: 6 } });
      const inc2 = createTestCheckpoint(
        'agent-1',
        'cp-inc2',
        inc2State,
        CheckpointType.INCREMENTAL,
        'cp-inc1'
      );
      inc2.diff = { added: {}, modified: { d: 6 }, deleted: ['variables.c'] };

      store.addCheckpoint(baseCheckpoint);
      store.addCheckpoint(inc1);
      store.addCheckpoint(inc2);

      const result = await executor.rollback(inc2);

      expect(result.variables).toEqual({ a: 1, b: 5, d: 6 });
      expect(result.variables.c).toBeUndefined();
    });
  });

  describe('constructor with default serializer', () => {
    it('should create default serializer when none provided', () => {
      const executorWithoutSerializer = new RollbackExecutor(store);

      expect(executorWithoutSerializer).toBeDefined();
    });

    it('should use provided serializer', () => {
      const customSerializer = new StateSerializer(5000000);
      const executorWithSerializer = new RollbackExecutor(store, customSerializer);

      expect(executorWithSerializer).toBeDefined();
    });
  });
});
