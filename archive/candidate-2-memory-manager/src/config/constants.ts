/**
 * Application Constants
 * Centralized configuration for hardcoded values
 */

// =============================================================================
// L1 Cache (Redis) Constants
// =============================================================================

/** Default L1 cache capacity (number of pages) */
export const DEFAULT_L1_CAPACITY = 100;

/** Default L1 cache TTL (0 = no expiration) */
export const DEFAULT_L1_TTL = 0;

/** Default Redis port */
export const DEFAULT_REDIS_PORT = 6379;

/** Default Redis key prefix for memory pages */
export const DEFAULT_REDIS_KEY_PREFIX = 'memory:';

/** Default Redis database index */
export const DEFAULT_REDIS_DB = 0;

// =============================================================================
// L2 Vector Store (ChromaDB) Constants
// =============================================================================

/** Default ChromaDB port */
export const DEFAULT_CHROMA_PORT = 8000;

/** Default ChromaDB collection name */
export const DEFAULT_CHROMA_COLLECTION = 'agent_contexts';

/** Default number of results for semantic search (topK) */
export const DEFAULT_SEMANTIC_SEARCH_TOP_K = 5;

// =============================================================================
// L3 Storage (MongoDB) Constants
// =============================================================================

/** Default MongoDB database name */
export const DEFAULT_MONGODB_DB_NAME = 'memory_manager';

/** Default MongoDB collection name for archived contexts */
export const DEFAULT_MONGODB_COLLECTION_NAME = 'archived_contexts';

// =============================================================================
// Embedding Service Constants
// =============================================================================

/** Default Ollama embedding model */
export const DEFAULT_EMBEDDING_MODEL = 'nomic-embed-text';

/** Default Ollama base URL */
export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

// =============================================================================
// Statistics Constants
// =============================================================================

/** Smoothing factor (alpha) for exponential moving average of access time */
export const ACCESS_TIME_SMOOTHING_FACTOR = 0.2;

// =============================================================================
// Default Host Configuration
// =============================================================================

/** Default localhost address */
export const DEFAULT_HOST = 'localhost';

/** Default MongoDB connection URI */
export const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017';
