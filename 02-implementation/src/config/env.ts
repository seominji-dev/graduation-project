/**
 * Environment Configuration with Zod Schema Validation
 * Centralized environment variable management with type safety
 */

import { z } from 'zod';

import { createLogger } from '../utils/logger';
const logger = createLogger('EnvConfig');
// =============================================================================
// Environment Schema Definition
// =============================================================================

const envSchema = z.object({
  // Server Configuration
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Redis Configuration (BullMQ)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .default('6379')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),
  REDIS_PASSWORD: z.string().optional(),

  // MongoDB Configuration
  MONGODB_URI: z
    .string()
    .url()
    .default('mongodb://localhost:27017/llm-scheduler'),

  // LLM Provider Configuration
  LLM_PROVIDER: z.enum(['ollama', 'openai']).default('ollama'),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OPENAI_API_KEY: z.string().optional(),

  // Socket.io Configuration
  SOCKET_CORS_ORIGIN: z.string().url().default('http://localhost:3000'),

  // Authentication Configuration
  API_KEY: z.string().min(32, 'API_KEY must be at least 32 characters for security'),
});

// =============================================================================
// Environment Validation
// =============================================================================

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.error('Environment validation failed:');
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      logger.error('  - ' + path + ': ' + issue.message);
    }
    throw new Error(
      'Invalid environment configuration:\n' +
        result.error.issues
          .map((i) => '  ' + i.path.join('.') + ': ' + i.message)
          .join('\n')
    );
  }

  return result.data;
}

// =============================================================================
// Exports
// =============================================================================

/** Validated environment variables */
export const env = validateEnv();

/** Environment variable types */
export type Env = z.infer<typeof envSchema>;

/** Configuration object derived from environment */
export const config = {
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
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
  auth: {
    apiKey: env.API_KEY,
  },
} as const;

export type Config = typeof config;
