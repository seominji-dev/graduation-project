import { CheckpointStore } from '../../../src/storage/CheckpointStore';
import { CheckpointModel } from '../../../src/storage/CheckpointSchema';
import { Checkpoint, CheckpointType, CheckpointStatus } from '../../../src/domain/models';

// Mock the CheckpointModel
jest.mock('../../../src/storage/CheckpointSchema', () => {
  const mockFindOne = jest.fn();
  const mockFind = jest.fn();
  const mockCountDocuments = jest.fn();
  const mockDeleteOne = jest.fn();
  const mockDeleteMany = jest.fn();
  const mockUpdateOne = jest.fn();
  
  return {
    CheckpointModel: Object.assign(
      jest.fn().mockImplementation(() => ({
        save: jest.fn(),
      })),
      {
        findOne: mockFindOne,
        find: mockFind,
        countDocuments: mockCountDocuments,
        deleteOne: mockDeleteOne,
        deleteMany: mockDeleteMany,
        updateOne: mockUpdateOne,
      }
    ),
  };
});

const MockedCheckpointModel = CheckpointModel as jest.MockedClass<typeof CheckpointModel> & {
  findOne: jest.Mock;
  find: jest.Mock;
  countDocuments: jest.Mock;
  deleteOne: jest.Mock;
  deleteMany: jest.Mock;
  updateOne: jest.Mock;
};

