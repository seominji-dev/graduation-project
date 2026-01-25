/**
 * Ollama Embedding Service Unit Tests
 * Tests for vector embedding generation
 * REQ-MEM-013: Generate embeddings for context similarity
 */

// Mock logger first - must be before imports
jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  Logger: jest.fn(),
  LogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
}));

// Mock Ollama
const mockList = jest.fn().mockResolvedValue({ models: [] });
const mockEmbeddings = jest.fn().mockResolvedValue({ embedding: [0.1, 0.2, 0.3, 0.4, 0.5] });

jest.mock('ollama', () => ({
  Ollama: jest.fn().mockImplementation(() => ({
    list: mockList,
    embeddings: mockEmbeddings,
  })),
}));

import { OllamaEmbeddingService } from '../../../src/services/OllamaEmbeddingService';

describe('OllamaEmbeddingService - Unit Tests', () => {
  let service: OllamaEmbeddingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OllamaEmbeddingService({
      baseUrl: 'http://localhost:11434',
      model: 'nomic-embed-text',
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();

      expect(mockList).toHaveBeenCalled();
    });

    it('should throw error if Ollama is not available', async () => {
      mockList.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(service.initialize()).rejects.toThrow('Connection refused');
    });
  });

  describe('Generate Embedding (REQ-MEM-013)', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedService = new OllamaEmbeddingService();

      await expect(uninitializedService.generateEmbedding('test')).rejects.toThrow(
        'Ollama not initialized',
      );
    });

    it('should generate embedding for text', async () => {
      const embedding = await service.generateEmbedding('Hello world');

      expect(mockEmbeddings).toHaveBeenCalledWith({
        model: 'nomic-embed-text',
        prompt: 'Hello world',
      });
      expect(embedding).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
    });

    it('should handle embedding errors', async () => {
      mockEmbeddings.mockRejectedValueOnce(new Error('Embedding error'));

      await expect(service.generateEmbedding('test')).rejects.toThrow('Embedding error');
    });
  });

  describe('Generate Embeddings Batch', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedService = new OllamaEmbeddingService();

      await expect(uninitializedService.generateEmbeddingsBatch(['test'])).rejects.toThrow(
        'Ollama not initialized',
      );
    });

    it('should generate embeddings for multiple texts', async () => {
      const texts = ['text1', 'text2', 'text3'];
      mockEmbeddings
        .mockResolvedValueOnce({ embedding: [0.1, 0.2] })
        .mockResolvedValueOnce({ embedding: [0.3, 0.4] })
        .mockResolvedValueOnce({ embedding: [0.5, 0.6] });

      const embeddings = await service.generateEmbeddingsBatch(texts);

      expect(embeddings).toHaveLength(3);
      expect(mockEmbeddings).toHaveBeenCalledTimes(3);
    });

    it('should handle batch errors', async () => {
      mockEmbeddings.mockRejectedValueOnce(new Error('Batch error'));

      await expect(service.generateEmbeddingsBatch(['test'])).rejects.toThrow('Batch error');
    });
  });

  describe('Calculate Similarity', () => {
    it('should calculate cosine similarity between vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];

      const similarity = service.calculateSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(1.0);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];

      const similarity = service.calculateSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(0.0);
    });

    it('should handle negative correlation', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [-1, 0, 0];

      const similarity = service.calculateSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(-1.0);
    });

    it('should throw error for mismatched dimensions', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0];

      expect(() => service.calculateSimilarity(vec1, vec2)).toThrow(
        'Vector dimensions must match',
      );
    });

    it('should return 0 for zero vectors', () => {
      const vec1 = [0, 0, 0];
      const vec2 = [0, 0, 0];

      const similarity = service.calculateSimilarity(vec1, vec2);

      expect(similarity).toBe(0);
    });

    it('should calculate similarity for general vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [4, 5, 6];

      const similarity = service.calculateSimilarity(vec1, vec2);

      // (1*4 + 2*5 + 3*6) / (sqrt(14) * sqrt(77))
      const expected = 32 / (Math.sqrt(14) * Math.sqrt(77));
      expect(similarity).toBeCloseTo(expected, 5);
    });
  });

  describe('Get Embedding Dimension', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedService = new OllamaEmbeddingService();

      await expect(uninitializedService.getEmbeddingDimension()).rejects.toThrow(
        'Ollama not initialized',
      );
    });

    it('should return embedding dimension', async () => {
      mockEmbeddings.mockResolvedValueOnce({ embedding: [0.1, 0.2, 0.3, 0.4, 0.5] });

      const dimension = await service.getEmbeddingDimension();

      expect(dimension).toBe(5);
    });

    it('should return 0 on error', async () => {
      mockEmbeddings.mockRejectedValueOnce(new Error('Dimension error'));

      const dimension = await service.getEmbeddingDimension();

      expect(dimension).toBe(0);
    });
  });
});
