/**
 * MongoDB Client Unit Tests
 * Tests for L3 long-term storage implementation
 * REQ-MEM-011: Persistent storage for evicted pages
 */

// Mock logger first - must be before imports
jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  Logger: jest.fn(),
  LogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
}));

// Mock mongoose
const mockSave = jest.fn().mockResolvedValue(undefined);
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
const mockDeleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
const mockFind = jest.fn();
const mockCountDocuments = jest.fn().mockResolvedValue(0);
const mockAggregate = jest.fn();
const mockDeleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });

const MockModel: any = jest.fn().mockImplementation((data: any) => ({
  ...data,
  save: mockSave,
}));

// Add static methods
MockModel.findOne = mockFindOne;
MockModel.updateOne = mockUpdateOne;
MockModel.deleteOne = mockDeleteOne;
MockModel.find = mockFind;
MockModel.countDocuments = mockCountDocuments;
MockModel.aggregate = mockAggregate;
MockModel.deleteMany = mockDeleteMany;

// Create Schema mock with Types
const mockSchema: any = jest.fn().mockImplementation(() => ({
  index: jest.fn(),
}));
mockSchema.Types = {
  Mixed: 'Mixed',
  ObjectId: 'ObjectId',
};

jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  model: jest.fn().mockReturnValue(MockModel),
  Schema: mockSchema,
}));

import { MongoDBPageStore } from '../../../src/infrastructure/MongoDBClient';
import { MemoryPage, MemoryLevel, PageStatus } from '../../../src/domain/models';

