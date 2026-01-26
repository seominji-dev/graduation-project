/**
 * Tests for Redis Infrastructure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Create mock Redis client
const mockRedisClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  quit: vi.fn().mockResolvedValue(undefined),
  isOpen: true,
  on: vi.fn(),
  set: vi.fn().mockResolvedValue('OK'),
  get: vi.fn().mockResolvedValue(null),
  del: vi.fn().mockResolvedValue(1),
  publish: vi.fn().mockResolvedValue(1),
};

// Mock redis module before importing
vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedisClient),
}));

describe('Redis Infrastructure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisClient.isOpen = true;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Module Exports', () => {
    it('should export connectToRedis function', async () => {
      const module = await import('../../src/infrastructure/redis.js');
      expect(module.connectToRedis).toBeDefined();
      expect(typeof module.connectToRedis).toBe('function');
    });

    it('should export disconnectFromRedis function', async () => {
      const module = await import('../../src/infrastructure/redis.js');
      expect(module.disconnectFromRedis).toBeDefined();
      expect(typeof module.disconnectFromRedis).toBe('function');
    });

    it('should export getRedisClient function', async () => {
      const module = await import('../../src/infrastructure/redis.js');
      expect(module.getRedisClient).toBeDefined();
      expect(typeof module.getRedisClient).toBe('function');
    });

    it('should export cacheWFG function', async () => {
      const module = await import('../../src/infrastructure/redis.js');
      expect(module.cacheWFG).toBeDefined();
      expect(typeof module.cacheWFG).toBe('function');
    });

    it('should export getCachedWFG function', async () => {
      const module = await import('../../src/infrastructure/redis.js');
      expect(module.getCachedWFG).toBeDefined();
      expect(typeof module.getCachedWFG).toBe('function');
    });

    it('should export clearCachedWFG function', async () => {
      const module = await import('../../src/infrastructure/redis.js');
      expect(module.clearCachedWFG).toBeDefined();
      expect(typeof module.clearCachedWFG).toBe('function');
    });

    it('should export publishDeadlockEvent function', async () => {
      const module = await import('../../src/infrastructure/redis.js');
      expect(module.publishDeadlockEvent).toBeDefined();
      expect(typeof module.publishDeadlockEvent).toBe('function');
    });
  });

  describe('connectToRedis', () => {
    it('should be a function that accepts no parameters', async () => {
      const { connectToRedis } = await import('../../src/infrastructure/redis.js');
      expect(connectToRedis.length).toBe(0);
    });

    it('should return a promise', async () => {
      const { connectToRedis } = await import('../../src/infrastructure/redis.js');
      const result = connectToRedis();
      expect(result).toBeInstanceOf(Promise);
      // Wait for the mocked promise to resolve
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('disconnectFromRedis', () => {
    it('should be a function that accepts no parameters', async () => {
      const { disconnectFromRedis } = await import('../../src/infrastructure/redis.js');
      expect(disconnectFromRedis.length).toBe(0);
    });

    it('should return a promise', async () => {
      const { disconnectFromRedis } = await import('../../src/infrastructure/redis.js');
      const result = disconnectFromRedis();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('getRedisClient', () => {
    it('should be a function that accepts no parameters', async () => {
      const { getRedisClient } = await import('../../src/infrastructure/redis.js');
      expect(getRedisClient.length).toBe(0);
    });

    it('should return null or client object', async () => {
      const { getRedisClient } = await import('../../src/infrastructure/redis.js');
      const client = getRedisClient();
      expect(client === null || typeof client === 'object').toBe(true);
    });
  });

  describe('cacheWFG', () => {
    it('should accept a WaitForGraph parameter', async () => {
      const { cacheWFG } = await import('../../src/infrastructure/redis.js');
      expect(cacheWFG.length).toBe(1);
    });

    it('should handle null client gracefully', async () => {
      const { cacheWFG } = await import('../../src/infrastructure/redis.js');
      const mockGraph = {
        agents: new Map(),
        resources: new Map(),
        edges: [],
        lastUpdated: new Date(),
      };

      // Should not throw even if Redis is not connected
      await expect(cacheWFG(mockGraph)).resolves.not.toThrow();
    });
  });

  describe('getCachedWFG', () => {
    it('should be a function that accepts no parameters', async () => {
      const { getCachedWFG } = await import('../../src/infrastructure/redis.js');
      expect(getCachedWFG.length).toBe(0);
    });

    it('should return null or data', async () => {
      const { getCachedWFG } = await import('../../src/infrastructure/redis.js');
      const result = await getCachedWFG();
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('clearCachedWFG', () => {
    it('should be a function that accepts no parameters', async () => {
      const { clearCachedWFG } = await import('../../src/infrastructure/redis.js');
      expect(clearCachedWFG.length).toBe(0);
    });

    it('should handle null client gracefully', async () => {
      const { clearCachedWFG } = await import('../../src/infrastructure/redis.js');
      await expect(clearCachedWFG()).resolves.not.toThrow();
    });
  });

  describe('publishDeadlockEvent', () => {
    it('should accept a deadlockData parameter', async () => {
      const { publishDeadlockEvent } = await import('../../src/infrastructure/redis.js');
      expect(publishDeadlockEvent.length).toBe(1);
    });

    it('should handle null client gracefully', async () => {
      const { publishDeadlockEvent } = await import('../../src/infrastructure/redis.js');
      await expect(publishDeadlockEvent({})).resolves.not.toThrow();
    });
  });
});
