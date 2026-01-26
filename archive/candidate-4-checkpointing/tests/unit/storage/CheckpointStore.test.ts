/**
 * Unit Tests for CheckpointStore
 * Tests checkpoint persistence operations with MongoDB
 */

import { CheckpointStore } from '../../../src/storage/CheckpointStore';
import { Checkpoint, CheckpointType, CheckpointStatus, AgentState, AgentStatus } from '../../../src/domain/models';
import type { CheckpointDocument } from '../../../src/storage/CheckpointSchema';

// Mock the entire CheckpointSchema module
jest.mock('../../../src/storage/CheckpointSchema.js', () => ({
  CheckpointModel: class {
    _id: string;
    data: any;

    constructor(checkpoint: any) {
      this._id = checkpoint.checkpointId;
      this.data = checkpoint;
    }

    async save(): Promise<this> {
      // Simulate successful save
      return this;
    }
  },
}));

describe('CheckpointStore', () => {
  let store: CheckpointStore;

  const createTestCheckpoint = (
    agentId: string = 'agent-1',
    checkpointId: string = 'cp-1',
    state?: AgentState,
    type: CheckpointType = CheckpointType.FULL
  ): Checkpoint => ({
    agentId,
    checkpointId,
    timestamp: new Date(),
    state: state || {
      messages: [],
      variables: { test: 'value' },
      status: AgentStatus.IDLE,
      lastActivity: new Date(),
    },
    metadata: { tags: [], checkpointReason: 'manual' },
    size: 1000,
    type,
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
    store = new CheckpointStore();
  });

  describe('save', () => {
    it('should save checkpoint successfully', async () => {
      const checkpoint = createTestCheckpoint();

      const result = await store.save(checkpoint);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should return null for non-existent checkpoint', async () => {
      const result = await store.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findLatestByAgentId', () => {
    it('should return null for agent with no checkpoints', async () => {
      const result = await store.findLatestByAgentId('agent-1');
      expect(result).toBeNull();
    });
  });

  describe('findByAgentId', () => {
    it('should return empty array for agent with no checkpoints', async () => {
      const results = await store.findByAgentId('agent-1');
      expect(results).toEqual([]);
    });
  });

  describe('findByType', () => {
    it('should return empty array when no checkpoints exist', async () => {
      const results = await store.findByType('agent-1', CheckpointType.FULL);
      expect(results).toEqual([]);
    });
  });

  describe('countByAgentId', () => {
    it('should return 0 for agent with no checkpoints', async () => {
      const count = await store.countByAgentId('agent-1');
      expect(count).toBe(0);
    });
  });

  describe('deleteOldest', () => {
    it('should return 0 when no checkpoints to delete', async () => {
      const deleteCount = await store.deleteOldest('agent-1', 2);
      expect(deleteCount).toBe(0);
    });
  });

  describe('deleteById', () => {
    it('should return false for non-existent checkpoint', async () => {
      const result = await store.deleteById('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('deleteByAgentId', () => {
    it('should return 0 when no checkpoints exist', async () => {
      const count = await store.deleteByAgentId('agent-1');
      expect(count).toBe(0);
    });
  });

  describe('markAsCorrupted', () => {
    it('should return false when checkpoint not found', async () => {
      const result = await store.markAsCorrupted('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('deleteExpired', () => {
    it('should return 0 when no expired checkpoints', async () => {
      const count = await store.deleteExpired();
      expect(count).toBe(0);
    });
  });

  describe('getNextSequenceNumber', () => {
    it('should return 0 for first checkpoint', async () => {
      const seq = await store.getNextSequenceNumber('agent-1');
      expect(seq).toBe(0);
    });
  });

  describe('verifyIntegrity', () => {
    it('should return false for non-existent checkpoint', async () => {
      const isValid = await store.verifyIntegrity('non-existent');
      expect(isValid).toBe(false);
    });

    it('should verify valid checkpoint integrity', async () => {
      // Create a valid checkpoint with proper state
      const checkpoint = createTestCheckpoint('agent-1', 'cp-1', {
        messages: [],
        variables: { test: 'value' },
        status: AgentStatus.IDLE,
        lastActivity: new Date(),
      });

      // Mock findById to return the checkpoint
      jest.spyOn(store, 'findById' as any).mockResolvedValue(checkpoint);

      const isValid = await store.verifyIntegrity('cp-1');
      expect(isValid).toBe(true);
    });

    it('should return false for checkpoint without checkpointId', async () => {
      const invalidCheckpoint: any = createTestCheckpoint('agent-1', 'cp-1', createTestState());
      delete invalidCheckpoint.checkpointId;

      jest.spyOn(store, 'findById' as any).mockResolvedValue(invalidCheckpoint);

      const isValid = await store.verifyIntegrity('cp-1');
      expect(isValid).toBe(false);
    });

    it('should return false for checkpoint without state', async () => {
      const invalidCheckpoint = createTestCheckpoint('agent-1', 'cp-1', createTestState());
      invalidCheckpoint.state = undefined as any;

      jest.spyOn(store, 'findById' as any).mockResolvedValue(invalidCheckpoint);

      const isValid = await store.verifyIntegrity('cp-1');
      expect(isValid).toBe(false);
    });

    it('should return false for checkpoint with invalid size', async () => {
      const invalidCheckpoint = createTestCheckpoint('agent-1', 'cp-1', createTestState());
      invalidCheckpoint.size = 0;

      jest.spyOn(store, 'findById' as any).mockResolvedValue(invalidCheckpoint);

      const isValid = await store.verifyIntegrity('cp-1');
      expect(isValid).toBe(false);
    });

    it('should return false for non-serializable state', async () => {
      const invalidCheckpoint = createTestCheckpoint('agent-1', 'cp-1', createTestState());
      // Create circular reference
      const circularState: any = createTestState();
      circularState.self = circularState;
      invalidCheckpoint.state = circularState;

      jest.spyOn(store, 'findById' as any).mockResolvedValue(invalidCheckpoint);

      const isValid = await store.verifyIntegrity('cp-1');
      expect(isValid).toBe(false);
    });
  });

  describe('documentToCheckpoint', () => {
    it('should convert MongoDB document to Checkpoint', async () => {
      const doc = {
        _id: 'mongo-id-123',
        agentId: 'agent-1',
        checkpointId: 'cp-1',
        timestamp: new Date(),
        state: createTestState(),
        metadata: { tags: [], checkpointReason: 'manual' },
        size: 1000,
        type: CheckpointType.FULL,
        baseCheckpointId: undefined,
        diff: undefined,
        isValid: true,
        status: CheckpointStatus.VALID,
        sequenceNumber: 0,
        createdAt: new Date(),
        expiresAt: undefined,
      };

      // Create a mock CheckpointModel that returns the document
      const mockModel = {
        findOne: jest.fn().mockResolvedValue(doc),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([doc]),
            }),
            exec: jest.fn().mockResolvedValue([doc]),
          }),
        }),
        countDocuments: jest.fn().mockResolvedValue(1),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };

      // Mock the CheckpointSchema module
      jest.doMock('../../../src/storage/CheckpointSchema.js', () => ({
        CheckpointModel: mockModel,
      }));

      const testStore = new (await import('../../../src/storage/CheckpointStore.js')).CheckpointStore();
      const result = await testStore['documentToCheckpoint'](doc as unknown as CheckpointDocument);

      expect(result._id).toBe('mongo-id-123');
      expect(result.agentId).toBe('agent-1');
      expect(result.checkpointId).toBe('cp-1');
    });
  });
});
