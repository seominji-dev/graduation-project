/**
 * Application Constants
 * Centralized configuration for hardcoded values
 */

// =============================================================================
// Server Configuration
// =============================================================================

/** Default HTTP server port */
export const DEFAULT_PORT = 3001;

// =============================================================================
// Redis Configuration
// =============================================================================

/** Default Redis host */
export const DEFAULT_REDIS_HOST = 'localhost';

/** Default Redis port */
export const DEFAULT_REDIS_PORT = 6379;

// =============================================================================
// MongoDB Configuration
// =============================================================================

/** Default MongoDB connection URI */
export const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/checkpointing';

// =============================================================================
// Checkpointing Configuration
// =============================================================================

/** Default checkpoint interval (in milliseconds) */
export const DEFAULT_CHECKPOINT_INTERVAL_MS = 30000; // 30 seconds

/** Maximum checkpoints to keep per agent */
export const DEFAULT_MAX_CHECKPOINTS_PER_AGENT = 10;

/** Maximum state size in bytes (10MB) */
export const DEFAULT_MAX_STATE_SIZE_BYTES = 10485760;

/**
 * Threshold for incremental checkpoint - if diff is this fraction or more
 * of total state size, use full checkpoint instead
 */
export const INCREMENTAL_CHECKPOINT_THRESHOLD = 0.5;

// =============================================================================
// Recovery Configuration
// =============================================================================

/** Maximum retry attempts for recovery operations */
export const DEFAULT_MAX_RETRIES = 3;

/** Base multiplier for exponential backoff (in milliseconds) */
export const EXPONENTIAL_BACKOFF_BASE_MS = 100;

// =============================================================================
// Storage Configuration
// =============================================================================

/** Default limit for checkpoint queries */
export const DEFAULT_CHECKPOINT_QUERY_LIMIT = 10;

/** Maximum save retries for checkpoint persistence */
export const MAX_CHECKPOINT_SAVE_RETRIES = 3;

// =============================================================================
// Ollama Configuration
// =============================================================================

/** Default Ollama base URL */
export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

/** Default Ollama model */
export const DEFAULT_OLLAMA_MODEL = 'llama3.2';

// =============================================================================
// Periodic Checkpoint Configuration
// =============================================================================

/** Interval divisor for important tasks (more frequent checkpoints) */
export const IMPORTANT_TASK_INTERVAL_DIVISOR = 2;
