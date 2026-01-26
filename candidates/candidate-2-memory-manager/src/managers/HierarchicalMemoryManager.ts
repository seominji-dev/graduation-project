import {
  DEFAULT_L1_CAPACITY,
  DEFAULT_L1_TTL,
  DEFAULT_CHROMA_COLLECTION,
  DEFAULT_MONGODB_DB_NAME,
  DEFAULT_MONGODB_COLLECTION_NAME,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_HOST,
  DEFAULT_REDIS_PORT,
  DEFAULT_CHROMA_PORT,
  DEFAULT_MONGODB_URI,
  DEFAULT_OLLAMA_BASE_URL,
  ACCESS_TIME_SMOOTHING_FACTOR,
  DEFAULT_SEMANTIC_SEARCH_TOP_K,
} from '../config/constants.js';

/**
 * Hierarchical Memory Manager
 * Implements OS paging with three-tier memory hierarchy
 *
 * Architecture:
 * - L1 (Redis): Fast cache for frequently accessed pages
 * - L2 (ChromaDB): Semantic search for context retrieval
 * - L3 (MongoDB): Long-term storage for cold data
 *
 * REQ-MEM-001: Three-tier hierarchy for efficient memory management
 * REQ-MEM-004: Page fault handling when data not in cache
 * REQ-MEM-005: LRU eviction policy
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MemoryPage,
  PageStatus,
  MemoryLevel,
  MemoryAccessRequest,
  MemoryAccessResponse,
} from '../domain/models';
import { MemoryPageLRUCache } from './LRUCache';
import { RedisCacheStore } from '../infrastructure/RedisClient';
import { ChromaDBVectorStore } from '../infrastructure/ChromaDBClient';
import { MongoDBPageStore } from '../infrastructure/MongoDBClient';
import { OllamaEmbeddingService } from '../services/OllamaEmbeddingService';
import logger from '../utils/logger';

// Helper to format error messages
const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export interface HierarchicalMemoryConfig {
  // L1 Configuration
  l1Capacity?: number;
  l1Ttl?: number;

  // L2 Configuration
  l2CollectionName?: string;

  // L3 Configuration
  l3DbName?: string;
  l3CollectionName?: string;

  // Embedding Configuration
  embeddingModel?: string;

  // Infrastructure Configuration
  redisHost?: string;
  redisPort?: number;
  chromaHost?: string;
  chromaPort?: number;
  mongoUri?: string;
  ollamaBaseUrl?: string;
}

export interface MemoryManagerStats {
  l1Size: number;
  l1Capacity: number;
  l2Size: number;
  l3Size: number;
  totalAccesses: number;
  pageFaults: number;
  hits: number;
  misses: number;
  hitRate: number;
  averageAccessTime: number;
  evictions: number;
  promotions: number;
  demotions: number;
}

/**
 * Hierarchical Memory Manager
 * Core implementation of OS paging concepts applied to AI agent memory
 */
export class HierarchicalMemoryManager {
  private l1Cache: MemoryPageLRUCache;
  private l1Store: RedisCacheStore;
  private l2Store: ChromaDBVectorStore;
  private l3Store: MongoDBPageStore;
  private embeddingService: OllamaEmbeddingService;

  // Statistics tracking
  private stats: MemoryManagerStats;

  // Configuration
  private config: Required<HierarchicalMemoryConfig>;

  private initialized: boolean = false;

