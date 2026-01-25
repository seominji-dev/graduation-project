/**
 * Redis Client Unit Tests
 * Tests for L1 cache storage implementation
 * REQ-MEM-012: High-speed cache for hot data
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

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    scard: jest.fn().mockResolvedValue(0),
    dbsize: jest.fn().mockResolvedValue(0),
    info: jest.fn().mockResolvedValue('used_memory_human:1M'),
    flushdb: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
  }));
});

import { RedisCacheStore } from '../../../src/infrastructure/RedisClient';
import { MemoryPage, MemoryLevel, PageStatus } from '../../../src/domain/models';

describe('RedisCacheStore - Unit Tests', () => {
  let store: RedisCacheStore;
  let mockRedis: jest.Mocked<any>;

  const createTestPage = (agentId: string, key: string, value: string): MemoryPage => ({
    id: 'test-id-123',
    agentId,
    key,
    value,
    level: MemoryLevel.L1_CACHE,
    status: PageStatus.ACTIVE,
    accessCount: 1,
    lastAccessedAt: new Date('2024-01-01T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    size: Buffer.byteLength(value, 'utf8'),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const Redis = require('ioredis');
    store = new RedisCacheStore({
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test:',
    });
    mockRedis = (Redis as jest.Mock).mock.results[0].value;
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await store.initialize();

      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('should throw error if ping fails', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection refused'));

      await expect(store.initialize()).rejects.toThrow('Connection refused');
    });
  });

  describe('Store Page', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new RedisCacheStore();
      const page = createTestPage('agent-1', 'key1', 'test value');

      await expect(uninitializedStore.storePage(page)).rejects.toThrow('Redis not initialized');
    });

    it('should store page successfully', async () => {
      const page = createTestPage('agent-1', 'key1', 'test value');

      await store.storePage(page);

      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.sadd).toHaveBeenCalled();
    });

    it('should set TTL if provided', async () => {
      const page = createTestPage('agent-1', 'key1', 'test value');

      await store.storePage(page, 60000);

      expect(mockRedis.expire).toHaveBeenCalledWith(expect.any(String), 60);
    });

    it('should not set TTL if not provided', async () => {
      const page = createTestPage('agent-1', 'key1', 'test value');

      await store.storePage(page);

      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it('should handle store errors', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));
      const page = createTestPage('agent-1', 'key1', 'test value');

      await expect(store.storePage(page)).rejects.toThrow('Redis error');
    });
  });

  describe('Get Page', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new RedisCacheStore();

      await expect(uninitializedStore.getPage('agent-1', 'key1')).rejects.toThrow(
        'Redis not initialized',
      );
    });

    it('should return null for non-existent key', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await store.getPage('agent-1', 'nonexistent');

      expect(result).toBeNull();
    });

    it('should return parsed page for existing key', async () => {
      const pageData = {
        id: 'test-id',
        agentId: 'agent-1',
        key: 'key1',
        value: 'test value',
        status: PageStatus.ACTIVE,
        accessCount: 5,
        lastAccessedAt: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        size: 10,
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(pageData));

      const result = await store.getPage('agent-1', 'key1');

      expect(result).not.toBeNull();
      expect(result?.value).toBe('test value');
      expect(result?.level).toBe(MemoryLevel.L1_CACHE);
    });

    it('should return null on parse error', async () => {
      mockRedis.get.mockResolvedValue('invalid json');

      const result = await store.getPage('agent-1', 'key1');

      expect(result).toBeNull();
    });

    it('should return null on Redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await store.getPage('agent-1', 'key1');

      expect(result).toBeNull();
    });
  });

  describe('Delete Page', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new RedisCacheStore();

      await expect(uninitializedStore.deletePage('agent-1', 'key1')).rejects.toThrow(
        'Redis not initialized',
      );
    });

    it('should return true when page deleted', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await store.deletePage('agent-1', 'key1');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalled();
      expect(mockRedis.srem).toHaveBeenCalled();
    });

    it('should return false when page not found', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await store.deletePage('agent-1', 'nonexistent');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      const result = await store.deletePage('agent-1', 'key1');

      expect(result).toBe(false);
    });
  });

  describe('Has Page', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new RedisCacheStore();

      await expect(uninitializedStore.hasPage('agent-1', 'key1')).rejects.toThrow(
        'Redis not initialized',
      );
    });

    it('should return true when page exists', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await store.hasPage('agent-1', 'key1');

      expect(result).toBe(true);
    });

    it('should return false when page not exists', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await store.hasPage('agent-1', 'key1');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockRedis.exists.mockRejectedValue(new Error('Redis error'));

      const result = await store.hasPage('agent-1', 'key1');

      expect(result).toBe(false);
    });
  });

  describe('Get Agent Page Keys', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new RedisCacheStore();

      await expect(uninitializedStore.getAgentPageKeys('agent-1')).rejects.toThrow(
        'Redis not initialized',
      );
    });

    it('should return page keys for agent', async () => {
      mockRedis.smembers.mockResolvedValue(['test:agent-1:key1', 'test:agent-1:key2']);

      const keys = await store.getAgentPageKeys('agent-1');

      expect(keys).toHaveLength(2);
    });

    it('should return empty array on error', async () => {
      mockRedis.smembers.mockRejectedValue(new Error('Redis error'));

      const keys = await store.getAgentPageKeys('agent-1');

      expect(keys).toEqual([]);
    });
  });

  describe('Get Stats', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedStore = new RedisCacheStore();

      await expect(uninitializedStore.getStats()).rejects.toThrow('Redis not initialized');
    });

    it('should return stats', async () => {
      mockRedis.dbsize.mockResolvedValue(10);
      mockRedis.info.mockResolvedValue('used_memory_human:1.5M');

      const stats = await store.getStats();

      expect(stats.totalKeys).toBe(10);
    });

    it('should return stats with agent keys', async () => {
      mockRedis.dbsize.mockResolvedValue(10);
      mockRedis.scard.mockResolvedValue(5);

      const stats = await store.getStats('agent-1');

      expect(stats.agentKeys).toBe(5);
    });

    it('should return default stats on error', async () => {
      mockRedis.info.mockRejectedValue(new Error('Redis error'));

      const stats = await store.getStats();

      expect(stats.totalKeys).toBe(0);
    });
  });

  describe('Clear', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should not throw if not initialized', async () => {
      const uninitializedStore = new RedisCacheStore();

      await expect(uninitializedStore.clear()).resolves.not.toThrow();
    });

    it('should clear all data', async () => {
      await store.clear();

      expect(mockRedis.flushdb).toHaveBeenCalled();
    });

    it('should handle errors silently', async () => {
      mockRedis.flushdb.mockRejectedValue(new Error('Redis error'));

      await expect(store.clear()).resolves.not.toThrow();
    });
  });

  describe('Disconnect', () => {
    it('should disconnect from Redis', async () => {
      await store.initialize();
      await store.disconnect();

      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
