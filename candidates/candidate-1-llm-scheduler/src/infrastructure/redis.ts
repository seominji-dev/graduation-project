/**
 * Redis Connection Manager
 * Manages BullMQ Redis connection for queue system
 */

import Redis from 'ioredis';
import { config } from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('Redis');

class RedisManager {
  private client: Redis | null = null;
  private bullmqConnection: Redis | null = null;

  /**
   * Get or create Redis connection for general use
   */
  getConnection(): Redis {
    if (!this.client) {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

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
   * Get or create Redis connection for BullMQ
   * BullMQ requires maxRetriesPerRequest: null for workers
   */
  getBullMQConnection(): Redis {
    if (!this.bullmqConnection) {
      this.bullmqConnection = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
      });

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
