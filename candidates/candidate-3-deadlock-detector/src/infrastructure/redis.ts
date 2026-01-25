/**
 * Redis client for caching Wait-For Graph state
 */

import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';
import { WaitForGraph } from '../domain/models.js';

let redisClient: RedisClientType | null = null;

/**
 * Connect to Redis
 */
export async function connectToRedis(): Promise<void> {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisClient.on('connect', () => console.log('Connected to Redis'));

    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectFromRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Disconnected from Redis');
    } catch (error) {
      console.error('Redis disconnection error:', error);
      throw error;
    }
  }
}

/**
 * Get Redis client
 */
export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

/**
 * Cache Wait-For Graph in Redis
 */
export async function cacheWFG(graph: WaitForGraph): Promise<void> {
  if (!redisClient) {
    return;
  }

  try {
    const key = 'wfg:current';
    const data = {
      agents: Array.from(graph.agents.entries()),
      resources: Array.from(graph.resources.entries()),
      edges: graph.edges,
      lastUpdated: graph.lastUpdated.toISOString(),
    };
    
    await redisClient.set(key, JSON.stringify(data), { EX: 3600 });
  } catch (error) {
    console.error('Error caching WFG:', error);
  }
}

/**
 * Get cached Wait-For Graph from Redis
 */
export async function getCachedWFG(): Promise<any | null> {
  if (!redisClient) {
    return null;
  }

  try {
    const key = 'wfg:current';
    const data = await redisClient.get(key);
    
    if (data) {
      return JSON.parse(data);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached WFG:', error);
    return null;
  }
}

/**
 * Clear cached WFG
 */
export async function clearCachedWFG(): Promise<void> {
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.del('wfg:current');
  } catch (error) {
    console.error('Error clearing cached WFG:', error);
  }
}

/**
 * Publish deadlock detection event
 */
export async function publishDeadlockEvent(deadlockData: any): Promise<void> {
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.publish('deadlock-detected', JSON.stringify(deadlockData));
  } catch (error) {
    console.error('Error publishing deadlock event:', error);
  }
}
