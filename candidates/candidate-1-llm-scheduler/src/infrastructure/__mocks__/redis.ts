/**
 * Mock Redis Connection Manager for Unit Tests
 *
 * Provides mock Redis connections for BullMQ Queue and Worker
 */

import { EventEmitter } from 'events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('MockRedis');

class MockRedisConnection extends EventEmitter {
  status = 'ready';
  options = {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
  keyPrefix = 'bull';
  _client = this; // Reference to self for BullMQ internal use
  commands: Map<string, unknown> = new Map();

  duplicate() {
    return new MockRedisConnection();
  }
  async connect() {
    this.emit('connect');
    return this;
  }
  async disconnect() {
    this.status = 'closed';
    return 'OK';
  }
  async quit() {
    this.status = 'closed';
    return 'OK';
  }
  async get() {
    return null;
  }
  async set() {
    return 'OK';
  }
  async del() {
    return 1;
  }
  async exists() {
    return 0;
  }
  async incr() {
    return 1;
  }
  async decr() {
    return 0;
  }
  async expire() {
    return 1;
  }
  async ttl() {
    return -1;
  }
  async keys() {
    return [];
  }
  async flushdb() {
    return 'OK';
  }
  async ping() {
    return 'PONG';
  }
  // Server info method
  async info() {
    return 'redis_version:7.0.0';
  }
  // Stream methods for BullMQ
  async xadd() {
    return '1';
  }
  async xrange() {
    return [];
  }
  async xrevrange() {
    return [];
  }
  async xreadgroup() {
    return null;
  }
  async xack() {
    return 1;
  }
  async xgroup() {
    return 'OK';
  }
  async xtrim() {
    return 0;
  }
  async xlen() {
    return 0;
  }
  async xclaim() {
    return [];
  }
  // Lua script execution
  async eval() {
    return [];
  }
  // defineCommand for BullMQ Lua scripts
  defineCommand(name: string, definition: unknown) {
    // Store the command and create a method that can be called
    this.commands.set(name, definition);
    (this as Record<string, unknown>)[name] = async () => {
      // Return default values for common BullMQ commands
      if (name.includes('getCounts') || name.includes('count')) {
        return [0, 0, 0, 0]; // waiting, active, completed, failed
      }
      if (name.includes('move') || name.includes('add')) {
        return 1;
      }
      return [];
    };
  }
  // Transaction methods
  multi() {
    return {
      exec: async () => [],
      get: this.get,
      set: this.set,
      del: this.del,
      incr: this.incr,
      decr: this.decr,
    };
  }
  // Pipeline methods
  pipeline() {
    return {
      exec: async () => [],
      get: this.get,
      set: this.set,
      del: this.del,
    };
  }
  // Scan methods
  async scan() {
    return ['0', []];
  }
  // Hash methods
  async hget() {
    return null;
  }
  async hset() {
    return 1;
  }
  async hdel() {
    return 1;
  }
  async hgetall() {
    return {};
  }
  async hincrby() {
    return 1;
  }
  async hexists() {
    return 0;
  }
  async hlen() {
    return 0;
  }
  async hkeys() {
    return [];
  }
  async hvals() {
    return [];
  }
  async hsetnx() {
    return 1;
  }
  // Set methods
  async sadd() {
    return 1;
  }
  async srem() {
    return 1;
  }
  async smembers() {
    return [];
  }
  async sismember() {
    return 0;
  }
  // Sorted set methods (required for BullMQ)
  async zadd() {
    return 1;
  }
  async zrem() {
    return 1;
  }
  async zrange() {
    return [];
  }
  async zrangebyscore() {
    return [];
  }
  async zrevrange() {
    return [];
  }
  async zscore() {
    return null;
  }
  async zcard() {
    return 0;
  }
  async zcount() {
    return 0;
  }
  async zincrby() {
    return '1';
  }
  async zrank() {
    return null;
  }
  // Blocking operations for BullMQ workers
  async bzpopmin() {
    return null;
  }
  async bzpopmax() {
    return null;
  }
  async blpop() {
    return null;
  }
  async brpop() {
    return null;
  }
  async brpoplpush() {
    return null;
  }
  async blmove() {
    return null;
  }
  // List operations
  async lpush() {
    return 1;
  }
  async rpush() {
    return 1;
  }
  async lpop() {
    return null;
  }
  async rpop() {
    return null;
  }
  async lrange() {
    return [];
  }
  async llen() {
    return 0;
  }
  async lrem() {
    return 0;
  }
  async lmove() {
    return null;
  }
  // Additional BullMQ required methods
  async client() {
    return 'OK';
  }
  async time() {
    return [Date.now().toString(), '0'];
  }
  async script() {
    return 'OK';
  }
  async evalsha() {
    return [];
  }
  async scriptExists() {
    return [1];
  }
  async scriptLoad() {
    return 'mock-sha';
  }
}

class RedisManager {
  private client: MockRedisConnection | null = null;
  private bullmqConnection: MockRedisConnection | null = null;

  /**
   * Get or create mock Redis connection for general use
   */
  getConnection(): MockRedisConnection {
    if (!this.client) {
      this.client = new MockRedisConnection();
      this.client.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });
      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
      });
    }
    return this.client;
  }

  /**
   * Get or create mock Redis connection for BullMQ
   * BullMQ requires maxRetriesPerRequest: null for workers
   */
  getBullMQConnection(): MockRedisConnection {
    if (!this.bullmqConnection) {
      this.bullmqConnection = new MockRedisConnection();
      this.bullmqConnection.on('error', (err) => {
        logger.error('BullMQ Redis connection error:', err);
      });
      this.bullmqConnection.on('connect', () => {
        logger.info('BullMQ Redis connected successfully');
      });
    }
    return this.bullmqConnection;
  }

  /**
   * Close Redis connections
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
    if (this.bullmqConnection) {
      await this.bullmqConnection.quit();
      this.bullmqConnection = null;
    }
  }
}

// Export singleton instance
export const redisManager = new RedisManager();
