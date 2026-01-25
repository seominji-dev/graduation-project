/**
 * Redis Client for L1 Cache
 * Fast in-memory storage for frequently accessed pages
 * REQ-MEM-012: High-speed cache for hot data
 */

import Redis from 'ioredis';
import { MemoryPage, MemoryLevel, PageStatus } from '../domain/models';

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

/**
 * Redis client wrapper for L1 cache operations
 */
export class RedisCacheStore {
  private client: Redis;
  private keyPrefix: string;
  private initialized: boolean = false;

  constructor(config: RedisConfig = {}) {
    this.client = new Redis({
      host: config.host || 'localhost',
      port: config.port || 6379,
      password: config.password,
      db: config.db || 0,
    });
    this.keyPrefix = config.keyPrefix || 'memory:';
  }

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    try {
      await this.client.ping();
      this.initialized = true;
      console.log('Redis initialized: L1 cache ready');
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  /**
   * Store memory page in Redis
   * Uses hash for structured data
   */
  async storePage(page: MemoryPage, ttl?: number): Promise<void> {
    if (!this.initialized) {
      throw new Error('Redis not initialized');
    }

    try {
      const key = this.getCompositeKey(page.agentId, page.key);
      const data = JSON.stringify({
        id: page.id,
        agentId: page.agentId,
        key: page.key,
        value: page.value,
        level: MemoryLevel.L1_CACHE,
        status: page.status,
        accessCount: page.accessCount,
        lastAccessedAt: page.lastAccessedAt.toISOString(),
        createdAt: page.createdAt.toISOString(),
        size: page.size,
        metadata: page.metadata,
      });

      // Store data
      await this.client.set(key, data);

      // Set TTL if provided
      if (ttl && ttl > 0) {
        await this.client.expire(key, Math.floor(ttl / 1000));
      }

      // Update agent's page list
      await this.client.sadd(this.getAgentPagesKey(page.agentId), key);
    } catch (error) {
      console.error('Failed to store page in Redis:', error);
      throw error;
    }
  }

  /**
   * Get page by agentId and key
   */
  async getPage(agentId: string, key: string): Promise<MemoryPage | null> {
    if (!this.initialized) {
      throw new Error('Redis not initialized');
    }

    try {
      const compositeKey = this.getCompositeKey(agentId, key);
      const data = await this.client.get(compositeKey);

      if (!data) {
        return null;
      }

      return this.parseMemoryPage(data);
    } catch (error) {
      console.error('Failed to get page from Redis:', error);
      return null;
    }
  }

  /**
   * Delete page from Redis
   */
  async deletePage(agentId: string, key: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Redis not initialized');
    }

    try {
      const compositeKey = this.getCompositeKey(agentId, key);
      const result = await this.client.del(compositeKey);

      // Remove from agent's page list
      await this.client.srem(this.getAgentPagesKey(agentId), compositeKey);

      return result > 0;
    } catch (error) {
      console.error('Failed to delete page from Redis:', error);
      return false;
    }
  }

  /**
   * Check if page exists
   */
  async hasPage(agentId: string, key: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Redis not initialized');
    }

    try {
      const compositeKey = this.getCompositeKey(agentId, key);
      return (await this.client.exists(compositeKey)) > 0;
    } catch (error) {
      console.error('Failed to check page in Redis:', error);
      return false;
    }
  }

  /**
   * Get all page keys for an agent
   */
  async getAgentPageKeys(agentId: string): Promise<string[]> {
    if (!this.initialized) {
      throw new Error('Redis not initialized');
    }

    try {
      const keys = await this.client.smembers(this.getAgentPagesKey(agentId));
      return keys.map(key => key.substring(this.keyPrefix.length));
    } catch (error) {
      console.error('Failed to get agent page keys:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(agentId?: string): Promise<{
    totalKeys: number;
    memoryUsage: number;
    agentKeys?: number;
  }> {
    if (!this.initialized) {
      throw new Error('Redis not initialized');
    }

    try {
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.*)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : '0B';

      let agentKeys: number | undefined;
      if (agentId) {
        agentKeys = await this.client.scard(this.getAgentPagesKey(agentId));
      }

      return {
        totalKeys: await this.client.dbsize(),
        memoryUsage: 0, // Parse memoryUsage if needed
        agentKeys,
      };
    } catch (error) {
      console.error('Failed to get Redis stats:', error);
      return { totalKeys: 0, memoryUsage: 0 };
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await this.client.flushdb();
    } catch (error) {
      console.error('Failed to clear Redis:', error);
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    await this.client.quit();
    this.initialized = false;
  }

  /**
   * Generate composite key
   */
  private getCompositeKey(agentId: string, key: string): string {
    return `${this.keyPrefix}${agentId}:${key}`;
  }

  /**
   * Get agent's page set key
   */
  private getAgentPagesKey(agentId: string): string {
    return `${this.keyPrefix}agent:${agentId}:pages`;
  }

  /**
   * Parse JSON data to MemoryPage
   */
  private parseMemoryPage(data: string): MemoryPage | null {
    try {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        level: MemoryLevel.L1_CACHE,
        lastAccessedAt: new Date(parsed.lastAccessedAt),
        createdAt: new Date(parsed.createdAt),
      };
    } catch (error) {
      console.error('Failed to parse MemoryPage:', error);
      return null;
    }
  }
}
