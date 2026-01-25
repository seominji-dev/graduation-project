/**
 * Application Configuration
 * Centralized configuration management with environment variable validation
 */

import { z } from 'zod';

// Environment schema validation
const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // MongoDB
  MONGODB_URI: z.string().default('mongodb://localhost:27017/llm-scheduler'),
  
  // LLM Provider
  LLM_PROVIDER: z.enum(['ollama', 'openai']).default('ollama'),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OPENAI_API_KEY: z.string().optional(),
  
  // Socket.io
  SOCKET_CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Export configuration object
export const config = {
  server: {
    port: parseInt(env.PORT),
    nodeEnv: env.NODE_ENV,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  mongodb: {
    uri: env.MONGODB_URI,
  },
  llm: {
    provider: env.LLM_PROVIDER,
    ollama: {
      baseUrl: env.OLLAMA_BASE_URL,
    },
    openai: {
      apiKey: env.OPENAI_API_KEY,
    },
  },
  socket: {
    corsOrigin: env.SOCKET_CORS_ORIGIN,
  },
} as const;
