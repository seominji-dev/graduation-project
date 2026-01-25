/**
 * Ollama Embedding Service
 * Generates vector embeddings for semantic search
 * REQ-MEM-013: Generate embeddings for context similarity
 */

import { Ollama as OllamaClass } from 'ollama';
import logger from '../utils/logger';

export interface EmbeddingConfig {
  baseUrl?: string;
  model?: string;
}

/**
 * Ollama embedding service wrapper
 */
export class OllamaEmbeddingService {
  private ollama: OllamaClass;
  private model: string;
  private initialized: boolean = false;

  constructor(config: EmbeddingConfig = {}) {
    this.ollama = new OllamaClass({ host: config.baseUrl || 'http://localhost:11434' });
    this.model = config.model || 'nomic-embed-text';
  }

  /**
   * Initialize embedding service
   */
  async initialize(): Promise<void> {
    try {
      // Check if Ollama is available
      await this.ollama.list();
      this.initialized = true;
      logger.info(`Ollama initialized: model "${this.model}"`);
    } catch (error) {
      logger.error('Failed to initialize Ollama:', error);
      throw error;
    }
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.initialized) {
      throw new Error('Ollama not initialized');
    }

    try {
      const response = await this.ollama.embeddings({
        model: this.model,
        prompt: text,
      });

      return response.embedding;
    } catch (error) {
      logger.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (!this.initialized) {
      throw new Error('Ollama not initialized');
    }

    try {
      const embeddings: number[][] = [];

      for (const text of texts) {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
      }

      return embeddings;
    } catch (error) {
      logger.error('Failed to generate batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  calculateSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Get embedding dimension
   */
  async getEmbeddingDimension(): Promise<number> {
    if (!this.initialized) {
      throw new Error('Ollama not initialized');
    }

    try {
      const testEmbedding = await this.generateEmbedding('test');
      return testEmbedding.length;
    } catch (error) {
      logger.error('Failed to get embedding dimension:', error);
      return 0;
    }
  }
}