describe('CheckpointStore - Additional Coverage', () => {
  let store: CheckpointStore;

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
      description: 'Test',
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
    store = new CheckpointStore();
  });

  describe('findById - error handling (line 70)', () => {
    it('should return null on error', async () => {
      MockedCheckpointModel.findOne.mockRejectedValue(new Error('DB error'));

      const result = await store.findById('cp-1');

      expect(result).toBeNull();
    });
  });

  describe('findLatestByAgentId - error handling (line 89)', () => {
    it('should return null on error', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      };
      MockedCheckpointModel.findOne.mockReturnValue(mockQuery as any);

      const result = await store.findLatestByAgentId('agent-1');

      expect(result).toBeNull();
    });
  });

  describe('findByAgentId - error handling (line 109)', () => {
    it('should return empty array on error', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      };
      MockedCheckpointModel.find.mockReturnValue(mockQuery as any);

      const result = await store.findByAgentId('agent-1');

      expect(result).toEqual([]);
    });
  });

  describe('findByType - error handling (line 125)', () => {
    it('should return empty array on error', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      };
      MockedCheckpointModel.find.mockReturnValue(mockQuery as any);

      const result = await store.findByType('agent-1', CheckpointType.FULL);

      expect(result).toEqual([]);
    });
  });

  describe('countByAgentId - error handling (line 139)', () => {
    it('should return 0 on error', async () => {
      MockedCheckpointModel.countDocuments.mockRejectedValue(new Error('DB error'));

      const result = await store.countByAgentId('agent-1');

      expect(result).toBe(0);
    });
  });

  describe('deleteOldest - lines 154-161', () => {
    it('should delete oldest checkpoints keeping specified count', async () => {
      const checkpoints = [
        createMockCheckpoint({ checkpointId: 'cp-1', sequenceNumber: 1 }),
        createMockCheckpoint({ checkpointId: 'cp-2', sequenceNumber: 2 }),
        createMockCheckpoint({ checkpointId: 'cp-3', sequenceNumber: 3 }),
        createMockCheckpoint({ checkpointId: 'cp-4', sequenceNumber: 4 }),
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(checkpoints),
      };
      MockedCheckpointModel.find.mockReturnValue(mockQuery as any);
      MockedCheckpointModel.deleteOne.mockResolvedValue({ deletedCount: 1 } as any);

      const result = await store.deleteOldest('agent-1', 2);

      expect(result).toBe(2);
      expect(MockedCheckpointModel.deleteOne).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when keepCount >= total checkpoints', async () => {
      const checkpoints = [
        createMockCheckpoint({ checkpointId: 'cp-1' }),
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(checkpoints),
      };
      MockedCheckpointModel.find.mockReturnValue(mockQuery as any);

      const result = await store.deleteOldest('agent-1', 5);

      expect(result).toBe(0);
    });

    it('should return 0 on error', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      };
      MockedCheckpointModel.find.mockReturnValue(mockQuery as any);

      const result = await store.deleteOldest('agent-1', 2);

      expect(result).toBe(0);
    });
  });

  describe('deleteById - error handling (line 174)', () => {
    it('should return false on error', async () => {
      MockedCheckpointModel.deleteOne.mockRejectedValue(new Error('DB error'));

      const result = await store.deleteById('cp-1');

      expect(result).toBe(false);
    });

    it('should return false when no document deleted', async () => {
      MockedCheckpointModel.deleteOne.mockResolvedValue({ deletedCount: 0 } as any);

      const result = await store.deleteById('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('deleteByAgentId - error handling (line 187)', () => {
    it('should return 0 on error', async () => {
      MockedCheckpointModel.deleteMany.mockRejectedValue(new Error('DB error'));

      const result = await store.deleteByAgentId('agent-1');

      expect(result).toBe(0);
    });
  });

  describe('markAsCorrupted - error handling (line 206)', () => {
    it('should return false on error', async () => {
      MockedCheckpointModel.updateOne.mockRejectedValue(new Error('DB error'));

      const result = await store.markAsCorrupted('cp-1');

      expect(result).toBe(false);
    });

    it('should return false when no document modified', async () => {
      MockedCheckpointModel.updateOne.mockResolvedValue({ modifiedCount: 0 } as any);

      const result = await store.markAsCorrupted('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('deleteExpired - error handling (line 221)', () => {
    it('should return 0 on error', async () => {
      MockedCheckpointModel.deleteMany.mockRejectedValue(new Error('DB error'));

      const result = await store.deleteExpired();

      expect(result).toBe(0);
    });
  });

  describe('getNextSequenceNumber - error handling (line 237)', () => {
    it('should return 0 on error', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      };
      MockedCheckpointModel.findOne.mockReturnValue(mockQuery as any);

      const result = await store.getNextSequenceNumber('agent-1');

      expect(result).toBe(0);
    });

    it('should return 0 when no previous checkpoints exist', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      MockedCheckpointModel.findOne.mockReturnValue(mockQuery as any);

      const result = await store.getNextSequenceNumber('agent-1');

      expect(result).toBe(0);
    });
  });

  describe('verifyIntegrity - lines 266-272', () => {
    it('should return false when checkpoint not found', async () => {
      MockedCheckpointModel.findOne.mockResolvedValue(null);

      const result = await store.verifyIntegrity('non-existent');

      expect(result).toBe(false);
    });

    it('should return false when checkpointId is missing', async () => {
      MockedCheckpointModel.findOne.mockResolvedValue({
        checkpointId: '',
        agentId: 'agent-1',
        state: {},
        timestamp: new Date(),
        size: 100,
      });

      const result = await store.verifyIntegrity('cp-1');

      expect(result).toBe(false);
    });

    it('should return false when agentId is missing', async () => {
      MockedCheckpointModel.findOne.mockResolvedValue({
        checkpointId: 'cp-1',
        agentId: '',
        state: {},
        timestamp: new Date(),
        size: 100,
      });

      const result = await store.verifyIntegrity('cp-1');

      expect(result).toBe(false);
    });

    it('should return false when state is missing', async () => {
      MockedCheckpointModel.findOne.mockResolvedValue({
        checkpointId: 'cp-1',
        agentId: 'agent-1',
        state: null,
        timestamp: new Date(),
        size: 100,
      });

      const result = await store.verifyIntegrity('cp-1');

      expect(result).toBe(false);
    });

    it('should return false when timestamp is missing', async () => {
      MockedCheckpointModel.findOne.mockResolvedValue({
        checkpointId: 'cp-1',
        agentId: 'agent-1',
        state: {},
        timestamp: null,
        size: 100,
      });

      const result = await store.verifyIntegrity('cp-1');

      expect(result).toBe(false);
    });

    it('should return false when size is <= 0', async () => {
      MockedCheckpointModel.findOne.mockResolvedValue({
        checkpointId: 'cp-1',
        agentId: 'agent-1',
        state: {},
        timestamp: new Date(),
        size: 0,
      });

      const result = await store.verifyIntegrity('cp-1');

      expect(result).toBe(false);
    });

    it('should return false on error during verification', async () => {
      MockedCheckpointModel.findOne.mockRejectedValue(new Error('DB error'));

      const result = await store.verifyIntegrity('cp-1');

      expect(result).toBe(false);
    });

    it('should return true for valid checkpoint', async () => {
      MockedCheckpointModel.findOne.mockResolvedValue({
        checkpointId: 'cp-1',
        agentId: 'agent-1',
        state: { messages: [], variables: {} },
        timestamp: new Date(),
        size: 100,
      });

      const result = await store.verifyIntegrity('cp-1');

      expect(result).toBe(true);
    });
  });
});
