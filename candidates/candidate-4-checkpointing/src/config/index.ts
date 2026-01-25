/**
 * Configuration Management
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/checkpointing',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // Checkpointing
  checkpointing: {
    intervalMs: parseInt(process.env.CHECKPOINT_INTERVAL_MS || '30000', 10), // 30 seconds default
    maxCheckpointsPerAgent: parseInt(process.env.MAX_CHECKPOINTS_PER_AGENT || '10', 10),
    maxStateSizeBytes: parseInt(process.env.MAX_STATE_SIZE_BYTES || '10485760', 10), // 10MB default
    incrementalThreshold: 0.5, // Use full checkpoint if diff is 50% or more of total state
  },

  // Ollama
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2',
  },
};
