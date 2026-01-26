import { RecoveryManager } from '../../../src/recovery/RecoveryManager';
import { CheckpointStore } from '../../../src/storage/CheckpointStore';
import { StateRepository } from '../../../src/storage/StateRepository';
import { RollbackExecutor } from '../../../src/recovery/RollbackExecutor';
import { Checkpoint, CheckpointType, CheckpointStatus, AgentState } from '../../../src/domain/models';

// Mock dependencies
jest.mock('../../../src/storage/CheckpointStore');
jest.mock('../../../src/storage/StateRepository');
jest.mock('../../../src/recovery/RollbackExecutor');

describe('RecoveryManager - Additional Coverage', () => {
  let recoveryManager: RecoveryManager;
  let mockStore: jest.Mocked<CheckpointStore>;
  let mockStateRepo: jest.Mocked<StateRepository>;
  let mockRollbackExecutor: jest.Mocked<RollbackExecutor>;

  const createMockCheckpoint = (overrides: Partial<Checkpoint> = {}): Checkpoint => ({
    _id: 'mock-id',
    agentId: 'agent-1',
    checkpointId: 'cp-1',
    timestamp: new Date(),
    state: {
      messages: [],
      variables: {},
      status: 'idle',
      lastActivity: new Date(),
    },
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

  const createMockAgentState = (): AgentState => ({
    messages: [],
    variables: {},
    status: 'idle',
    lastActivity: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockStore = new CheckpointStore() as jest.Mocked<CheckpointStore>;
    mockStateRepo = new StateRepository(mockStore) as jest.Mocked<StateRepository>;
    mockRollbackExecutor = new RollbackExecutor(mockStore) as jest.Mocked<RollbackExecutor>;

    recoveryManager = new RecoveryManager(mockStore, mockStateRepo, mockRollbackExecutor);
  });

  describe('findNextValidCheckpoint - lines 227-241', () => {
    it('should return null when afterCheckpointId is not found', async () => {
      const checkpoints = [
        createMockCheckpoint({ checkpointId: 'cp-1', sequenceNumber: 1 }),
        createMockCheckpoint({ checkpointId: 'cp-2', sequenceNumber: 2 }),
      ];

      mockStore.findByAgentId.mockResolvedValue(checkpoints);
      mockStore.findById.mockResolvedValue(
        createMockCheckpoint({ checkpointId: 'cp-unknown' })
      );
      mockStore.verifyIntegrity.mockResolvedValue(true);
      mockRollbackExecutor.rollback.mockRejectedValue(new Error('Rollback failed'));

      const result = await recoveryManager.recover('agent-1', {
        checkpointId: 'cp-unknown',
        maxRetries: 1,
        fallbackToLatest: false,
      });

      expect(result.success).toBe(false);
    });

    it('should find next valid checkpoint after given checkpoint', async () => {
      const checkpoints = [
        createMockCheckpoint({ checkpointId: 'cp-1', sequenceNumber: 1, isValid: false, status: CheckpointStatus.CORRUPTED }),
        createMockCheckpoint({ checkpointId: 'cp-2', sequenceNumber: 2, isValid: true, status: CheckpointStatus.VALID }),
        createMockCheckpoint({ checkpointId: 'cp-3', sequenceNumber: 3, isValid: true, status: CheckpointStatus.VALID }),
      ];

      mockStore.findByAgentId.mockResolvedValue(checkpoints);
      mockStore.findById.mockImplementation(async (id: string) => {
        return checkpoints.find(cp => cp.checkpointId === id) || null;
      });
      mockStore.verifyIntegrity.mockResolvedValue(true);
      mockRollbackExecutor.rollback.mockResolvedValue(createMockAgentState());

      const result = await recoveryManager.recover('agent-1', {
        checkpointId: 'cp-2',
        maxRetries: 1,
      });

      expect(result.success).toBe(true);
    });

    it('should return null when no valid checkpoint exists after given one', async () => {
      const checkpoints = [
        createMockCheckpoint({ checkpointId: 'cp-1', sequenceNumber: 1, isValid: true }),
        createMockCheckpoint({ checkpointId: 'cp-2', sequenceNumber: 2, isValid: false, status: CheckpointStatus.CORRUPTED }),
        createMockCheckpoint({ checkpointId: 'cp-3', sequenceNumber: 3, isValid: false, status: CheckpointStatus.CORRUPTED }),
      ];

      mockStore.findByAgentId.mockResolvedValue(checkpoints);
      mockStore.findById.mockImplementation(async (id: string) => {
        return checkpoints.find(cp => cp.checkpointId === id) || null;
      });
      mockStore.verifyIntegrity.mockResolvedValue(true);
      mockRollbackExecutor.rollback.mockRejectedValue(new Error('Rollback failed'));

      const result = await recoveryManager.recover('agent-1', {
        checkpointId: 'cp-1',
        maxRetries: 1,
        fallbackToLatest: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rollback failed');
    });
  });

  describe('recover - edge cases for lines 161-168', () => {
    it('should return failure after all retries when loop completes', async () => {
      const checkpoint = createMockCheckpoint({ checkpointId: 'cp-1' });

      mockStore.findById.mockResolvedValue(checkpoint);
      mockStore.findByAgentId.mockResolvedValue([checkpoint]);
      mockStore.verifyIntegrity.mockResolvedValue(true);
      mockRollbackExecutor.rollback.mockRejectedValue(new Error('Persistent failure'));

      const result = await recoveryManager.recover('agent-1', {
        checkpointId: 'cp-1',
        maxRetries: 3,
        fallbackToLatest: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Persistent failure');
    });

    it('should handle when checkpoint is found but belongs to different agent', async () => {
      const checkpoint = createMockCheckpoint({
        checkpointId: 'cp-1',
        agentId: 'different-agent'
      });

      mockStore.findById.mockResolvedValue(checkpoint);

      const result = await recoveryManager.recover('agent-1', {
        checkpointId: 'cp-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Checkpoint not found');
    });
  });

  describe('getRecoveryPoints', () => {
    it('should filter and map checkpoints correctly', async () => {
      const checkpoints = [
        createMockCheckpoint({
          checkpointId: 'cp-1',
          status: CheckpointStatus.VALID,
          type: CheckpointType.FULL,
          metadata: { description: 'First', tags: [], checkpointReason: 'periodic' }
        }),
        createMockCheckpoint({
          checkpointId: 'cp-2',
          status: CheckpointStatus.CORRUPTED,
          type: CheckpointType.INCREMENTAL,
          metadata: { description: 'Second', tags: [], checkpointReason: 'manual' }
        }),
        createMockCheckpoint({
          checkpointId: 'cp-3',
          status: CheckpointStatus.VALID,
          type: CheckpointType.INCREMENTAL,
          metadata: { description: 'Third', tags: [], checkpointReason: 'milestone' }
        }),
      ];

      mockStore.findByAgentId.mockResolvedValue(checkpoints);

      const points = await recoveryManager.getRecoveryPoints('agent-1');

      expect(points).toHaveLength(2);
      expect(points[0].checkpointId).toBe('cp-1');
      expect(points[1].checkpointId).toBe('cp-3');
    });
  });

  describe('validateCheckpoint - additional paths', () => {
    it('should detect expired checkpoint', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      const checkpoint = createMockCheckpoint({
        checkpointId: 'cp-1',
        expiresAt: expiredDate,
      });

      mockStore.findById.mockResolvedValue(checkpoint);
      mockStore.verifyIntegrity.mockResolvedValue(true);

      const result = await recoveryManager.validateCheckpoint('cp-1');

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Checkpoint has expired');
    });

    it('should validate incremental checkpoint with missing base', async () => {
      const checkpoint = createMockCheckpoint({
        checkpointId: 'cp-1',
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'cp-base',
      });

      mockStore.findById.mockImplementation(async (id: string) => {
        if (id === 'cp-1') return checkpoint;
        return null;
      });
      mockStore.verifyIntegrity.mockResolvedValue(true);

      const result = await recoveryManager.validateCheckpoint('cp-1');

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Base checkpoint for incremental checkpoint not found');
    });

    it('should pass validation for valid incremental checkpoint with existing base', async () => {
      const baseCheckpoint = createMockCheckpoint({
        checkpointId: 'cp-base',
        type: CheckpointType.FULL,
      });
      const checkpoint = createMockCheckpoint({
        checkpointId: 'cp-1',
        type: CheckpointType.INCREMENTAL,
        baseCheckpointId: 'cp-base',
      });

      mockStore.findById.mockImplementation(async (id: string) => {
        if (id === 'cp-1') return checkpoint;
        if (id === 'cp-base') return baseCheckpoint;
        return null;
      });
      mockStore.verifyIntegrity.mockResolvedValue(true);

      const result = await recoveryManager.validateCheckpoint('cp-1');

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('findLatestValidCheckpoint', () => {
    it('should skip invalid checkpoints and return first valid one', async () => {
      const checkpoints = [
        createMockCheckpoint({ checkpointId: 'cp-1', isValid: false }),
        createMockCheckpoint({ checkpointId: 'cp-2', status: CheckpointStatus.CORRUPTED }),
        createMockCheckpoint({ checkpointId: 'cp-3', isValid: true, status: CheckpointStatus.VALID }),
      ];

      mockStore.findByAgentId.mockResolvedValue(checkpoints);
      mockStore.verifyIntegrity.mockResolvedValue(true);
      mockRollbackExecutor.rollback.mockResolvedValue(createMockAgentState());

      const result = await recoveryManager.recover('agent-1', {});

      expect(result.success).toBe(true);
      expect(result.checkpointId).toBe('cp-3');
    });

    it('should return null when no valid checkpoints exist', async () => {
      const checkpoints = [
        createMockCheckpoint({ checkpointId: 'cp-1', isValid: false }),
        createMockCheckpoint({ checkpointId: 'cp-2', status: CheckpointStatus.CORRUPTED }),
      ];

      mockStore.findByAgentId.mockResolvedValue(checkpoints);

      const result = await recoveryManager.recover('agent-1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('No valid checkpoints found');
    });
  });
});
