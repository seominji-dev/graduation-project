/**
 * ChromaDB Client Unit Tests
 * Tests for L2 vector storage implementation
 * REQ-MEM-008: Vector similarity search for context retrieval
 * REQ-MEM-009: Store semantic vectors for context
 * REQ-MEM-010: Retrieve context by semantic similarity
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

// Mock chromadb
const mockCollection = {
  add: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue({ ids: [], metadatas: [], documents: [] }),
  query: jest.fn().mockResolvedValue({ ids: [[]], metadatas: [[]], documents: [[]], distances: [[]] }),
  delete: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  count: jest.fn().mockResolvedValue(0),
};

const mockClient = {
  getCollection: jest.fn().mockResolvedValue(mockCollection),
  createCollection: jest.fn().mockResolvedValue(mockCollection),
  deleteCollection: jest.fn().mockResolvedValue(undefined),
};

jest.mock('chromadb', () => ({
  ChromaClient: jest.fn().mockImplementation(() => mockClient),
}));

import { ChromaDBVectorStore } from '../../../src/infrastructure/ChromaDBClient';
import { MemoryPage, MemoryLevel, PageStatus } from '../../../src/domain/models';

describe('ChromaDBVectorStore - Unit Tests', () => {
  let store: ChromaDBVectorStore;

  const createTestPage = (
    agentId: string,
    key: string,
    value: string,
    embedding: number[] = [0.1, 0.2, 0.3],
  ): MemoryPage => ({
    id: 'test-id-123',
    agentId,
    key,
    value,
    embedding,
    level: MemoryLevel.L2_VECTOR,
    status: PageStatus.ACTIVE,
    accessCount: 1,
    lastAccessedAt: new Date('2024-01-01T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    size: Buffer.byteLength(value, 'utf8'),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockClient.getCollection.mockResolvedValue(mockCollection);
    mockClient.createCollection.mockResolvedValue(mockCollection);
    mockCollection.add.mockResolvedValue(undefined);
    mockCollection.get.mockResolvedValue({ ids: [], metadatas: [], documents: [] });
    mockCollection.query.mockResolvedValue({ ids: [[]], metadatas: [[]], documents: [[]], distances: [[]] });
    mockCollection.delete.mockResolvedValue(undefined);
    mockCollection.update.mockResolvedValue(undefined);
    mockCollection.count.mockResolvedValue(0);
    
    store = new ChromaDBVectorStore({
      host: 'localhost',
      port: 8000,
      collectionName: 'test_collection',
    });
  });

  describe('Initialization', () => {
    it('should initialize with existing collection', async () => {
      await store.initialize();

      expect(mockClient.getCollection).toHaveBeenCalled();
    });

    it('should create collection if not exists', async () => {
      mockClient.getCollection.mockRejectedValueOnce(new Error('Collection not found'));

      await store.initialize();

      expect(mockClient.createCollection).toHaveBeenCalled();
    });

    it('should throw error on initialization failure', async () => {
      mockClient.getCollection.mockRejectedValueOnce(new Error('Connection failed'));
      mockClient.createCollection.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(store.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('Store Page (REQ-MEM-009)', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new ChromaDBVectorStore();
      const page = createTestPage('agent-1', 'key1', 'test value');

      await expect(uninitializedStore.storePage(page)).rejects.toThrow('ChromaDB not initialized');
    });

    it('should throw error if page has no embedding', async () => {
      const page = createTestPage('agent-1', 'key1', 'test value', []);

      await expect(store.storePage(page)).rejects.toThrow('Page must have embedding');
    });

    it('should store page with embedding', async () => {
      const page = createTestPage('agent-1', 'key1', 'test value');

      await store.storePage(page);

      expect(mockCollection.add).toHaveBeenCalledWith({
        ids: ['agent-1:key1'],
        embeddings: [page.embedding],
        metadatas: expect.any(Array),
        documents: ['test value'],
      });
    });

    it('should handle store errors', async () => {
      mockCollection.add.mockRejectedValueOnce(new Error('Storage error'));
      const page = createTestPage('agent-1', 'key1', 'test value');

      await expect(store.storePage(page)).rejects.toThrow('Storage error');
    });
  });

  describe('Get Page', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new ChromaDBVectorStore();

      await expect(uninitializedStore.getPage('agent-1', 'key1')).rejects.toThrow(
        'ChromaDB not initialized',
      );
    });

    it('should return null for non-existent page', async () => {
      mockCollection.get.mockResolvedValue({ ids: [], metadatas: [], documents: [] });

      const result = await store.getPage('agent-1', 'nonexistent');

      expect(result).toBeNull();
    });

    it('should return page for existing key', async () => {
      mockCollection.get.mockResolvedValue({
        ids: ['agent-1:key1'],
        metadatas: [{ agentId: 'agent-1', key: 'key1', status: PageStatus.ACTIVE }],
        documents: ['test value'],
        embeddings: [[0.1, 0.2, 0.3]],
      });

      const result = await store.getPage('agent-1', 'key1');

      expect(result).not.toBeNull();
      expect(result?.value).toBe('test value');
    });

    it('should return null on error', async () => {
      mockCollection.get.mockRejectedValueOnce(new Error('Get error'));

      const result = await store.getPage('agent-1', 'key1');

      expect(result).toBeNull();
    });
  });

  describe('Semantic Search (REQ-MEM-010)', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new ChromaDBVectorStore();

      await expect(
        uninitializedStore.semanticSearch('agent-1', [0.1, 0.2, 0.3], 5),
      ).rejects.toThrow('ChromaDB not initialized');
    });

    it('should return search results', async () => {
      mockCollection.query.mockResolvedValue({
        ids: [['agent-1:key1', 'agent-1:key2']],
        metadatas: [
          [
            { agentId: 'agent-1', key: 'key1', status: PageStatus.ACTIVE },
            { agentId: 'agent-1', key: 'key2', status: PageStatus.ACTIVE },
          ],
        ],
        documents: [['value1', 'value2']],
        embeddings: [[[0.1, 0.2], [0.3, 0.4]]],
        distances: [[0.1, 0.2]],
      });

      const results = await store.semanticSearch('agent-1', [0.1, 0.2, 0.3], 5);

      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBeCloseTo(0.9, 1);
    });

    it('should return empty array for no results', async () => {
      mockCollection.query.mockResolvedValue({
        ids: [[]],
        metadatas: [[]],
        documents: [[]],
        distances: [[]],
      });

      const results = await store.semanticSearch('agent-1', [0.1, 0.2, 0.3], 5);

      expect(results).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockCollection.query.mockRejectedValueOnce(new Error('Search error'));

      const results = await store.semanticSearch('agent-1', [0.1, 0.2, 0.3], 5);

      expect(results).toEqual([]);
    });
  });

  describe('Delete Page', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new ChromaDBVectorStore();

      await expect(uninitializedStore.deletePage('agent-1', 'key1')).rejects.toThrow(
        'ChromaDB not initialized',
      );
    });

    it('should delete page successfully', async () => {
      const result = await store.deletePage('agent-1', 'key1');

      expect(result).toBe(true);
      expect(mockCollection.delete).toHaveBeenCalledWith({ ids: ['agent-1:key1'] });
    });

    it('should return false on error', async () => {
      mockCollection.delete.mockRejectedValueOnce(new Error('Delete error'));

      const result = await store.deletePage('agent-1', 'key1');

      expect(result).toBe(false);
    });
  });

  describe('Update Page', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new ChromaDBVectorStore();
      const page = createTestPage('agent-1', 'key1', 'test value');

      await expect(uninitializedStore.updatePage(page)).rejects.toThrow('ChromaDB not initialized');
    });

    it('should throw error if page has no embedding', async () => {
      const page = createTestPage('agent-1', 'key1', 'test value', []);

      await expect(store.updatePage(page)).rejects.toThrow('Page must have embedding');
    });

    it('should update page successfully', async () => {
      const page = createTestPage('agent-1', 'key1', 'updated value');

      await store.updatePage(page);

      expect(mockCollection.update).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      mockCollection.update.mockRejectedValueOnce(new Error('Update error'));
      const page = createTestPage('agent-1', 'key1', 'test value');

      await expect(store.updatePage(page)).rejects.toThrow('Update error');
    });
  });

  describe('Get Stats', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new ChromaDBVectorStore();

      await expect(uninitializedStore.getStats()).rejects.toThrow('ChromaDB not initialized');
    });

    it('should return stats', async () => {
      mockCollection.count.mockResolvedValue(42);

      const stats = await store.getStats();

      expect(stats.count).toBe(42);
    });

    it('should return default stats on error', async () => {
      mockCollection.count.mockRejectedValueOnce(new Error('Count error'));

      const stats = await store.getStats();

      expect(stats.count).toBe(0);
    });
  });

  describe('Clear', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should not throw if not initialized', async () => {
      const uninitializedStore = new ChromaDBVectorStore();

      await expect(uninitializedStore.clear()).resolves.not.toThrow();
    });

    it('should clear and recreate collection', async () => {
      await store.clear();

      expect(mockClient.deleteCollection).toHaveBeenCalled();
      expect(mockClient.createCollection).toHaveBeenCalled();
    });

    it('should handle clear errors silently', async () => {
      mockClient.deleteCollection.mockRejectedValueOnce(new Error('Delete error'));

      await expect(store.clear()).resolves.not.toThrow();
    });
  });
});