describe('MongoDBPageStore - Unit Tests', () => {
  let store: MongoDBPageStore;

  const createTestPage = (agentId: string, key: string, value: string): MemoryPage => ({
    id: 'test-id-123',
    agentId,
    key,
    value,
    embedding: [0.1, 0.2, 0.3],
    level: MemoryLevel.L3_DISK,
    status: PageStatus.IDLE,
    accessCount: 1,
    lastAccessedAt: new Date('2024-01-01T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    size: Buffer.byteLength(value, 'utf8'),
  });

  const createMockDocument = (agentId: string, key: string, value: string) => ({
    id: 'test-id-123',
    agentId,
    key,
    value,
    embedding: [0.1, 0.2, 0.3],
    level: MemoryLevel.L3_DISK,
    status: PageStatus.IDLE,
    accessCount: 1,
    lastAccessedAt: new Date('2024-01-01T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    size: Buffer.byteLength(value, 'utf8'),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    store = new MongoDBPageStore({
      uri: 'mongodb://localhost:27017',
      dbName: 'test_db',
      collectionName: 'test_collection',
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const mongoose = require('mongoose');

      await store.initialize();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017');
    });

    it('should throw error on connection failure', async () => {
      const mongoose = require('mongoose');
      mongoose.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(store.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('Store Page (REQ-MEM-011)', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new MongoDBPageStore();
      const page = createTestPage('agent-1', 'key1', 'test value');

      await expect(uninitializedStore.storePage(page)).rejects.toThrow('MongoDB not initialized');
    });

    it('should store page successfully', async () => {
      const page = createTestPage('agent-1', 'key1', 'test value');

      await store.storePage(page);

      expect(MockModel).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle store errors', async () => {
      mockSave.mockRejectedValueOnce(new Error('Save error'));
      const page = createTestPage('agent-1', 'key1', 'test value');

      await expect(store.storePage(page)).rejects.toThrow('Save error');
    });
  });

  describe('Get Page', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new MongoDBPageStore();

      await expect(uninitializedStore.getPage('agent-1', 'key1')).rejects.toThrow(
        'MongoDB not initialized',
      );
    });

    it('should return null for non-existent page', async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await store.getPage('agent-1', 'nonexistent');

      expect(result).toBeNull();
    });

    it('should return page for existing key', async () => {
      const mockDoc = createMockDocument('agent-1', 'key1', 'test value');
      mockFindOne.mockResolvedValue(mockDoc);

      const result = await store.getPage('agent-1', 'key1');

      expect(result).not.toBeNull();
      expect(result?.value).toBe('test value');
    });

    it('should return null on error', async () => {
      mockFindOne.mockRejectedValueOnce(new Error('Find error'));

      const result = await store.getPage('agent-1', 'key1');

      expect(result).toBeNull();
    });
  });

  describe('Update Page', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new MongoDBPageStore();
      const page = createTestPage('agent-1', 'key1', 'test value');

      await expect(uninitializedStore.updatePage(page)).rejects.toThrow('MongoDB not initialized');
    });

    it('should update page successfully', async () => {
      const page = createTestPage('agent-1', 'key1', 'updated value');

      await store.updatePage(page);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { agentId: 'agent-1', key: 'key1' },
        expect.any(Object),
      );
    });

    it('should handle update errors', async () => {
      mockUpdateOne.mockRejectedValueOnce(new Error('Update error'));
      const page = createTestPage('agent-1', 'key1', 'test value');

      await expect(store.updatePage(page)).rejects.toThrow('Update error');
    });
  });

  describe('Delete Page', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new MongoDBPageStore();

      await expect(uninitializedStore.deletePage('agent-1', 'key1')).rejects.toThrow(
        'MongoDB not initialized',
      );
    });

    it('should return true when page deleted', async () => {
      mockDeleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await store.deletePage('agent-1', 'key1');

      expect(result).toBe(true);
    });

    it('should return false when page not found', async () => {
      mockDeleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await store.deletePage('agent-1', 'nonexistent');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockDeleteOne.mockRejectedValueOnce(new Error('Delete error'));

      const result = await store.deletePage('agent-1', 'key1');

      expect(result).toBe(false);
    });
  });

  describe('Get Pages By Agent', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new MongoDBPageStore();

      await expect(uninitializedStore.getPagesByAgent('agent-1')).rejects.toThrow(
        'MongoDB not initialized',
      );
    });

    it('should return pages for agent', async () => {
      const mockDocs = [
        createMockDocument('agent-1', 'key1', 'value1'),
        createMockDocument('agent-1', 'key2', 'value2'),
      ];
      mockFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDocs),
        }),
      });

      const pages = await store.getPagesByAgent('agent-1');

      expect(pages).toHaveLength(2);
    });

    it('should return empty array on error', async () => {
      mockFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockRejectedValue(new Error('Find error')),
        }),
      });

      const pages = await store.getPagesByAgent('agent-1');

      expect(pages).toEqual([]);
    });
  });

  describe('Get Stats', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new MongoDBPageStore();

      await expect(uninitializedStore.getStats()).rejects.toThrow('MongoDB not initialized');
    });

    it('should return stats', async () => {
      mockCountDocuments.mockResolvedValue(42);
      mockAggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ _id: null, totalSize: 1000 }]),
      });

      const stats = await store.getStats();

      expect(stats.count).toBe(42);
      expect(stats.totalSize).toBe(1000);
    });

    it('should return zero totalSize when no documents', async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockAggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const stats = await store.getStats();

      expect(stats.count).toBe(0);
      expect(stats.totalSize).toBe(0);
    });

    it('should return default stats on error', async () => {
      mockCountDocuments.mockRejectedValueOnce(new Error('Count error'));

      const stats = await store.getStats();

      expect(stats.count).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('Clear', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should not throw if not initialized', async () => {
      const uninitializedStore = new MongoDBPageStore();

      await expect(uninitializedStore.clear()).resolves.not.toThrow();
    });

    it('should clear all documents', async () => {
      await store.clear();

      expect(mockDeleteMany).toHaveBeenCalledWith({});
    });

    it('should handle clear errors silently', async () => {
      mockDeleteMany.mockRejectedValueOnce(new Error('Delete error'));

      await expect(store.clear()).resolves.not.toThrow();
    });
  });

  describe('Disconnect', () => {
    it('should disconnect from MongoDB', async () => {
      const mongoose = require('mongoose');
      await store.initialize();

      await store.disconnect();

      expect(mongoose.disconnect).toHaveBeenCalled();
    });
  });
});