  constructor(config: HierarchicalMemoryConfig = {}) {
    this.config = {
      l1Capacity: config.l1Capacity ?? DEFAULT_L1_CAPACITY,
      l1Ttl: config.l1Ttl ?? DEFAULT_L1_TTL,
      l2CollectionName: config.l2CollectionName ?? DEFAULT_CHROMA_COLLECTION,
      l3DbName: config.l3DbName ?? DEFAULT_MONGODB_DB_NAME,
      l3CollectionName: config.l3CollectionName ?? DEFAULT_MONGODB_COLLECTION_NAME,
      embeddingModel: config.embeddingModel ?? DEFAULT_EMBEDDING_MODEL,
      redisHost: config.redisHost ?? DEFAULT_HOST,
      redisPort: config.redisPort ?? DEFAULT_REDIS_PORT,
      chromaHost: config.chromaHost ?? DEFAULT_HOST,
      chromaPort: config.chromaPort ?? DEFAULT_CHROMA_PORT,
      mongoUri: config.mongoUri ?? DEFAULT_MONGODB_URI,
      ollamaBaseUrl: config.ollamaBaseUrl ?? DEFAULT_OLLAMA_BASE_URL,
    };

    // Initialize components
    this.l1Cache = new MemoryPageLRUCache({ capacity: this.config.l1Capacity });
    this.l1Store = new RedisCacheStore({
      host: this.config.redisHost,
      port: this.config.redisPort,
    });
    this.l2Store = new ChromaDBVectorStore({
      host: this.config.chromaHost,
      port: this.config.chromaPort,
      collectionName: this.config.l2CollectionName,
    });
    this.l3Store = new MongoDBPageStore({
      uri: this.config.mongoUri,
      dbName: this.config.l3DbName,
      collectionName: this.config.l3CollectionName,
    });
    this.embeddingService = new OllamaEmbeddingService({
      baseUrl: this.config.ollamaBaseUrl,
      model: this.config.embeddingModel,
    });

    // Initialize statistics
    this.stats = {
      l1Size: 0,
      l1Capacity: this.config.l1Capacity,
      l2Size: 0,
      l3Size: 0,
      totalAccesses: 0,
      pageFaults: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      averageAccessTime: 0,
      evictions: 0,
      promotions: 0,
      demotions: 0,
    };
  }

