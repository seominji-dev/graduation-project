/**
 * Application Constants
 * Centralized configuration for hardcoded values
 */

// =============================================================================
// Server Configuration
// =============================================================================

/** Default HTTP server port */
export const DEFAULT_PORT = 3001;

/** Default WebSocket server port */
export const DEFAULT_SOCKET_PORT = 3002;

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
export const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/deadlock_detector';

// =============================================================================
// Rollback Manager Constants
// =============================================================================

/** Maximum checkpoints to keep per agent */
export const DEFAULT_MAX_CHECKPOINTS_PER_AGENT = 10;

// =============================================================================
// Safety Checker Constants
// =============================================================================

/** Default resource request count */
export const DEFAULT_RESOURCE_REQUEST_COUNT = 1;

/** Default maximum resource demand assumption (current + 1) */
export const DEFAULT_MAX_DEMAND_OFFSET = 2;

// =============================================================================
// DFS Detection Constants
// =============================================================================

/** Initial discovery time for DFS traversal */
export const DFS_INITIAL_DISCOVERY_TIME = -1;

/** Initial low link value for DFS traversal */
export const DFS_INITIAL_LOW_LINK = -1;

// =============================================================================
// Victim Selection Constants
// =============================================================================

/** Milliseconds per second for age calculation */
export const MS_PER_SECOND = 1000;
