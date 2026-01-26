/**
 * Domain Models Specification Tests
 * Test-first approach for greenfield DDD
 */

import {
  MemoryPageSchema,
  PageTableEntrySchema,
  MemoryAccessRequestSchema,
  MemoryAccessResponseSchema,
  MemoryManagerStatsSchema,
  LRUCacheConfigSchema,
  VectorSearchRequestSchema,
  VectorSearchResultSchema,
  MemoryLevel,
  PageStatus,
} from '../../../src/domain/models';

describe('Domain Models - Specification Tests', () => {
  describe('MemoryLevel Enum', () => {
    it('should have correct memory levels (REQ-MEM-001)', () => {
      expect(MemoryLevel.L1_CACHE).toBe('L1_CACHE');
      expect(MemoryLevel.L2_VECTOR).toBe('L2_VECTOR');
      expect(MemoryLevel.L3_DISK).toBe('L3_DISK');
    });
  });

  describe('PageStatus Enum', () => {
    it('should have correct page statuses', () => {
      expect(PageStatus.ACTIVE).toBe('active');
      expect(PageStatus.IDLE).toBe('idle');
      expect(PageStatus.SWAPPED_OUT).toBe('swapped_out');
      expect(PageStatus.EVICTED).toBe('evicted');
    });
  });

  describe('MemoryPageSchema', () => {
    const validPage = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      agentId: 'agent-001',
      key: 'conversation:123',
      value: 'Sample conversation content',
      embedding: [0.1, 0.2, 0.3],
      level: MemoryLevel.L1_CACHE,
      status: PageStatus.ACTIVE,
      accessCount: 5,
      lastAccessedAt: new Date(),
      createdAt: new Date(),
      size: 100,
    };

    it('should validate complete memory page (REQ-MEM-002)', () => {
      const result = MemoryPageSchema.safeParse(validPage);
      expect(result.success).toBe(true);
    });

    it('should require UUID for page ID', () => {
      const result = MemoryPageSchema.safeParse({
        ...validPage,
        id: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should require agentId', () => {
      const result = MemoryPageSchema.safeParse({
        ...validPage,
        agentId: '',
      });
      expect(result.success).toBe(false);
    });

    it('should require key', () => {
      const result = MemoryPageSchema.safeParse({
        ...validPage,
        key: '',
      });
      expect(result.success).toBe(false);
    });

    it('should require value', () => {
      const result = MemoryPageSchema.safeParse({
        ...validPage,
        value: '',
      });
      expect(result.success).toBe(false);
    });

    it('should allow optional embedding', () => {
      const result = MemoryPageSchema.safeParse({
        ...validPage,
        embedding: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('should default status to IDLE', () => {
      const result = MemoryPageSchema.safeParse({
        ...validPage,
        status: undefined,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(PageStatus.IDLE);
      }
    });

    it('should default accessCount to 0', () => {
      const result = MemoryPageSchema.safeParse({
        ...validPage,
        accessCount: undefined,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accessCount).toBe(0);
      }
    });
  });

  describe('PageTableEntrySchema', () => {
    const validEntry = {
      pageNumber: 1,
      frameNumber: 100,
      level: MemoryLevel.L1_CACHE,
      present: true,
      referenced: true,
      modified: false,
      lastAccessTime: new Date(),
    };

    it('should validate complete page table entry (REQ-MEM-003)', () => {
      const result = PageTableEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('should require pageNumber', () => {
      const result = PageTableEntrySchema.safeParse({
        ...validEntry,
        pageNumber: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('should allow optional frameNumber (swapped out pages)', () => {
      const result = PageTableEntrySchema.safeParse({
        ...validEntry,
        frameNumber: undefined,
        present: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('MemoryAccessRequestSchema', () => {
    const validRequest = {
      agentId: 'agent-001',
      key: 'conversation:123',
      operation: 'get' as const,
    };

    it('should validate GET request', () => {
      const result = MemoryAccessRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should validate PUT request with value', () => {
      const result = MemoryAccessRequestSchema.safeParse({
        ...validRequest,
        operation: 'put' as const,
        value: 'New value',
      });
      expect(result.success).toBe(true);
    });

    it('should validate DELETE request', () => {
      const result = MemoryAccessRequestSchema.safeParse({
        ...validRequest,
        operation: 'delete' as const,
      });
      expect(result.success).toBe(true);
    });

    it('should validate EVICT request', () => {
      const result = MemoryAccessRequestSchema.safeParse({
        ...validRequest,
        operation: 'evict' as const,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid operation', () => {
      const result = MemoryAccessRequestSchema.safeParse({
        ...validRequest,
        operation: 'invalid' as any,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('MemoryAccessResponseSchema', () => {
    const validResponse = {
      success: true,
      data: 'Response data',
      level: MemoryLevel.L1_CACHE,
      accessTime: 50,
      pageFault: false,
      message: 'Success',
    };

    it('should validate successful response', () => {
      const result = MemoryAccessResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate failed response', () => {
      const result = MemoryAccessResponseSchema.safeParse({
        success: false,
        accessTime: 10,
        pageFault: true,
        message: 'Not found',
      });
      expect(result.success).toBe(true);
    });

    it('should require accessTime', () => {
      const result = MemoryAccessResponseSchema.safeParse({
        success: true,
        data: 'test',
      });
      expect(result.success).toBe(false);
    });

    it('should default pageFault to false', () => {
      const result = MemoryAccessResponseSchema.safeParse({
        success: true,
        data: 'test',
        level: MemoryLevel.L1_CACHE,
        accessTime: 50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageFault).toBe(false);
      }
    });
  });

  describe('MemoryManagerStatsSchema', () => {
    const validStats = {
      l1Size: 50,
      l1Capacity: 100,
      l2Size: 200,
      l3Size: 1000,
      totalAccesses: 5000,
      pageFaults: 500,
      hitRate: 90.0,
      averageAccessTime: 45,
      evictions: 100,
      promotions: 300,
      demotions: 200,
    };

    it('should validate memory manager statistics', () => {
      const result = MemoryManagerStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it('should track page faults (REQ-MEM-004)', () => {
      const result = MemoryManagerStatsSchema.safeParse({
        ...validStats,
        pageFaults: 500,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageFaults).toBe(500);
      }
    });
  });

  describe('LRUCacheConfigSchema', () => {
    it('should validate LRU cache configuration', () => {
      const result = LRUCacheConfigSchema.safeParse({
        capacity: 100,
        ttl: 60000,
        evictionPolicy: 'lru' as const,
      });
      expect(result.success).toBe(true);
    });

    it('should default capacity to 100', () => {
      const result = LRUCacheConfigSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacity).toBe(100);
      }
    });

    it('should default evictionPolicy to lru (REQ-MEM-005)', () => {
      const result = LRUCacheConfigSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.evictionPolicy).toBe('lru');
      }
    });
  });

  describe('VectorSearchRequestSchema', () => {
    it('should validate vector search request', () => {
      const result = VectorSearchRequestSchema.safeParse({
        agentId: 'agent-001',
        query: 'Find similar conversations',
        topK: 5,
      });
      expect(result.success).toBe(true);
    });

    it('should default topK to 5', () => {
      const result = VectorSearchRequestSchema.safeParse({
        agentId: 'agent-001',
        query: 'Test query',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.topK).toBe(5);
      }
    });
  });

  describe('VectorSearchResultSchema', () => {
    it('should validate vector search result', () => {
      const result = VectorSearchResultSchema.safeParse({
        key: 'conversation:123',
        value: 'Similar content',
        similarity: 0.95,
        level: MemoryLevel.L2_VECTOR,
      });
      expect(result.success).toBe(true);
    });

    it('should require similarity score', () => {
      const result = VectorSearchResultSchema.safeParse({
        key: 'conversation:123',
        value: 'content',
        level: MemoryLevel.L2_VECTOR,
      });
      expect(result.success).toBe(false);
    });
  });
});
