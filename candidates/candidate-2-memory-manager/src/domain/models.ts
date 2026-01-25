/**
 * Domain Models for Memory Manager
 * OS Paging/Virtual Memory concepts applied to AI Agent context
 */

import { z } from 'zod';

// Memory Level Enum (REQ-MEM-001: Three-tier hierarchy)
export enum MemoryLevel {
  L1_CACHE = 'L1_CACHE', // Redis - Fast access (most recently used)
  L2_VECTOR = 'L2_VECTOR', // ChromaDB - Semantic search (less recent)
  L3_DISK = 'L3_DISK', // MongoDB - Long-term storage (cold data)
}

// Page Status Enum (OS Paging States)
export enum PageStatus {
  ACTIVE = 'active', // Currently in use (referenced)
  IDLE = 'idle', // Not recently used
  SWAPPED_OUT = 'swapped_out', // Moved to lower level
  EVICTED = 'evicted', // Removed from all levels
}

// Memory Page Schema (REQ-MEM-002: Page as unit of memory)
export const MemoryPageSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().min(1),
  key: z.string().min(1), // Page identifier (e.g., "conversation:123")
  value: z.string().min(1), // Serialized content
  embedding: z.array(z.number()).optional(), // Vector embedding for semantic search
  level: z.nativeEnum(MemoryLevel),
  status: z.nativeEnum(PageStatus).default(PageStatus.IDLE),
  accessCount: z.number().default(0), // LRU tracking
  lastAccessedAt: z.date(),
  createdAt: z.date(),
  size: z.number().default(0), // Page size in bytes
  metadata: z.record(z.any()).optional(),
});

export type MemoryPage = z.infer<typeof MemoryPageSchema>;

// Page Table Entry Schema (REQ-MEM-003: Page table for address translation)
export const PageTableEntrySchema = z.object({
  pageNumber: z.number(), // Logical page number
  frameNumber: z.number().optional(), // Physical frame number (optional if swapped out)
  level: z.nativeEnum(MemoryLevel),
  present: z.boolean(), // Is page in memory?
  referenced: z.boolean(), // Recently accessed (for LRU)
  modified: z.boolean(), // Dirty bit (has page been modified?)
  lastAccessTime: z.date(),
});

export type PageTableEntry = z.infer<typeof PageTableEntrySchema>;

// Memory Access Request Schema
export const MemoryAccessRequestSchema = z.object({
  agentId: z.string(),
  key: z.string(),
  value: z.string().optional(), // For write operations
  operation: z.enum(['get', 'put', 'delete', 'evict']),
  metadata: z.record(z.any()).optional(),
});

export type MemoryAccessRequest = z.infer<typeof MemoryAccessRequestSchema>;

// Memory Access Response Schema
export const MemoryAccessResponseSchema = z.object({
  success: z.boolean(),
  data: z.string().optional(),
  level: z.nativeEnum(MemoryLevel).optional(),
  accessTime: z.number(), // milliseconds
  pageFault: z.boolean().default(false), // REQ-MEM-004: Page fault occurred
  message: z.string().optional(),
});

export type MemoryAccessResponse = z.infer<typeof MemoryAccessResponseSchema>;

// Memory Manager Statistics Schema
export const MemoryManagerStatsSchema = z.object({
  l1Size: z.number(), // Current pages in L1
  l1Capacity: z.number(), // L1 capacity
  l2Size: z.number(), // Current pages in L2
  l3Size: z.number(), // Current pages in L3
  totalAccesses: z.number(),
  pageFaults: z.number(), // REQ-MEM-004: Track page faults
  hitRate: z.number(), // Cache hit rate (L1 + L2)
  averageAccessTime: z.number(), // Average access time in ms
  evictions: z.number(),
  promotions: z.number(), // L3 -> L2 or L2 -> L1
  demotions: z.number(), // L1 -> L2 or L2 -> L3
});

export type MemoryManagerStats = z.infer<typeof MemoryManagerStatsSchema>;

// LRU Cache Configuration Schema
export const LRUCacheConfigSchema = z.object({
  capacity: z.number().default(100), // Maximum number of pages
  ttl: z.number().optional(), // Time to live in milliseconds
  evictionPolicy: z.enum(['lru', 'lfu', 'fifo']).default('lru'),
});

export type LRUCacheConfig = z.infer<typeof LRUCacheConfigSchema>;

// Vector Search Request Schema
export const VectorSearchRequestSchema = z.object({
  agentId: z.string(),
  query: z.string(),
  topK: z.number().default(5), // Number of results to return
  threshold: z.number().optional(), // Similarity threshold (0-1)
});

export type VectorSearchRequest = z.infer<typeof VectorSearchRequestSchema>;

// Vector Search Result Schema
export const VectorSearchResultSchema = z.object({
  key: z.string(),
  value: z.string(),
  similarity: z.number(), // Cosine similarity (0-1)
  level: z.nativeEnum(MemoryLevel),
});

export type VectorSearchResult = z.infer<typeof VectorSearchResultSchema>;
