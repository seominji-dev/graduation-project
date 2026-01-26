/**
 * Environment Configuration with Zod Schema Validation
 * Centralized environment variable management with type safety
 */

import { z } from 'zod';

// =============================================================================
// Environment Schema Definition
// =============================================================================

const envSchema = z.object({
  // Server Configuration
  PORT: z
    .string()
    .default('3001')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // MongoDB Configuration
  MONGODB_URI: z
    .string()
    .url()
    .default('mongodb://localhost:27017/deadlock_detector'),

  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .default('6379')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),
  REDIS_PASSWORD: z.string().optional(),

  // Socket.IO Configuration
  SOCKET_PORT: z
    .string()
    .default('3002')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),

  // Authentication Configuration
  API_KEY: z.string().min(32, 'API_KEY must be at least 32 characters for security'),
});

// =============================================================================
// Environment Validation
// =============================================================================

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:');
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      console.error('  - ' + path + ': ' + issue.message);
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
  mongodb: {
    uri: env.MONGODB_URI,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  socket: {
    port: env.SOCKET_PORT,
  },
  auth: {
    apiKey: env.API_KEY,
  },
} as const;

export type Config = typeof config;