  /**
   * Initialize all memory levels
   */
  async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.l1Store.initialize(),
        this.l2Store.initialize(),
        this.l3Store.initialize(),
        this.embeddingService.initialize(),
      ]);

      this.initialized = true;
      logger.info('Hierarchical Memory Manager initialized');
    } catch (error) {
      logger.error('Failed to initialize Hierarchical Memory Manager:', error);
      throw error;
    }
  }

  /**
   * Get value from memory hierarchy
   * Implements page fault handling and promotion
   * REQ-MEM-004: Page fault when data not in L1/L2
   */
  async get(request: MemoryAccessRequest): Promise<MemoryAccessResponse> {
    if (!this.initialized) {
      throw new Error('Memory Manager not initialized');
    }

    const startTime = Date.now();
    this.stats.totalAccesses++;

    try {
      // L1: Check fast cache first
      const l1Page = this.l1Cache.getPage(request.agentId, request.key);
      if (l1Page) {
        this.stats.hits++;
        this.updateAverageAccessTime(Date.now() - startTime);
        return {
          success: true,
          data: l1Page.value,
          level: MemoryLevel.L1_CACHE,
          accessTime: Date.now() - startTime,
          pageFault: false,
          message: 'L1 cache hit',
        };
      }

      // L1: Check Redis persistent cache
      const redisPage = await this.l1Store.getPage(request.agentId, request.key);
      if (redisPage) {
        // Promote to in-memory L1 cache
        this.l1Cache.putPage(redisPage);
        this.stats.hits++;
        this.stats.promotions++;
        this.updateAverageAccessTime(Date.now() - startTime);
        return {
          success: true,
          data: redisPage.value,
          level: MemoryLevel.L1_CACHE,
          accessTime: Date.now() - startTime,
          pageFault: false,
          message: 'L1 Redis hit, promoted to cache',
        };
      }

      // L2: Check vector database (semantic search)
      const l2Page = await this.l2Store.getPage(request.agentId, request.key);
      if (l2Page) {
        // Promote to L1
        await this.promoteToL1(l2Page);
        this.stats.hits++;
        this.stats.promotions++;
        this.updateAverageAccessTime(Date.now() - startTime);
        return {
          success: true,
          data: l2Page.value,
          level: MemoryLevel.L2_VECTOR,
          accessTime: Date.now() - startTime,
          pageFault: true,
          message: 'L2 hit, promoted to L1',
        };
      }

      // L3: Check long-term storage (page fault!)
      const l3Page = await this.l3Store.getPage(request.agentId, request.key);
      if (l3Page) {
        // Promote to L1 via L2
        await this.promoteToL2(l3Page);
        await this.promoteToL1(l3Page);
        this.stats.hits++;
        this.stats.pageFaults++;
        this.stats.promotions += 2;
        this.updateAverageAccessTime(Date.now() - startTime);
        return {
          success: true,
          data: l3Page.value,
          level: MemoryLevel.L3_DISK,
          accessTime: Date.now() - startTime,
          pageFault: true,
          message: 'L3 hit (page fault), promoted to L1',
        };
      }

      // Not found anywhere
      this.stats.misses++;
      this.updateAverageAccessTime(Date.now() - startTime);
      return {
        success: false,
        level: undefined,
        accessTime: Date.now() - startTime,
        pageFault: true,
        message: 'Key not found in any memory level',
      };
    } catch (error) {
      logger.error('Failed to get from memory:', error);
      this.stats.misses++;
      return {
        success: false,
        level: undefined,
        accessTime: Date.now() - startTime,
        pageFault: true,
        message: `Error: ${formatError(error)}`,
      };
    }
  }

  /**
   * Put value into memory hierarchy
   * Starts at L1, may demote to L2/L3 based on LRU
   */
  async put(request: MemoryAccessRequest): Promise<MemoryAccessResponse> {
    if (!this.initialized) {
      throw new Error('Memory Manager not initialized');
    }

    if (!request.value) {
      return {
        success: false,
        message: 'Value is required for put operation',
        accessTime: 0,
        pageFault: false,
      };
    }

    const startTime = Date.now();

    try {
      // Generate embedding for semantic search
      const embedding = await this.embeddingService.generateEmbedding(request.value);

      // Create memory page
      const page: MemoryPage = {
        id: uuidv4(),
        agentId: request.agentId,
        key: request.key,
        value: request.value,
        embedding,
        level: MemoryLevel.L1_CACHE,
        status: PageStatus.ACTIVE,
        accessCount: 1,
        lastAccessedAt: new Date(),
        createdAt: new Date(),
        size: Buffer.byteLength(request.value, 'utf8'),
        metadata: request.metadata,
      };

      // Store in L1 cache (may trigger eviction)
      await this.storeInL1(page);

      // Store in L2 for semantic search
      await this.l2Store.storePage(page);

      // Store in L3 for persistence
      await this.l3Store.storePage(page);

      this.updateAverageAccessTime(Date.now() - startTime);
      return {
        success: true,
        data: page.id,
        level: MemoryLevel.L1_CACHE,
        accessTime: Date.now() - startTime,
        pageFault: false,
        message: 'Stored in all memory levels',
      };
    } catch (error) {
      logger.error('Failed to put in memory:', error);
      return {
        success: false,
        accessTime: Date.now() - startTime,
        pageFault: false,
        message: `Error: ${formatError(error)}`,
      };
    }
  }

  /**
   * Delete from all memory levels
   */
  async delete(request: MemoryAccessRequest): Promise<MemoryAccessResponse> {
    if (!this.initialized) {
      throw new Error('Memory Manager not initialized');
    }

    const startTime = Date.now();

    try {
      // Delete from L1 cache
      this.l1Cache.deletePage(request.agentId, request.key);

      // Delete from all levels
      await Promise.all([
        this.l1Store.deletePage(request.agentId, request.key),
        this.l2Store.deletePage(request.agentId, request.key),
        this.l3Store.deletePage(request.agentId, request.key),
      ]);

      return {
        success: true,
        accessTime: Date.now() - startTime,
        pageFault: false,
        message: 'Deleted from all memory levels',
      };
    } catch (error) {
      logger.error('Failed to delete from memory:', error);
      return {
        success: false,
        accessTime: Date.now() - startTime,
        pageFault: false,
        message: `Error: ${formatError(error)}`,
      };
    }
  }

  /**
   * Semantic search across stored contexts
   * REQ-MEM-010: Retrieve context by semantic similarity
   */
  async semanticSearch(
    agentId: string,
    query: string,
    topK: number = DEFAULT_SEMANTIC_SEARCH_TOP_K,
  ): Promise<Array<{ key: string; value: string; similarity: number; level: MemoryLevel }>> {
    if (!this.initialized) {
      throw new Error('Memory Manager not initialized');
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Search in L2 (ChromaDB)
      const results = await this.l2Store.semanticSearch(agentId, queryEmbedding, topK);

      return results.map(r => ({
        key: r.page.key,
        value: r.page.value,
        similarity: r.similarity,
        level: r.page.level,
      }));
    } catch (error) {
      logger.error('Failed to perform semantic search:', error);
      return [];
    }
  }

  /**
   * Get memory manager statistics
   */
  getStats(): MemoryManagerStats {
    // Update current sizes
    this.stats.l1Size = this.l1Cache.getStats().size;
    this.stats.hitRate =
      this.stats.totalAccesses > 0 ? (this.stats.hits / this.stats.totalAccesses) * 100 : 0;

    return { ...this.stats };
  }

  /**
   * Clear all memory levels
   */
  async clear(): Promise<void> {
    this.l1Cache.clear();
    await Promise.all([this.l1Store.clear(), this.l2Store.clear(), this.l3Store.clear()]);

    // Reset statistics
    this.stats = {
      l1Size: 0,
      l1Capacity: this.config.l1Capacity,
      l2Size: 0,
      l3Size: 0,
      totalAccesses: 0,
      pageFaults: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      averageAccessTime: 0,
      evictions: 0,
      promotions: 0,
      demotions: 0,
    };
  }

  /**
   * Shutdown memory manager
   */
  async shutdown(): Promise<void> {
    await Promise.all([this.l1Store.disconnect(), this.l3Store.disconnect()]);
    this.initialized = false;
  }

  /**
   * Promote page to L1 cache
   */
  private async promoteToL1(page: MemoryPage): Promise<void> {
    page.level = MemoryLevel.L1_CACHE;
    page.status = PageStatus.ACTIVE;
    page.lastAccessedAt = new Date();
    await this.storeInL1(page);
  }

  /**
   * Promote page to L2
   */
  private async promoteToL2(page: MemoryPage): Promise<void> {
    page.level = MemoryLevel.L2_VECTOR;
    page.status = PageStatus.ACTIVE;
    await this.l2Store.updatePage(page);
  }

  /**
   * Store page in L1 with eviction handling
   * REQ-MEM-005: LRU eviction when capacity exceeded
   */
  private async storeInL1(page: MemoryPage): Promise<void> {
    // Check if we need to evict
    const cacheStats = this.l1Cache.getStats();
    if (cacheStats.size >= cacheStats.capacity) {
      // Evict LRU page
      const lru = this.l1Cache.getLRUPage();
      if (lru) {
        this.l1Cache.deletePage(lru.agentId, lru.key);
        this.stats.evictions++;
        this.stats.demotions++;

        // Demote to L2
        lru.page.level = MemoryLevel.L2_VECTOR;
        lru.page.status = PageStatus.IDLE;
        await this.l2Store.updatePage(lru.page);

        // Also remove from Redis L1
        await this.l1Store.deletePage(lru.agentId, lru.key);
      }
    }

    // Store in L1 cache and Redis
    this.l1Cache.putPage(page);
    await this.l1Store.storePage(page, this.config.l1Ttl > 0 ? this.config.l1Ttl : undefined);
  }

  /**
   * Update average access time (exponential moving average)
   */
  private updateAverageAccessTime(newTime: number): void {
    const alpha = ACCESS_TIME_SMOOTHING_FACTOR; // Smoothing factor
    if (this.stats.averageAccessTime === 0) {
      this.stats.averageAccessTime = newTime;
    } else {
      this.stats.averageAccessTime = alpha * newTime + (1 - alpha) * this.stats.averageAccessTime;
    }
  }
}
