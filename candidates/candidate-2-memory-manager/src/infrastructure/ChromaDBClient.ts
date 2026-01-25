/**
 * ChromaDB Client for L2 Vector Storage
 * Provides semantic search capabilities for agent context
 * REQ-MEM-008: Vector similarity search for context retrieval
 */

import { ChromaClient, Collection } from 'chromadb';
import { MemoryPage, MemoryLevel, PageStatus } from '../domain/models';

export interface ChromaDBConfig {
  host?: string;
  port?: number;
  collectionName?: string;
}

/**
 * ChromaDB client wrapper for vector storage operations
 */
export class ChromaDBVectorStore {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private collectionName: string;
  private initialized: boolean = false;

  constructor(config: ChromaDBConfig = {}) {
    const host = config.host ? `${config.host}:${config.port || 8000}` : undefined;
    this.client = new ChromaClient({ path: host });
    this.collectionName = config.collectionName || 'agent_contexts';
  }

  /**
   * Initialize ChromaDB connection and collection
   */
  async initialize(): Promise<void> {
    try {
      // Try to get existing collection
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName,
          embeddingFunction: undefined as any,
        });
      } catch (error) {
        // Collection doesn't exist, create it
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: { description: 'AI Agent Context Vectors' },
          embeddingFunction: undefined as any,
        });
      }

      this.initialized = true;
      console.log(`ChromaDB initialized: collection "${this.collectionName}"`);
    } catch (error) {
      console.error('Failed to initialize ChromaDB:', error);
      throw error;
    }
  }

  /**
   * Store memory page with vector embedding
   * REQ-MEM-009: Store semantic vectors for context
   */
  async storePage(page: MemoryPage): Promise<void> {
    if (!this.initialized || !this.collection) {
      throw new Error('ChromaDB not initialized');
    }

    if (!page.embedding || page.embedding.length === 0) {
      throw new Error('Page must have embedding for vector storage');
    }

    try {
      await this.collection.add({
        ids: [`${page.agentId}:${page.key}`],
        embeddings: [page.embedding],
        metadatas: [{
          agentId: page.agentId,
          key: page.key,
          level: MemoryLevel.L2_VECTOR,
          status: page.status,
          createdAt: page.createdAt.toISOString(),
          lastAccessedAt: page.lastAccessedAt.toISOString(),
          accessCount: page.accessCount,
          size: page.size,
        }],
        documents: [page.value],
      });
    } catch (error) {
      console.error('Failed to store page in ChromaDB:', error);
      throw error;
    }
  }

  /**
   * Get page by key
   */
  async getPage(agentId: string, key: string): Promise<MemoryPage | null> {
    if (!this.initialized || !this.collection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      const result = await this.collection.get({
        ids: [`${agentId}:${key}`],
      });

      if (result.ids.length === 0) {
        return null;
      }

      return this.toMemoryPage(result);
    } catch (error) {
      console.error('Failed to get page from ChromaDB:', error);
      return null;
    }
  }

  /**
   * Semantic search by query embedding
   * REQ-MEM-010: Retrieve context by semantic similarity
   */
  async semanticSearch(
    agentId: string,
    queryEmbedding: number[],
    topK: number = 5
  ): Promise<Array<{ page: MemoryPage; similarity: number }>> {
    if (!this.initialized || !this.collection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      const result = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
        where: {
          agentId: agentId,
        },
      });

      const results: Array<{ page: MemoryPage; similarity: number }> = [];

      if (result.ids[0]) {
        for (let i = 0; i < result.ids[0].length; i++) {
          const id = String(result.ids[0][i]);
          const metadata = result.metadatas[0]?.[i];
          const document = result.documents[0]?.[i];
          const embedding = result.embeddings?.[0]?.[i];

          const page: MemoryPage = {
            id: id,
            agentId: String(metadata?.agentId || agentId),
            key: String(metadata?.key || ''),
            value: String(document || ''),
            embedding: Array.isArray(embedding) ? embedding : [],
            level: MemoryLevel.L2_VECTOR,
            status: (metadata?.status as PageStatus) || PageStatus.IDLE,
            accessCount: Number(metadata?.accessCount || 0),
            lastAccessedAt: new Date(String(metadata?.lastAccessedAt || Date.now())),
            createdAt: new Date(String(metadata?.createdAt || Date.now())),
            size: Number(metadata?.size || 0),
          };

          const distance = result.distances?.[0]?.[i];
          const similarity = distance !== undefined 
            ? 1 - Number(distance) // Convert distance to similarity
            : 1.0;

          results.push({ page, similarity });
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to perform semantic search:', error);
      return [];
    }
  }

  /**
   * Delete page from vector store
   */
  async deletePage(agentId: string, key: string): Promise<boolean> {
    if (!this.initialized || !this.collection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      await this.collection.delete({
        ids: [`${agentId}:${key}`],
      });
      return true;
    } catch (error) {
      console.error('Failed to delete page from ChromaDB:', error);
      return false;
    }
  }

  /**
   * Update page in vector store
   */
  async updatePage(page: MemoryPage): Promise<void> {
    if (!this.initialized || !this.collection) {
      throw new Error('ChromaDB not initialized');
    }

    if (!page.embedding || page.embedding.length === 0) {
      throw new Error('Page must have embedding for vector storage');
    }

    try {
      await this.collection.update({
        ids: [`${page.agentId}:${page.key}`],
        embeddings: [page.embedding],
        metadatas: [{
          agentId: page.agentId,
          key: page.key,
          level: MemoryLevel.L2_VECTOR,
          status: page.status,
          createdAt: page.createdAt.toISOString(),
          lastAccessedAt: page.lastAccessedAt.toISOString(),
          accessCount: page.accessCount,
          size: page.size,
        }],
        documents: [page.value],
      });
    } catch (error) {
      console.error('Failed to update page in ChromaDB:', error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{
    count: number;
    dimension: number | null;
  }> {
    if (!this.initialized || !this.collection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      const count = await this.collection.count();
      return {
        count,
        dimension: null,
      };
    } catch (error) {
      console.error('Failed to get ChromaDB stats:', error);
      return { count: 0, dimension: null };
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    if (!this.initialized || !this.collection) {
      return;
    }

    try {
      await this.client.deleteCollection({ name: this.collectionName });
      this.collection = await this.client.createCollection({
        name: this.collectionName,
        metadata: { description: 'AI Agent Context Vectors' },
        embeddingFunction: undefined as any,
      });
    } catch (error) {
      console.error('Failed to clear ChromaDB:', error);
    }
  }

  /**
   * Convert ChromaDB result to MemoryPage
   */
  private toMemoryPage(result: any): MemoryPage | null {
    if (!result.ids || result.ids.length === 0) {
      return null;
    }

    const metadata = result.metadatas[0];
    const document = result.documents[0];
    const embedding = result.embeddings?.[0];

    return {
      id: String(result.ids[0]),
      agentId: String(metadata?.agentId || ''),
      key: String(metadata?.key || ''),
      value: String(document || ''),
      embedding: Array.isArray(embedding) ? embedding : [],
      level: MemoryLevel.L2_VECTOR,
      status: (metadata?.status as PageStatus) || PageStatus.IDLE,
      accessCount: Number(metadata?.accessCount || 0),
      lastAccessedAt: new Date(String(metadata?.lastAccessedAt || Date.now())),
      createdAt: new Date(String(metadata?.createdAt || Date.now())),
      size: Number(metadata?.size || 0),
    };
  }
}
