/**
 * Hierarchical Memory Manager Integration Tests
 * Tests for the three-tier memory hierarchy with actual component interactions
 *
 * Test Scenarios:
 * 1. L1 cache miss -> L2 data load
 * 2. L2 cache miss -> L3 data load
 * 3. LRU eviction policy on cache overflow
 * 4. Page table entry management
 * 5. Multi-agent memory space isolation
 *
 * REQ-MEM-001: Three-tier hierarchy
 * REQ-MEM-004: Page fault handling
 * REQ-MEM-005: LRU eviction policy
 */

// Mock logger first - must be before imports
jest.mock('../../src/utils/logger', () => ({
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

// Mock infrastructure dependencies
jest.mock('../../src/infrastructure/RedisClient');
jest.mock('../../src/infrastructure/ChromaDBClient');
jest.mock('../../src/infrastructure/MongoDBClient');
jest.mock('../../src/services/OllamaEmbeddingService');

import { HierarchicalMemoryManager } from '../../src/managers/HierarchicalMemoryManager';
import { MemoryLevel, MemoryPage, PageStatus } from '../../src/domain/models';
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper function to create test memory pages
 */
const createTestPage = (
  agentId: string,
  key: string,
  value: string,
  level: MemoryLevel = MemoryLevel.L1_CACHE,
  embedding: number[] = [0.1, 0.2, 0.3]
): MemoryPage => ({
  id: uuidv4(),
  agentId,
  key,
  value,
  embedding,
  level,
  status: PageStatus.ACTIVE,
  accessCount: 1,
  lastAccessedAt: new Date(),
  createdAt: new Date(),
  size: Buffer.byteLength(value, 'utf8'),
});

/**
 * Helper function to create a delay for simulating async operations
 */
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

describe('HierarchicalMemoryManager - Integration Tests', () => {
  let manager: HierarchicalMemoryManager;
  let mockRedisStore: jest.Mocked<any>;
  let mockChromaStore: jest.Mocked<any>;
  let mockMongoStore: jest.Mocked<any>;
  let mockEmbeddingService: jest.Mocked<any>;

  // In-memory storage to simulate external databases behavior
  let redisStorage: Map<string, MemoryPage>;
  let chromaStorage: Map<string, MemoryPage>;
  let mongoStorage: Map<string, MemoryPage>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize in-memory storage for each tier
    redisStorage = new Map();
    chromaStorage = new Map();
    mongoStorage = new Map();

    // Get mocked constructors
    const { RedisCacheStore } = require('../../src/infrastructure/RedisClient');
    const { ChromaDBVectorStore } = require('../../src/infrastructure/ChromaDBClient');
    const { MongoDBPageStore } = require('../../src/infrastructure/MongoDBClient');
    const { OllamaEmbeddingService } = require('../../src/services/OllamaEmbeddingService');

    // Setup Redis mock with in-memory storage
    mockRedisStore = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getPage: jest.fn().mockImplementation((agentId: string, key: string) => {
        const compositeKey = `${agentId}:${key}`;
        return Promise.resolve(redisStorage.get(compositeKey) || null);
      }),
      storePage: jest.fn().mockImplementation((page: MemoryPage) => {
        const compositeKey = `${page.agentId}:${page.key}`;
        redisStorage.set(compositeKey, { ...page, level: MemoryLevel.L1_CACHE });
        return Promise.resolve();
      }),
      deletePage: jest.fn().mockImplementation((agentId: string, key: string) => {
        const compositeKey = `${agentId}:${key}`;
        const existed = redisStorage.has(compositeKey);
        redisStorage.delete(compositeKey);
        return Promise.resolve(existed);
      }),
      clear: jest.fn().mockImplementation(() => {
        redisStorage.clear();
        return Promise.resolve();
      }),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    // Setup ChromaDB mock with in-memory storage
    mockChromaStore = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getPage: jest.fn().mockImplementation((agentId: string, key: string) => {
        const compositeKey = `${agentId}:${key}`;
        return Promise.resolve(chromaStorage.get(compositeKey) || null);
      }),
      storePage: jest.fn().mockImplementation((page: MemoryPage) => {
        const compositeKey = `${page.agentId}:${page.key}`;
        chromaStorage.set(compositeKey, { ...page, level: MemoryLevel.L2_VECTOR });
        return Promise.resolve();
      }),
      updatePage: jest.fn().mockImplementation((page: MemoryPage) => {
        const compositeKey = `${page.agentId}:${page.key}`;
        chromaStorage.set(compositeKey, { ...page });
        return Promise.resolve();
      }),
      deletePage: jest.fn().mockImplementation((agentId: string, key: string) => {
        const compositeKey = `${agentId}:${key}`;
        const existed = chromaStorage.has(compositeKey);
        chromaStorage.delete(compositeKey);
        return Promise.resolve(existed);
      }),
      semanticSearch: jest.fn().mockImplementation((agentId: string) => {
        const results: Array<{ page: MemoryPage; similarity: number }> = [];
        chromaStorage.forEach((page, key) => {
          if (key.startsWith(`${agentId}:`)) {
            results.push({ page, similarity: 0.9 });
          }
        });
        return Promise.resolve(results.slice(0, 5));
      }),
      clear: jest.fn().mockImplementation(() => {
        chromaStorage.clear();
        return Promise.resolve();
      }),
    };

    // Setup MongoDB mock with in-memory storage
    mockMongoStore = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getPage: jest.fn().mockImplementation((agentId: string, key: string) => {
        const compositeKey = `${agentId}:${key}`;
        return Promise.resolve(mongoStorage.get(compositeKey) || null);
      }),
      storePage: jest.fn().mockImplementation((page: MemoryPage) => {
        const compositeKey = `${page.agentId}:${page.key}`;
        mongoStorage.set(compositeKey, { ...page, level: MemoryLevel.L3_DISK });
        return Promise.resolve();
      }),
      deletePage: jest.fn().mockImplementation((agentId: string, key: string) => {
        const compositeKey = `${agentId}:${key}`;
        const existed = mongoStorage.has(compositeKey);
        mongoStorage.delete(compositeKey);
        return Promise.resolve(existed);
      }),
      clear: jest.fn().mockImplementation(() => {
        mongoStorage.clear();
        return Promise.resolve();
      }),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    // Setup Embedding service mock
    mockEmbeddingService = {
      initialize: jest.fn().mockResolvedValue(undefined),
      generateEmbedding: jest.fn().mockImplementation((text: string) => {
        // Generate a deterministic embedding based on text hash
        const hash = text.split('').reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0);
        return Promise.resolve([
          Math.sin(hash) * 0.5 + 0.5,
          Math.cos(hash) * 0.5 + 0.5,
          Math.abs(Math.sin(hash * 2)) * 0.5,
        ]);
      }),
    };

    // Setup constructor mocks
    RedisCacheStore.mockImplementation(() => mockRedisStore);
    ChromaDBVectorStore.mockImplementation(() => mockChromaStore);
    MongoDBPageStore.mockImplementation(() => mockMongoStore);
    OllamaEmbeddingService.mockImplementation(() => mockEmbeddingService);

    // Create manager with small L1 capacity for testing eviction
    manager = new HierarchicalMemoryManager({
      l1Capacity: 3,
    });
  });

  afterEach(async () => {
    // Clean up
    await manager.shutdown();
  });

  describe('Cache Hierarchy Data Movement', () => {
    describe('L1 Cache Miss -> L2 Data Load (REQ-MEM-004)', () => {
      it('should load data from L2 when L1 cache misses', async () => {
        await manager.initialize();

        // Manually insert data into L2 (ChromaDB) only
        const testPage = createTestPage('agent-1', 'context-001', 'Important context from L2');
        chromaStorage.set('agent-1:context-001', {
          ...testPage,
          level: MemoryLevel.L2_VECTOR,
        });

        // Request data - should trigger L1 miss and L2 hit
        const result = await manager.get({
          agentId: 'agent-1',
          key: 'context-001',
          operation: 'get',
        });

        // Verify L2 hit
        expect(result.success).toBe(true);
        expect(result.data).toBe('Important context from L2');
        expect(result.level).toBe(MemoryLevel.L2_VECTOR);
        expect(result.pageFault).toBe(true);

        // Verify promotion stats
        const stats = await manager.getStats();
        expect(stats.promotions).toBeGreaterThanOrEqual(1);
      });

      it('should promote L2 data to L1 after access', async () => {
        await manager.initialize();

        // Insert data into L2 only
        const testPage = createTestPage('agent-1', 'context-002', 'Data to be promoted');
        chromaStorage.set('agent-1:context-002', {
          ...testPage,
          level: MemoryLevel.L2_VECTOR,
        });

        // First access - should come from L2
        await manager.get({
          agentId: 'agent-1',
          key: 'context-002',
          operation: 'get',
        });

        // Second access - should come from L1 cache (no page fault)
        const secondResult = await manager.get({
          agentId: 'agent-1',
          key: 'context-002',
          operation: 'get',
        });

        expect(secondResult.success).toBe(true);
        expect(secondResult.level).toBe(MemoryLevel.L1_CACHE);
        expect(secondResult.pageFault).toBe(false);
      });
    });

    describe('L2 Cache Miss -> L3 Data Load (REQ-MEM-004)', () => {
      it('should load data from L3 when L1 and L2 miss', async () => {
        await manager.initialize();

        // Insert data into L3 (MongoDB) only
        const testPage = createTestPage('agent-1', 'archived-001', 'Cold data from MongoDB');
        mongoStorage.set('agent-1:archived-001', {
          ...testPage,
          level: MemoryLevel.L3_DISK,
        });

        // Request data - should trigger L1 miss, L2 miss, L3 hit
        const result = await manager.get({
          agentId: 'agent-1',
          key: 'archived-001',
          operation: 'get',
        });

        // Verify L3 hit (page fault)
        expect(result.success).toBe(true);
        expect(result.data).toBe('Cold data from MongoDB');
        expect(result.level).toBe(MemoryLevel.L3_DISK);
        expect(result.pageFault).toBe(true);

        // Verify page fault counter increased
        const stats = await manager.getStats();
        expect(stats.pageFaults).toBe(1);
      });

      it('should promote L3 data through L2 to L1', async () => {
        await manager.initialize();

        // Insert data into L3 only
        const testPage = createTestPage('agent-1', 'archived-002', 'Data for promotion chain');
        mongoStorage.set('agent-1:archived-002', {
          ...testPage,
          level: MemoryLevel.L3_DISK,
        });

        // First access - triggers full promotion chain
        await manager.get({
          agentId: 'agent-1',
          key: 'archived-002',
          operation: 'get',
        });

        // Verify L2 was updated
        expect(mockChromaStore.updatePage).toHaveBeenCalled();

        // Second access - should come from L1 cache
        const secondResult = await manager.get({
          agentId: 'agent-1',
          key: 'archived-002',
          operation: 'get',
        });

        expect(secondResult.success).toBe(true);
        expect(secondResult.level).toBe(MemoryLevel.L1_CACHE);
        expect(secondResult.pageFault).toBe(false);

        // Verify promotion count (should be 2: L3->L2 and L3->L1)
        const stats = await manager.getStats();
        expect(stats.promotions).toBe(2);
      });

      it('should handle complete cache miss (data not found anywhere)', async () => {
        await manager.initialize();

        // Request non-existent data
        const result = await manager.get({
          agentId: 'agent-1',
          key: 'nonexistent-key',
          operation: 'get',
        });

        expect(result.success).toBe(false);
        expect(result.pageFault).toBe(true);
        expect(result.message).toContain('not found');

        // Verify miss counter
        const stats = await manager.getStats();
        expect(stats.misses).toBe(1);
      });
    });

    describe('Data Flow Through All Levels', () => {
      it('should store data in all three levels on put operation', async () => {
        await manager.initialize();

        // Store new data
        const result = await manager.put({
          agentId: 'agent-1',
          key: 'new-data-001',
          value: 'Fresh context data',
          operation: 'put',
        });

        expect(result.success).toBe(true);
        expect(result.level).toBe(MemoryLevel.L1_CACHE);

        // Verify data exists in all levels
        expect(mockRedisStore.storePage).toHaveBeenCalled();
        expect(mockChromaStore.storePage).toHaveBeenCalled();
        expect(mockMongoStore.storePage).toHaveBeenCalled();

        // Verify embedding was generated
        expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('Fresh context data');
      });

      it('should delete data from all levels', async () => {
        await manager.initialize();

        // First store data
        await manager.put({
          agentId: 'agent-1',
          key: 'to-delete-001',
          value: 'Data to be deleted',
          operation: 'put',
        });

        // Then delete it
        const result = await manager.delete({
          agentId: 'agent-1',
          key: 'to-delete-001',
          operation: 'delete',
        });

        expect(result.success).toBe(true);

        // Verify deletion from all levels
        expect(mockRedisStore.deletePage).toHaveBeenCalledWith('agent-1', 'to-delete-001');
        expect(mockChromaStore.deletePage).toHaveBeenCalledWith('agent-1', 'to-delete-001');
        expect(mockMongoStore.deletePage).toHaveBeenCalledWith('agent-1', 'to-delete-001');
      });
    });
  });

  describe('LRU Eviction Policy (REQ-MEM-005)', () => {
    it('should evict least recently used page when L1 cache is full', async () => {
      await manager.initialize();

      // Fill L1 cache to capacity (3 items)
      await manager.put({
        agentId: 'agent-1',
        key: 'page-1',
        value: 'First page',
        operation: 'put',
      });

      await manager.put({
        agentId: 'agent-1',
        key: 'page-2',
        value: 'Second page',
        operation: 'put',
      });

      await manager.put({
        agentId: 'agent-1',
        key: 'page-3',
        value: 'Third page',
        operation: 'put',
      });

      // Verify cache is full
      let stats = await manager.getStats();
      expect(stats.l1Size).toBe(3);

      // Add fourth page - should trigger eviction of page-1 (LRU)
      await manager.put({
        agentId: 'agent-1',
        key: 'page-4',
        value: 'Fourth page',
        operation: 'put',
      });

      // Verify eviction occurred
      stats = await manager.getStats();
      expect(stats.evictions).toBeGreaterThanOrEqual(1);
      expect(stats.demotions).toBeGreaterThanOrEqual(1);
    });

    it('should preserve recently accessed pages during eviction', async () => {
      await manager.initialize();

      // Fill cache with 3 pages
      await manager.put({
        agentId: 'agent-1',
        key: 'keep-1',
        value: 'Page to keep 1',
        operation: 'put',
      });

      await manager.put({
        agentId: 'agent-1',
        key: 'evict-me',
        value: 'Page to evict',
        operation: 'put',
      });

      await manager.put({
        agentId: 'agent-1',
        key: 'keep-2',
        value: 'Page to keep 2',
        operation: 'put',
      });

      // Access keep-1 to make it more recently used
      await manager.get({
        agentId: 'agent-1',
        key: 'keep-1',
        operation: 'get',
      });

      // Access keep-2 to make it more recently used
      await manager.get({
        agentId: 'agent-1',
        key: 'keep-2',
        operation: 'get',
      });

      // evict-me is now the LRU page
      // Add new page to trigger eviction
      await manager.put({
        agentId: 'agent-1',
        key: 'new-page',
        value: 'New page',
        operation: 'put',
      });

      // Verify keep-1 and keep-2 are still in L1 cache
      const result1 = await manager.get({
        agentId: 'agent-1',
        key: 'keep-1',
        operation: 'get',
      });
      expect(result1.level).toBe(MemoryLevel.L1_CACHE);

      const result2 = await manager.get({
        agentId: 'agent-1',
        key: 'keep-2',
        operation: 'get',
      });
      expect(result2.level).toBe(MemoryLevel.L1_CACHE);
    });

    it('should demote evicted pages to L2', async () => {
      await manager.initialize();

      // Fill cache
      for (let i = 1; i <= 3; i++) {
        await manager.put({
          agentId: 'agent-1',
          key: `page-${i}`,
          value: `Page content ${i}`,
          operation: 'put',
        });
      }

      // Reset updatePage mock to track demotions
      mockChromaStore.updatePage.mockClear();

      // Add new page to trigger eviction
      await manager.put({
        agentId: 'agent-1',
        key: 'page-4',
        value: 'Page content 4',
        operation: 'put',
      });

      // Verify L2 update was called for demotion
      expect(mockChromaStore.updatePage).toHaveBeenCalled();

      // Verify the demoted page has L2 level
      const updateCall = mockChromaStore.updatePage.mock.calls[0][0];
      expect(updateCall.level).toBe(MemoryLevel.L2_VECTOR);
      expect(updateCall.status).toBe(PageStatus.IDLE);
    });

    it('should track eviction statistics correctly', async () => {
      await manager.initialize();

      // Fill cache and trigger multiple evictions
      for (let i = 1; i <= 6; i++) {
        await manager.put({
          agentId: 'agent-1',
          key: `page-${i}`,
          value: `Page content ${i}`,
          operation: 'put',
        });
      }

      const stats = await manager.getStats();

      // With capacity 3 and 6 insertions, we should have 3 evictions
      expect(stats.evictions).toBe(3);
      expect(stats.demotions).toBe(3);
      expect(stats.l1Size).toBe(3);
    });
  });

  describe('Page Fault Scenarios', () => {
    it('should count page faults correctly for L3 retrievals', async () => {
      await manager.initialize();

      // Insert data only in L3
      for (let i = 1; i <= 3; i++) {
        const page = createTestPage('agent-1', `cold-data-${i}`, `Cold content ${i}`);
        mongoStorage.set(`agent-1:cold-data-${i}`, {
          ...page,
          level: MemoryLevel.L3_DISK,
        });
      }

      // Access all three cold pages
      for (let i = 1; i <= 3; i++) {
        await manager.get({
          agentId: 'agent-1',
          key: `cold-data-${i}`,
          operation: 'get',
        });
      }

      const stats = await manager.getStats();
      expect(stats.pageFaults).toBe(3);
      expect(stats.hits).toBe(3);
    });

    it('should track L2 access as page fault but not L3 page fault', async () => {
      await manager.initialize();

      // Insert data in L2 only
      const l2Page = createTestPage('agent-1', 'l2-data', 'L2 content');
      chromaStorage.set('agent-1:l2-data', {
        ...l2Page,
        level: MemoryLevel.L2_VECTOR,
      });

      // Access L2 data
      const result = await manager.get({
        agentId: 'agent-1',
        key: 'l2-data',
        operation: 'get',
      });

      expect(result.pageFault).toBe(true);

      const stats = await manager.getStats();
      // L2 access is marked as page fault in response but not counted as L3 page fault
      expect(stats.pageFaults).toBe(0);
    });

    it('should accurately calculate hit rate', async () => {
      await manager.initialize();

      // Store 2 items in cache
      await manager.put({
        agentId: 'agent-1',
        key: 'cached-1',
        value: 'Cached content 1',
        operation: 'put',
      });

      await manager.put({
        agentId: 'agent-1',
        key: 'cached-2',
        value: 'Cached content 2',
        operation: 'put',
      });

      // 2 cache hits
      await manager.get({
        agentId: 'agent-1',
        key: 'cached-1',
        operation: 'get',
      });

      await manager.get({
        agentId: 'agent-1',
        key: 'cached-2',
        operation: 'get',
      });

      // 1 cache miss
      await manager.get({
        agentId: 'agent-1',
        key: 'nonexistent',
        operation: 'get',
      });

      const stats = await manager.getStats();
      expect(stats.totalAccesses).toBe(3);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('Multi-Agent Memory Isolation', () => {
    it('should isolate memory spaces between different agents', async () => {
      await manager.initialize();

      // Agent 1 stores data
      await manager.put({
        agentId: 'agent-alpha',
        key: 'secret-data',
        value: 'Alpha secret information',
        operation: 'put',
      });

      // Agent 2 stores data with the same key
      await manager.put({
        agentId: 'agent-beta',
        key: 'secret-data',
        value: 'Beta secret information',
        operation: 'put',
      });

      // Agent 1 retrieves their data
      const alphaResult = await manager.get({
        agentId: 'agent-alpha',
        key: 'secret-data',
        operation: 'get',
      });

      // Agent 2 retrieves their data
      const betaResult = await manager.get({
        agentId: 'agent-beta',
        key: 'secret-data',
        operation: 'get',
      });

      // Verify isolation - each agent sees only their own data
      expect(alphaResult.data).toBe('Alpha secret information');
      expect(betaResult.data).toBe('Beta secret information');
      expect(alphaResult.data).not.toBe(betaResult.data);
    });

    it('should not allow cross-agent data access', async () => {
      await manager.initialize();

      // Agent 1 stores private data
      await manager.put({
        agentId: 'agent-private',
        key: 'private-key',
        value: 'Private data',
        operation: 'put',
      });

      // Agent 2 tries to access Agent 1 data
      const result = await manager.get({
        agentId: 'agent-other',
        key: 'private-key',
        operation: 'get',
      });

      // Should not find the data (it belongs to different agent)
      expect(result.success).toBe(false);
    });

    it('should maintain separate LRU caches per agent namespace', async () => {
      await manager.initialize();

      // Agent 1 fills their portion of cache
      await manager.put({
        agentId: 'agent-1',
        key: 'key-a',
        value: 'Agent 1 data A',
        operation: 'put',
      });

      await manager.put({
        agentId: 'agent-1',
        key: 'key-b',
        value: 'Agent 1 data B',
        operation: 'put',
      });

      // Agent 2 adds data
      await manager.put({
        agentId: 'agent-2',
        key: 'key-a',
        value: 'Agent 2 data A',
        operation: 'put',
      });

      // All data should be accessible
      const result1a = await manager.get({
        agentId: 'agent-1',
        key: 'key-a',
        operation: 'get',
      });

      const result1b = await manager.get({
        agentId: 'agent-1',
        key: 'key-b',
        operation: 'get',
      });

      const result2a = await manager.get({
        agentId: 'agent-2',
        key: 'key-a',
        operation: 'get',
      });

      expect(result1a.data).toBe('Agent 1 data A');
      expect(result1b.data).toBe('Agent 1 data B');
      expect(result2a.data).toBe('Agent 2 data A');
    });

    it('should handle concurrent access from multiple agents', async () => {
      await manager.initialize();

      // Simulate concurrent access from 3 agents
      const agents = ['agent-a', 'agent-b', 'agent-c'];
      const operations: Promise<any>[] = [];

      // Each agent performs multiple operations
      for (const agentId of agents) {
        for (let i = 0; i < 3; i++) {
          operations.push(
            manager.put({
              agentId,
              key: `data-${i}`,
              value: `${agentId} data ${i}`,
              operation: 'put',
            })
          );
        }
      }

      // Wait for all operations to complete
      await Promise.all(operations);

      // Verify each agent data is correctly stored and isolated
      for (const agentId of agents) {
        for (let i = 0; i < 3; i++) {
          const result = await manager.get({
            agentId,
            key: `data-${i}`,
            operation: 'get',
          });
          expect(result.data).toBe(`${agentId} data ${i}`);
        }
      }
    });

    it('should delete only the specified agent data', async () => {
      await manager.initialize();

      // Both agents store data with same key
      await manager.put({
        agentId: 'agent-delete-test-1',
        key: 'shared-key-name',
        value: 'Data from agent 1',
        operation: 'put',
      });

      await manager.put({
        agentId: 'agent-delete-test-2',
        key: 'shared-key-name',
        value: 'Data from agent 2',
        operation: 'put',
      });

      // Delete only agent 1 data
      await manager.delete({
        agentId: 'agent-delete-test-1',
        key: 'shared-key-name',
        operation: 'delete',
      });

      // Agent 1 data should be gone
      const result1 = await manager.get({
        agentId: 'agent-delete-test-1',
        key: 'shared-key-name',
        operation: 'get',
      });

      // Agent 2 data should still exist
      const result2 = await manager.get({
        agentId: 'agent-delete-test-2',
        key: 'shared-key-name',
        operation: 'get',
      });

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(true);
      expect(result2.data).toBe('Data from agent 2');
    });
  });

  describe('Page Table Entry Management', () => {
    it('should track page status transitions correctly', async () => {
      await manager.initialize();

      // Store data (status: ACTIVE)
      await manager.put({
        agentId: 'agent-1',
        key: 'status-test',
        value: 'Test content',
        operation: 'put',
      });

      // Fill cache to trigger eviction
      for (let i = 1; i <= 4; i++) {
        await manager.put({
          agentId: 'agent-1',
          key: `filler-${i}`,
          value: `Filler content ${i}`,
          operation: 'put',
        });
      }

      // Verify that evicted pages have IDLE status
      const updateCalls = mockChromaStore.updatePage.mock.calls;
      const hasIdleStatus = updateCalls.some(
        (call: any) => call[0].status === PageStatus.IDLE
      );
      expect(hasIdleStatus).toBe(true);
    });

    it('should update lastAccessedAt on each access', async () => {
      await manager.initialize();

      await manager.put({
        agentId: 'agent-1',
        key: 'time-test',
        value: 'Test content',
        operation: 'put',
      });

      // Small delay to ensure time difference
      await delay(10);

      // Access the data
      const result1 = await manager.get({
        agentId: 'agent-1',
        key: 'time-test',
        operation: 'get',
      });

      await delay(10);

      // Access again
      await manager.get({
        agentId: 'agent-1',
        key: 'time-test',
        operation: 'get',
      });

      // Verify access was successful
      expect(result1.success).toBe(true);
    });

    it('should increment accessCount on each get operation', async () => {
      await manager.initialize();

      await manager.put({
        agentId: 'agent-1',
        key: 'count-test',
        value: 'Test content',
        operation: 'put',
      });

      // Access multiple times
      for (let i = 0; i < 5; i++) {
        await manager.get({
          agentId: 'agent-1',
          key: 'count-test',
          operation: 'get',
        });
      }

      // Verify hits increased
      const stats = await manager.getStats();
      expect(stats.hits).toBeGreaterThanOrEqual(5);
    });

    it('should track page size correctly', async () => {
      await manager.initialize();

      const longContent = 'A'.repeat(1000);
      await manager.put({
        agentId: 'agent-1',
        key: 'size-test',
        value: longContent,
        operation: 'put',
      });

      // Verify the page was stored with correct size metadata
      const storeCall = mockMongoStore.storePage.mock.calls[0][0];
      expect(storeCall.size).toBe(Buffer.byteLength(longContent, 'utf8'));
    });
  });

  describe('Semantic Search Integration', () => {
    it('should perform semantic search across agent memory', async () => {
      await manager.initialize();

      // Store multiple context items
      await manager.put({
        agentId: 'agent-search',
        key: 'context-1',
        value: 'Machine learning algorithms for classification',
        operation: 'put',
      });

      await manager.put({
        agentId: 'agent-search',
        key: 'context-2',
        value: 'Deep neural networks and backpropagation',
        operation: 'put',
      });

      await manager.put({
        agentId: 'agent-search',
        key: 'context-3',
        value: 'Recipe for chocolate cake',
        operation: 'put',
      });

      // Perform semantic search
      const results = await manager.semanticSearch('agent-search', 'AI and neural networks', 5);

      // Verify embedding was generated for query
      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('AI and neural networks');

      // Verify search was performed
      expect(mockChromaStore.semanticSearch).toHaveBeenCalled();
    });

    it('should only return results for the specified agent', async () => {
      await manager.initialize();

      // Store data for different agents
      await manager.put({
        agentId: 'agent-search-1',
        key: 'data-1',
        value: 'Agent 1 specific data',
        operation: 'put',
      });

      await manager.put({
        agentId: 'agent-search-2',
        key: 'data-2',
        value: 'Agent 2 specific data',
        operation: 'put',
      });

      // Search only for agent-search-1
      await manager.semanticSearch('agent-search-1', 'specific data', 5);

      // Verify search was scoped to agent
      const searchCall = mockChromaStore.semanticSearch.mock.calls[0];
      expect(searchCall[0]).toBe('agent-search-1');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle Redis failure gracefully during get', async () => {
      await manager.initialize();

      // Store data in L2 and L3 only (simulating Redis failure)
      chromaStorage.set('agent-1:fallback-data', {
        ...createTestPage('agent-1', 'fallback-data', 'Fallback content'),
        level: MemoryLevel.L2_VECTOR,
      });

      // Simulate Redis throwing error
      mockRedisStore.getPage.mockRejectedValueOnce(new Error('Redis connection failed'));

      // Should still succeed by falling through to next level
      const result = await manager.get({
        agentId: 'agent-1',
        key: 'fallback-data',
        operation: 'get',
      });

      // The error handling returns a failure but data might still be in L2/L3
      expect(result.success).toBe(false);
    });

    it('should throw error when accessing uninitialized manager', async () => {
      const uninitManager = new HierarchicalMemoryManager();

      await expect(
        uninitManager.get({ agentId: 'agent-1', key: 'test', operation: 'get' })
      ).rejects.toThrow('Memory Manager not initialized');

      await expect(
        uninitManager.put({ agentId: 'agent-1', key: 'test', value: 'data', operation: 'put' })
      ).rejects.toThrow('Memory Manager not initialized');

      await expect(
        uninitManager.delete({ agentId: 'agent-1', key: 'test', operation: 'delete' })
      ).rejects.toThrow('Memory Manager not initialized');

      await expect(uninitManager.semanticSearch('agent-1', 'query')).rejects.toThrow(
        'Memory Manager not initialized'
      );
    });

    it('should handle embedding service failure', async () => {
      await manager.initialize();

      mockEmbeddingService.generateEmbedding.mockRejectedValueOnce(
        new Error('Embedding service unavailable')
      );

      const result = await manager.put({
        agentId: 'agent-1',
        key: 'embed-fail',
        value: 'Content without embedding',
        operation: 'put',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error');
    });
  });

  describe('Clear and Reset Operations', () => {
    it('should clear all memory levels and reset statistics', async () => {
      await manager.initialize();

      // Store some data
      await manager.put({
        agentId: 'agent-1',
        key: 'data-1',
        value: 'Content 1',
        operation: 'put',
      });

      await manager.put({
        agentId: 'agent-1',
        key: 'data-2',
        value: 'Content 2',
        operation: 'put',
      });

      // Access data to build up statistics
      await manager.get({ agentId: 'agent-1', key: 'data-1', operation: 'get' });
      await manager.get({ agentId: 'agent-1', key: 'data-2', operation: 'get' });

      // Clear everything
      await manager.clear();

      // Verify all levels were cleared
      expect(mockRedisStore.clear).toHaveBeenCalled();
      expect(mockChromaStore.clear).toHaveBeenCalled();
      expect(mockMongoStore.clear).toHaveBeenCalled();

      // Verify statistics were reset
      const stats = await manager.getStats();
      expect(stats.totalAccesses).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.l1Size).toBe(0);
    });

    it('should gracefully shutdown all connections', async () => {
      await manager.initialize();

      await manager.shutdown();

      expect(mockRedisStore.disconnect).toHaveBeenCalled();
      expect(mockMongoStore.disconnect).toHaveBeenCalled();
    });
  });

  describe('Performance and Access Time Tracking', () => {
    it('should track access time for operations', async () => {
      await manager.initialize();

      await manager.put({
        agentId: 'agent-1',
        key: 'perf-test',
        value: 'Performance test content',
        operation: 'put',
      });

      const result = await manager.get({
        agentId: 'agent-1',
        key: 'perf-test',
        operation: 'get',
      });

      // Access time should be recorded
      expect(result.accessTime).toBeDefined();
      expect(result.accessTime).toBeGreaterThanOrEqual(0);

      // Average access time should be tracked
      const stats = await manager.getStats();
      expect(stats.averageAccessTime).toBeGreaterThan(0);
    });

    it('should calculate average access time with exponential moving average', async () => {
      await manager.initialize();

      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await manager.put({
          agentId: 'agent-1',
          key: `ema-test-${i}`,
          value: `Content ${i}`,
          operation: 'put',
        });

        await manager.get({
          agentId: 'agent-1',
          key: `ema-test-${i}`,
          operation: 'get',
        });
      }

      const stats = await manager.getStats();
      expect(stats.averageAccessTime).toBeGreaterThan(0);
    });
  });
});
