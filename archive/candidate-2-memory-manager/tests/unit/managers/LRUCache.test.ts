/**
 * LRU Cache Unit Tests
 * Tests for LRU (Least Recently Used) cache implementation
 * REQ-MEM-005: LRU eviction policy
 * REQ-MEM-006: Update access order on read
 * REQ-MEM-007: Evict least recently used when full
 */

import { LRUCache, MemoryPageLRUCache } from '../../../src/managers/LRUCache';
import { MemoryPage, MemoryLevel, PageStatus } from '../../../src/domain/models';
import { v4 as uuidv4 } from 'uuid';

describe('LRU Cache - Unit Tests', () => {
  describe('LRUCache - Basic Operations', () => {
    let cache: LRUCache<string>;

    beforeEach(() => {
      cache = new LRUCache<string>({ capacity: 3 });
    });

    describe('Basic Get/Put Operations', () => {
      it('should store and retrieve values', () => {
        cache.put('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');
      });

      it('should return undefined for non-existent keys', () => {
        expect(cache.get('nonexistent')).toBeUndefined();
      });

      it('should update existing keys', () => {
        cache.put('key1', 'value1');
        cache.put('key1', 'value2');
        expect(cache.get('key1')).toBe('value2');
      });

      it('should track cache size correctly', () => {
        expect(cache.size()).toBe(0);
        cache.put('key1', 'value1');
        expect(cache.size()).toBe(1);
        cache.put('key2', 'value2');
        expect(cache.size()).toBe(2);
      });
    });

    describe('LRU Eviction (REQ-MEM-007)', () => {
      it('should evict least recently used item when capacity exceeded', () => {
        cache.put('key1', 'value1');
        cache.put('key2', 'value2');
        cache.put('key3', 'value3');
        
        // Cache is now full (capacity = 3)
        expect(cache.size()).toBe(3);
        
        // Add one more item, should evict key1 (least recently used)
        cache.put('key4', 'value4');
        
        expect(cache.size()).toBe(3);
        expect(cache.get('key1')).toBeUndefined();
        expect(cache.get('key2')).toBe('value2');
        expect(cache.get('key3')).toBe('value3');
        expect(cache.get('key4')).toBe('value4');
      });

      it('should update access order on get (REQ-MEM-006)', () => {
        cache.put('key1', 'value1');
        cache.put('key2', 'value2');
        cache.put('key3', 'value3');
        
        // Access key1 to make it more recently used
        cache.get('key1');
        
        // Add new item, should evict key2 (now least recently used)
        cache.put('key4', 'value4');
        
        expect(cache.get('key1')).toBe('value1'); // Still present
        expect(cache.get('key2')).toBeUndefined(); // Evicted
        expect(cache.get('key3')).toBe('value3');
        expect(cache.get('key4')).toBe('value4');
      });

      it('should update access order on put', () => {
        cache.put('key1', 'value1');
        cache.put('key2', 'value2');
        cache.put('key3', 'value3');
        
        // Update key1 to make it more recently used
        cache.put('key1', 'value1-updated');
        
        // Add new item, should evict key2
        cache.put('key4', 'value4');
        
        expect(cache.get('key1')).toBe('value1-updated');
        expect(cache.get('key2')).toBeUndefined();
        expect(cache.get('key3')).toBe('value3');
        expect(cache.get('key4')).toBe('value4');
      });
    });

    describe('Delete Operation', () => {
      it('should delete existing keys', () => {
        cache.put('key1', 'value1');
        expect(cache.has('key1')).toBe(true);
        
        const deleted = cache.delete('key1');
        
        expect(deleted).toBe(true);
        expect(cache.has('key1')).toBe(false);
        expect(cache.get('key1')).toBeUndefined();
      });

      it('should return false when deleting non-existent keys', () => {
        const deleted = cache.delete('nonexistent');
        expect(deleted).toBe(false);
      });
    });

    describe('Has Operation', () => {
      it('should return true for existing keys', () => {
        cache.put('key1', 'value1');
        expect(cache.has('key1')).toBe(true);
      });

      it('should return false for non-existent keys', () => {
        expect(cache.has('nonexistent')).toBe(false);
      });
    });

    describe('Keys Order', () => {
      it('should return keys in most-to-least-recently-used order', () => {
        cache.put('key1', 'value1');
        cache.put('key2', 'value2');
        cache.put('key3', 'value3');
        
        // Access key1 to make it most recently used
        cache.get('key1');
        
        const keys = cache.keys();
        
        expect(keys[0]).toBe('key1'); // Most recently used
        expect(keys[1]).toBe('key3');
        expect(keys[2]).toBe('key2'); // Least recently used
      });
    });

    describe('Clear Operation', () => {
      it('should clear all entries', () => {
        cache.put('key1', 'value1');
        cache.put('key2', 'value2');
        expect(cache.size()).toBe(2);
        
        cache.clear();
        
        expect(cache.size()).toBe(0);
        expect(cache.get('key1')).toBeUndefined();
        expect(cache.get('key2')).toBeUndefined();
      });
    });

    describe('Statistics', () => {
      it('should provide cache statistics', () => {
        cache.put('key1', 'value1');
        cache.put('key2', 'value2');
        
        const stats = cache.getStats();
        
        expect(stats.size).toBe(2);
        expect(stats.capacity).toBe(3);
        expect(stats.utilization).toBeCloseTo(66.67, 1);
        expect(stats.oldestEntryAge).toBeGreaterThanOrEqual(0);
      });
    });

    describe('TTL (Time To Live)', () => {
      it('should expire entries after TTL', (done) => {
        const ttlCache = new LRUCache<string>({ capacity: 3, ttl: 100 });
        
        ttlCache.put('key1', 'value1');
        
        // Immediately available
        expect(ttlCache.get('key1')).toBe('value1');
        
        // Wait for TTL to expire
        setTimeout(() => {
          expect(ttlCache.get('key1')).toBeUndefined();
          done();
        }, 150);
      }, 10000);

      it('should not expire entries before TTL', (done) => {
        const ttlCache = new LRUCache<string>({ capacity: 3, ttl: 200 });
        
        ttlCache.put('key1', 'value1');
        
        setTimeout(() => {
          expect(ttlCache.get('key1')).toBe('value1');
          done();
        }, 100);
      }, 10000);
    });
  });

  describe('MemoryPageLRUCache - Memory Page Specialization', () => {
    let pageCache: MemoryPageLRUCache;
    
    const createTestPage = (agentId: string, key: string, value: string): MemoryPage => ({
      id: uuidv4(),
      agentId,
      key,
      value,
      level: MemoryLevel.L1_CACHE,
      status: PageStatus.ACTIVE,
      accessCount: 0,
      lastAccessedAt: new Date(),
      createdAt: new Date(),
      size: Buffer.byteLength(value, 'utf8'),
    });

    beforeEach(() => {
      pageCache = new MemoryPageLRUCache({ capacity: 3 });
    });

    describe('Page Operations', () => {
      it('should store and retrieve memory pages', () => {
        const page = createTestPage('agent-001', 'conversation:123', 'Hello world');
        
        pageCache.putPage(page);
        
        const retrieved = pageCache.getPage('agent-001', 'conversation:123');
        
        expect(retrieved).toBeDefined();
        expect(retrieved?.value).toBe('Hello world');
        expect(retrieved?.accessCount).toBe(1); // Incremented on get
        expect(retrieved?.status).toBe(PageStatus.ACTIVE);
      });

      it('should check page existence', () => {
        const page = createTestPage('agent-001', 'conversation:123', 'Test');
        
        expect(pageCache.hasPage('agent-001', 'conversation:123')).toBe(false);
        
        pageCache.putPage(page);
        
        expect(pageCache.hasPage('agent-001', 'conversation:123')).toBe(true);
      });

      it('should delete pages', () => {
        const page = createTestPage('agent-001', 'conversation:123', 'Test');
        
        pageCache.putPage(page);
        expect(pageCache.hasPage('agent-001', 'conversation:123')).toBe(true);
        
        const deleted = pageCache.deletePage('agent-001', 'conversation:123');
        
        expect(deleted).toBe(true);
        expect(pageCache.hasPage('agent-001', 'conversation:123')).toBe(false);
      });

      it('should handle multiple agents', () => {
        const page1 = createTestPage('agent-001', 'key1', 'Agent 1 data');
        const page2 = createTestPage('agent-002', 'key1', 'Agent 2 data');
        
        pageCache.putPage(page1);
        pageCache.putPage(page2);
        
        expect(pageCache.getPage('agent-001', 'key1')?.value).toBe('Agent 1 data');
        expect(pageCache.getPage('agent-002', 'key1')?.value).toBe('Agent 2 data');
      });
    });

    describe('LRU Eviction for Pages', () => {
      it('should evict least recently used page', () => {
        const page1 = createTestPage('agent-001', 'key1', 'Page 1');
        const page2 = createTestPage('agent-001', 'key2', 'Page 2');
        const page3 = createTestPage('agent-001', 'key3', 'Page 3');
        const page4 = createTestPage('agent-001', 'key4', 'Page 4');
        
        pageCache.putPage(page1);
        pageCache.putPage(page2);
        pageCache.putPage(page3);
        
        // Cache is full
        expect(pageCache.getStats().size).toBe(3);
        
        // Add page4, should evict page1
        pageCache.putPage(page4);
        
        expect(pageCache.hasPage('agent-001', 'key1')).toBe(false);
        expect(pageCache.hasPage('agent-001', 'key2')).toBe(true);
        expect(pageCache.hasPage('agent-001', 'key3')).toBe(true);
        expect(pageCache.hasPage('agent-001', 'key4')).toBe(true);
      });

      it('should get least recently used page for eviction', () => {
        const page1 = createTestPage('agent-001', 'key1', 'Page 1');
        const page2 = createTestPage('agent-001', 'key2', 'Page 2');
        const page3 = createTestPage('agent-001', 'key3', 'Page 3');
        
        pageCache.putPage(page1);
        pageCache.putPage(page2);
        pageCache.putPage(page3);
        
        // Access page1 to make it more recent
        pageCache.getPage('agent-001', 'key1');
        
        const lru = pageCache.getLRUPage();
        
        expect(lru).toBeDefined();
        expect(lru?.key).toBe('key2'); // page2 is now LRU
        expect(lru?.agentId).toBe('agent-001');
      });

      it('should return null when cache is empty', () => {
        const lru = pageCache.getLRUPage();
        expect(lru).toBeNull();
      });
    });

    describe('Page Statistics', () => {
      it('should provide cache statistics', () => {
        const page1 = createTestPage('agent-001', 'key1', 'Page 1');
        const page2 = createTestPage('agent-001', 'key2', 'Page 2');
        
        pageCache.putPage(page1);
        pageCache.putPage(page2);
        
        const stats = pageCache.getStats();
        
        expect(stats.size).toBe(2);
        expect(stats.capacity).toBe(3);
        expect(stats.utilization).toBeCloseTo(66.67, 1);
      });
    });

    describe('Clear Operation', () => {
      it('should clear all pages', () => {
        const page1 = createTestPage('agent-001', 'key1', 'Page 1');
        const page2 = createTestPage('agent-001', 'key2', 'Page 2');
        
        pageCache.putPage(page1);
        pageCache.putPage(page2);
        
        pageCache.clear();
        
        expect(pageCache.getStats().size).toBe(0);
        expect(pageCache.hasPage('agent-001', 'key1')).toBe(false);
        expect(pageCache.hasPage('agent-001', 'key2')).toBe(false);
      });
    });

    describe('Composite Key Handling', () => {
      it('should handle keys with colons correctly', () => {
        const page = createTestPage('agent-001', 'conversation:123:message:456', 'Complex key');
        
        pageCache.putPage(page);
        
        const retrieved = pageCache.getPage('agent-001', 'conversation:123:message:456');
        
        expect(retrieved).toBeDefined();
        expect(retrieved?.value).toBe('Complex key');
      });
    });
  });
});
