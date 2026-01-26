import { RollbackExecutor } from '../../../src/recovery/RollbackExecutor';
import { CheckpointStore } from '../../../src/storage/CheckpointStore';
import { StateSerializer } from '../../../src/serialization/StateSerializer';
import { Checkpoint, CheckpointType, CheckpointStatus, AgentState } from '../../../src/domain/models';

// Mock dependencies
jest.mock('../../../src/storage/CheckpointStore');

describe('RollbackExecutor - Additional Coverage', () => {
  let rollbackExecutor: RollbackExecutor;
  let mockStore: jest.Mocked<CheckpointStore>;
  let serializer: StateSerializer;

  const createMockAgentState = (overrides: Partial<AgentState> = {}): AgentState => ({
    messages: [],
    variables: { key1: 'value1' },
    status: 'idle',
    lastActivity: new Date(),
    ...overrides,
  });

  const createMockCheckpoint = (overrides: Partial<Checkpoint> = {}): Checkpoint => ({
    _id: 'mock-id',
    agentId: 'agent-1',
    checkpointId: 'cp-1',
    timestamp: new Date(),
    state: createMockAgentState(),
    metadata: { 
      description: 'Test checkpoint',
      tags: [],
      checkpointReason: 'periodic',
    },
    size: 100,
    type: CheckpointType.FULL,
    isValid: true,
    status: CheckpointStatus.VALID,
    sequenceNumber: 1,
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = new CheckpointStore() as jest.Mocked<CheckpointStore>;
    serializer = new StateSerializer();
    rollbackExecutor = new RollbackExecutor(mockStore, serializer);
  });

  describe('resolveIncrementalCheckpoint - line 75', () => {
    it('should throw error when incremental checkpoint has no baseCheckpointId', async () => {
      const checkpoint = createMockCheckpoint({
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: undefined,
      });

      await expect(rollbackExecutor.rollback(checkpoint)).rejects.toThrow(
        'Incremental checkpoint missing base checkpoint ID'
      );
    });

    it('should throw error when base checkpoint is not found', async () => {
      const checkpoint = createMockCheckpoint({
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'base-cp-1',
      });

      mockStore.findById.mockResolvedValue(null);

      await expect(rollbackExecutor.rollback(checkpoint)).rejects.toThrow(
        'Base checkpoint base-cp-1 not found'
      );
    });
  });

  describe('resolveIncrementalCheckpoint - line 95 (no diff)', () => {
    it('should return base state when incremental checkpoint has no diff', async () => {
      const baseState = createMockAgentState({ variables: { baseKey: 'baseValue' } });
      const baseCheckpoint = createMockCheckpoint({
        checkpointId: 'base-cp-1',
        type: CheckpointType.FULL,
        state: baseState,
      });
      const incrementalCheckpoint = createMockCheckpoint({
        checkpointId: 'inc-cp-1',
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'base-cp-1',
        diff: undefined,
      });

      mockStore.findById.mockResolvedValue(baseCheckpoint);

      const result = await rollbackExecutor.rollback(incrementalCheckpoint);

      expect(result.variables.baseKey).toBe('baseValue');
    });
  });

  describe('resolveIncrementalCheckpoint - recursive resolution', () => {
    it('should recursively resolve nested incremental checkpoints', async () => {
      const baseState = createMockAgentState({ variables: { level: 'base' } });
      const baseCheckpoint = createMockCheckpoint({
        checkpointId: 'base-cp',
        type: CheckpointType.FULL,
        state: baseState,
      });

      const midCheckpoint = createMockCheckpoint({
        checkpointId: 'mid-cp',
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'base-cp',
        diff: { added: { midKey: 'midValue' }, modified: {}, deleted: [] },
      });

      const topCheckpoint = createMockCheckpoint({
        checkpointId: 'top-cp',
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'mid-cp',
        diff: { added: { topKey: 'topValue' }, modified: {}, deleted: [] },
      });

      mockStore.findById.mockImplementation(async (id: string) => {
        if (id === 'base-cp') return baseCheckpoint;
        if (id === 'mid-cp') return midCheckpoint;
        return null;
      });

      const result = await rollbackExecutor.rollback(topCheckpoint);

      expect(result.variables.level).toBe('base');
      expect(result.variables.midKey).toBe('midValue');
      expect(result.variables.topKey).toBe('topValue');
    });
  });

  describe('rollbackWithResult', () => {
    it('should return success result for full checkpoint', async () => {
      const checkpoint = createMockCheckpoint({
        type: CheckpointType.FULL,
      });

      const result = await rollbackExecutor.rollbackWithResult(checkpoint);

      expect(result.success).toBe(true);
      expect(result.resolvedFromIncremental).toBe(false);
      expect(result.checkpointId).toBe(checkpoint.checkpointId);
    });

    it('should return success result for incremental checkpoint', async () => {
      const baseCheckpoint = createMockCheckpoint({
        checkpointId: 'base-cp',
        type: CheckpointType.FULL,
      });
      const incrementalCheckpoint = createMockCheckpoint({
        checkpointId: 'inc-cp',
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'base-cp',
        diff: { added: {}, modified: {}, deleted: [] },
      });

      mockStore.findById.mockResolvedValue(baseCheckpoint);

      const result = await rollbackExecutor.rollbackWithResult(incrementalCheckpoint);

      expect(result.success).toBe(true);
      expect(result.resolvedFromIncremental).toBe(true);
    });

    it('should return failure result when rollback fails', async () => {
      const checkpoint = createMockCheckpoint({
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'missing-base',
      });

      mockStore.findById.mockResolvedValue(null);

      const result = await rollbackExecutor.rollbackWithResult(checkpoint);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(result.state.status).toBe('idle');
    });
  });

  describe('canRollback', () => {
    it('should return false for invalid checkpoint', async () => {
      const checkpoint = createMockCheckpoint({ isValid: false });

      const result = await rollbackExecutor.canRollback(checkpoint);

      expect(result.canRollback).toBe(false);
      expect(result.reason).toBe('Checkpoint is marked as invalid');
    });

    it('should return false for incremental checkpoint without base ID', async () => {
      const checkpoint = createMockCheckpoint({
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: undefined,
        isValid: true,
      });

      const result = await rollbackExecutor.canRollback(checkpoint);

      expect(result.canRollback).toBe(false);
      expect(result.reason).toBe('Incremental checkpoint missing base ID');
    });

    it('should return false when base checkpoint not found', async () => {
      const checkpoint = createMockCheckpoint({
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'missing-base',
        isValid: true,
      });

      mockStore.findById.mockResolvedValue(null);

      const result = await rollbackExecutor.canRollback(checkpoint);

      expect(result.canRollback).toBe(false);
      expect(result.reason).toBe('Base checkpoint not found');
    });

    it('should return true for valid full checkpoint', async () => {
      const checkpoint = createMockCheckpoint({
        type: CheckpointType.FULL,
        isValid: true,
      });

      const result = await rollbackExecutor.canRollback(checkpoint);

      expect(result.canRollback).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return true for valid incremental checkpoint with existing base', async () => {
      const baseCheckpoint = createMockCheckpoint({ checkpointId: 'base-cp' });
      const checkpoint = createMockCheckpoint({
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'base-cp',
        isValid: true,
      });

      mockStore.findById.mockResolvedValue(baseCheckpoint);

      const result = await rollbackExecutor.canRollback(checkpoint);

      expect(result.canRollback).toBe(true);
    });
  });

  describe('previewRollback', () => {
    it('should return state for successful preview', async () => {
      const checkpoint = createMockCheckpoint({
        type: CheckpointType.FULL,
        state: createMockAgentState({ variables: { preview: 'test' } }),
      });

      const result = await rollbackExecutor.previewRollback(checkpoint);

      expect(result).not.toBeNull();
      expect(result?.variables.preview).toBe('test');
    });

    it('should return null when preview fails', async () => {
      const checkpoint = createMockCheckpoint({
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'missing-base',
      });

      mockStore.findById.mockResolvedValue(null);

      const result = await rollbackExecutor.previewRollback(checkpoint);

      expect(result).toBeNull();
    });
  });
});
