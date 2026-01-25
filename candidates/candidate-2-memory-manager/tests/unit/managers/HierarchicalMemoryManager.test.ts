/**
 * Hierarchical Memory Manager Unit Tests
 * Tests for the three-tier memory hierarchy implementation
 * REQ-MEM-001: Three-tier hierarchy
 * REQ-MEM-004: Page fault handling
 * REQ-MEM-005: LRU eviction policy
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

// Mock all infrastructure dependencies
jest.mock('../../../src/infrastructure/RedisClient');
jest.mock('../../../src/infrastructure/ChromaDBClient');
jest.mock('../../../src/infrastructure/MongoDBClient');
jest.mock('../../../src/services/OllamaEmbeddingService');

import { HierarchicalMemoryManager } from '../../../src/managers/HierarchicalMemoryManager';
import { MemoryLevel, MemoryPage, PageStatus } from '../../../src/domain/models';

describe('HierarchicalMemoryManager - Unit Tests', () => {
  let manager: HierarchicalMemoryManager;
  let mockRedisStore: jest.Mocked<any>;
  let mockChromaStore: jest.Mocked<any>;
  let mockMongoStore: jest.Mocked<any>;
  let mockEmbeddingService: jest.Mocked<any>;

  const createTestPage = (
    agentId: string,
    key: string,
    value: string,
    level: MemoryLevel = MemoryLevel.L1_CACHE,
  ): MemoryPage => ({
    id: 'test-id',
    agentId,
    key,
    value,
    embedding: [0.1, 0.2, 0.3],
    level,
    status: PageStatus.ACTIVE,
    accessCount: 1,
    lastAccessedAt: new Date(),
    createdAt: new Date(),
    size: Buffer.byteLength(value, 'utf8'),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Get mocked constructors
    const { RedisCacheStore } = require('../../../src/infrastructure/RedisClient');
    const { ChromaDBVectorStore } = require('../../../src/infrastructure/ChromaDBClient');
    const { MongoDBPageStore } = require('../../../src/infrastructure/MongoDBClient');
    const { OllamaEmbeddingService } = require('../../../src/services/OllamaEmbeddingService');

    // Setup mock implementations
    mockRedisStore = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getPage: jest.fn().mockResolvedValue(null),
      storePage: jest.fn().mockResolvedValue(undefined),
      deletePage: jest.fn().mockResolvedValue(true),
      clear: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    mockChromaStore = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getPage: jest.fn().mockResolvedValue(null),
      storePage: jest.fn().mockResolvedValue(undefined),
      updatePage: jest.fn().mockResolvedValue(undefined),
      deletePage: jest.fn().mockResolvedValue(true),
      semanticSearch: jest.fn().mockResolvedValue([]),
      clear: jest.fn().mockResolvedValue(undefined),
    };

    mockMongoStore = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getPage: jest.fn().mockResolvedValue(null),
      storePage: jest.fn().mockResolvedValue(undefined),
      deletePage: jest.fn().mockResolvedValue(true),
      clear: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    mockEmbeddingService = {
      initialize: jest.fn().mockResolvedValue(undefined),
      generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    };

    // Setup constructor mocks
    RedisCacheStore.mockImplementation(() => mockRedisStore);
    ChromaDBVectorStore.mockImplementation(() => mockChromaStore);
    MongoDBPageStore.mockImplementation(() => mockMongoStore);
    OllamaEmbeddingService.mockImplementation(() => mockEmbeddingService);

    manager = new HierarchicalMemoryManager({
      l1Capacity: 3,
    });
  });

  describe('Initialization', () => {
    it('should initialize all memory levels', async () => {
      await manager.initialize();

      expect(mockRedisStore.initialize).toHaveBeenCalled();
      expect(mockChromaStore.initialize).toHaveBeenCalled();
      expect(mockMongoStore.initialize).toHaveBeenCalled();
      expect(mockEmbeddingService.initialize).toHaveBeenCalled();
    });

    it('should throw error if initialization fails', async () => {
      mockRedisStore.initialize.mockRejectedValue(new Error('Connection failed'));

      await expect(manager.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('Get Operations', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedManager = new HierarchicalMemoryManager();

      await expect(
        uninitializedManager.get({ agentId: 'agent-1', key: 'key1', operation: 'get' }),
      ).rejects.toThrow('Memory Manager not initialized');
    });

    it('should return L1 cache hit from in-memory cache', async () => {
      // First put a value
      await manager.put({
        agentId: 'agent-1',
        key: 'key1',
        value: 'test value',
        operation: 'put',
      });

      // Then get it
      const result = await manager.get({
        agentId: 'agent-1',
        key: 'key1',
        operation: 'get',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('test value');
      expect(result.level).toBe(MemoryLevel.L1_CACHE);
      expect(result.pageFault).toBe(false);
    });

    it('should return L1 Redis hit and promote to cache', async () => {
      const testPage = createTestPage('agent-1', 'key1', 'redis value');
      mockRedisStore.getPage.mockResolvedValue(testPage);

      const result = await manager.get({
        agentId: 'agent-1',
        key: 'key1',
        operation: 'get',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('redis value');
      expect(result.level).toBe(MemoryLevel.L1_CACHE);
      expect(result.pageFault).toBe(false);
    });

    it('should return L2 hit with page fault', async () => {
      const testPage = createTestPage('agent-1', 'key1', 'chroma value', MemoryLevel.L2_VECTOR);
      mockChromaStore.getPage.mockResolvedValue(testPage);

      const result = await manager.get({
        agentId: 'agent-1',
        key: 'key1',
        operation: 'get',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('chroma value');
      expect(result.level).toBe(MemoryLevel.L2_VECTOR);
      expect(result.pageFault).toBe(true);
    });

    it('should return L3 hit with page fault (REQ-MEM-004)', async () => {
      const testPage = createTestPage('agent-1', 'key1', 'mongo value', MemoryLevel.L3_DISK);
      mockMongoStore.getPage.mockResolvedValue(testPage);

      const result = await manager.get({
        agentId: 'agent-1',
        key: 'key1',
        operation: 'get',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('mongo value');
      expect(result.level).toBe(MemoryLevel.L3_DISK);
      expect(result.pageFault).toBe(true);
    });

    it('should return miss when key not found', async () => {
      const result = await manager.get({
        agentId: 'agent-1',
        key: 'nonexistent',
        operation: 'get',
      });

      expect(result.success).toBe(false);
      expect(result.pageFault).toBe(true);
      expect(result.message).toContain('not found');
    });

    it('should handle errors gracefully', async () => {
      mockRedisStore.getPage.mockRejectedValue(new Error('Redis error'));

      const result = await manager.get({
        agentId: 'agent-1',
        key: 'key1',
        operation: 'get',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error');
    });
  });

  describe('Put Operations', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedManager = new HierarchicalMemoryManager();

      await expect(
        uninitializedManager.put({ agentId: 'agent-1', key: 'key1', value: 'test', operation: 'put' }),
      ).rejects.toThrow('Memory Manager not initialized');
    });

    it('should return error if value is missing', async () => {
      const result = await manager.put({
        agentId: 'agent-1',
        key: 'key1',
        operation: 'put',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Value is required');
    });

    it('should store in all memory levels', async () => {
      const result = await manager.put({
        agentId: 'agent-1',
        key: 'key1',
        value: 'test value',
        operation: 'put',
      });

      expect(result.success).toBe(true);
      expect(result.level).toBe(MemoryLevel.L1_CACHE);
      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('test value');
      expect(mockRedisStore.storePage).toHaveBeenCalled();
      expect(mockChromaStore.storePage).toHaveBeenCalled();
      expect(mockMongoStore.storePage).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValue(new Error('Embedding failed'));

      const result = await manager.put({
        agentId: 'agent-1',
        key: 'key1',
        value: 'test value',
        operation: 'put',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error');
    });
  });

  describe('Delete Operations', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedManager = new HierarchicalMemoryManager();

      await expect(
        uninitializedManager.delete({ agentId: 'agent-1', key: 'key1', operation: 'delete' }),
      ).rejects.toThrow('Memory Manager not initialized');
    });

    it('should delete from all memory levels', async () => {
      const result = await manager.delete({
        agentId: 'agent-1',
        key: 'key1',
        operation: 'delete',
      });

      expect(result.success).toBe(true);
      expect(mockRedisStore.deletePage).toHaveBeenCalledWith('agent-1', 'key1');
      expect(mockChromaStore.deletePage).toHaveBeenCalledWith('agent-1', 'key1');
      expect(mockMongoStore.deletePage).toHaveBeenCalledWith('agent-1', 'key1');
    });

    it('should handle errors gracefully', async () => {
      mockRedisStore.deletePage.mockRejectedValue(new Error('Delete failed'));

      const result = await manager.delete({
        agentId: 'agent-1',
        key: 'key1',
        operation: 'delete',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error');
    });
  });

  describe('Semantic Search', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedManager = new HierarchicalMemoryManager();

      await expect(
        uninitializedManager.semanticSearch('agent-1', 'query'),
      ).rejects.toThrow('Memory Manager not initialized');
    });

    it('should perform semantic search', async () => {
      const testPage = createTestPage('agent-1', 'key1', 'relevant content');
      mockChromaStore.semanticSearch.mockResolvedValue([
        { page: testPage, similarity: 0.95 },
      ]);

      const results = await manager.semanticSearch('agent-1', 'test query', 5);

      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('test query');
      expect(mockChromaStore.semanticSearch).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBe(0.95);
    });

    it('should return empty array on error', async () => {
      mockChromaStore.semanticSearch.mockRejectedValue(new Error('Search failed'));

      const results = await manager.semanticSearch('agent-1', 'test query');

      expect(results).toEqual([]);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should return initial statistics', () => {
      const stats = manager.getStats();

      expect(stats.l1Size).toBe(0);
      expect(stats.totalAccesses).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should track accesses and hits', async () => {
      await manager.put({
        agentId: 'agent-1',
        key: 'key1',
        value: 'test',
        operation: 'put',
      });

      await manager.get({
        agentId: 'agent-1',
        key: 'key1',
        operation: 'get',
      });

      const stats = manager.getStats();

      expect(stats.totalAccesses).toBe(1);
      expect(stats.hits).toBe(1);
    });

    it('should track misses', async () => {
      await manager.get({
        agentId: 'agent-1',
        key: 'nonexistent',
        operation: 'get',
      });

      const stats = manager.getStats();

      expect(stats.totalAccesses).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('Clear and Shutdown', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should clear all memory levels', async () => {
      await manager.put({
        agentId: 'agent-1',
        key: 'key1',
        value: 'test',
        operation: 'put',
      });

      await manager.clear();

      expect(mockRedisStore.clear).toHaveBeenCalled();
      expect(mockChromaStore.clear).toHaveBeenCalled();
      expect(mockMongoStore.clear).toHaveBeenCalled();

      const stats = manager.getStats();
      expect(stats.totalAccesses).toBe(0);
    });

    it('should shutdown gracefully', async () => {
      await manager.shutdown();

      expect(mockRedisStore.disconnect).toHaveBeenCalled();
      expect(mockMongoStore.disconnect).toHaveBeenCalled();
    });
  });

  describe('LRU Eviction (REQ-MEM-005)', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should evict LRU page when cache is full', async () => {
      // Fill cache to capacity (3)
      for (let i = 1; i <= 3; i++) {
        await manager.put({
          agentId: 'agent-1',
          key: `key${i}`,
          value: `value${i}`,
          operation: 'put',
        });
      }

      // Add one more to trigger eviction
      await manager.put({
        agentId: 'agent-1',
        key: 'key4',
        value: 'value4',
        operation: 'put',
      });

      const stats = manager.getStats();

      // Eviction should have occurred
      expect(stats.evictions).toBeGreaterThanOrEqual(1);
    });
  });
});
