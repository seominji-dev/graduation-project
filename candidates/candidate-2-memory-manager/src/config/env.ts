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

  // Redis Configuration (L1 Cache)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .default('6379')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),
  REDIS_PASSWORD: z.string().optional(),

  // MongoDB Configuration (L3 Storage)
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017'),
  MONGODB_DB_NAME: z.string().default('memory_manager'),

  // ChromaDB Configuration (L2 Vector DB)
  CHROMADB_HOST: z.string().default('localhost'),
  CHROMADB_PORT: z
    .string()
    .default('8000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),

  // Ollama Configuration (Embeddings)
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_EMBEDDING_MODEL: z.string().default('nomic-embed-text'),

  // Memory Configuration
  L1_CACHE_SIZE: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  L2_COLLECTION_NAME: z.string().default('agent_contexts'),
  L3_COLLECTION_NAME: z.string().default('archived_contexts'),

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
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  mongodb: {
    uri: env.MONGODB_URI,
    dbName: env.MONGODB_DB_NAME,
  },
  chromadb: {
    host: env.CHROMADB_HOST,
    port: env.CHROMADB_PORT,
    url: 'http://' + env.CHROMADB_HOST + ':' + env.CHROMADB_PORT,
  },
  ollama: {
    baseUrl: env.OLLAMA_BASE_URL,
    embeddingModel: env.OLLAMA_EMBEDDING_MODEL,
  },
  memory: {
    l1CacheSize: env.L1_CACHE_SIZE,
    l2CollectionName: env.L2_COLLECTION_NAME,
    l3CollectionName: env.L3_COLLECTION_NAME,
  },
  auth: {
    apiKey: env.API_KEY,
  },
} as const;

export type Config = typeof config;
