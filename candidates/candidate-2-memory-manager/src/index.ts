/**
 * Memory Manager - Main Entry Point
 * Hierarchical memory management for AI agents
 * OS Paging concepts applied to AI context management
 */

import { HierarchicalMemoryManager } from './managers/HierarchicalMemoryManager';
import { MemoryAccessRequest } from './domain/models';

// Export main components
export { HierarchicalMemoryManager } from './managers/HierarchicalMemoryManager';
export { MemoryPageLRUCache, LRUCache } from './managers/LRUCache';
export { RedisCacheStore } from './infrastructure/RedisClient';
export { ChromaDBVectorStore } from './infrastructure/ChromaDBClient';
export { MongoDBPageStore } from './infrastructure/MongoDBClient';
export { OllamaEmbeddingService } from './services/OllamaEmbeddingService';

// Export domain models
export {
  MemoryLevel,
  PageStatus,
  MemoryPage,
  PageTableEntry,
  MemoryAccessRequest,
  MemoryAccessResponse,
  MemoryManagerStats,
  LRUCacheConfig,
  VectorSearchRequest,
  VectorSearchResult,
} from './domain/models';

// Export schemas
export {
  MemoryPageSchema,
  PageTableEntrySchema,
  MemoryAccessRequestSchema,
  MemoryAccessResponseSchema,
  MemoryManagerStatsSchema,
  LRUCacheConfigSchema,
  VectorSearchRequestSchema,
  VectorSearchResultSchema,
} from './domain/models';
