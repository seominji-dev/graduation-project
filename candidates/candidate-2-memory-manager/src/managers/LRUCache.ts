/**
 * LRU (Least Recently Used) Cache Manager
 * Implements OS paging replacement algorithm
 * REQ-MEM-005: LRU eviction policy for cache management
 */

import { MemoryPage, PageStatus, MemoryLevel } from '../domain/models';

// Doubly Linked List Node for LRU tracking
class LRUNode<T> {
  key: string;
  value: T;
  prev: LRUNode<T> | null = null;
  next: LRUNode<T> | null = null;

  constructor(key: string, value: T) {
    this.key = key;
    this.value = value;
  }
}

// LRU Cache Configuration
export interface LRUConfig {
  capacity: number;
  ttl?: number; // Time to live in milliseconds
}

/**
 * LRU Cache implementation using HashMap + Doubly Linked List
 * Time Complexity: O(1) for get, put, and evict operations
 */
export class LRUCache<T> {
  private capacity: number;
  private cache: Map<string, LRUNode<T>>;
  private head: LRUNode<T> | null;
  private tail: LRUNode<T> | null;
  private ttl?: number;
  private timestamps: Map<string, number>; // Track insertion time for TTL

  constructor(config: LRUConfig) {
    this.capacity = config.capacity;
    this.ttl = config.ttl;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
    this.timestamps = new Map();
  }

  /**
   * Get value by key (LRU: move to front)
   * REQ-MEM-006: Update access order on read
   */
  get(key: string): T | undefined {
    const node = this.cache.get(key);
    
    if (!node) {
      return undefined;
    }

    // Check TTL if configured
    if (this.ttl && this.isExpired(key)) {
      this.removeNode(node);
      this.cache.delete(key);
      this.timestamps.delete(key);
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToFront(node);
    return node.value;
  }

  /**
   * Put value in cache (LRU: evict if at capacity)
   * REQ-MEM-007: Evict least recently used when full
   */
  put(key: string, value: T): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // Update existing node
      existingNode.value = value;
      this.moveToFront(existingNode);
      this.timestamps.set(key, Date.now());
    } else {
      // Create new node
      const newNode = new LRUNode(key, value);
      
      // Check capacity and evict if needed
      if (this.cache.size >= this.capacity) {
        this.evictLeastRecentlyUsed();
      }

      this.cache.set(key, newNode);
      this.addToFront(newNode);
      this.timestamps.set(key, Date.now());
    }
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    // Check TTL
    if (this.ttl && this.isExpired(key)) {
      this.removeNode(node);
      this.cache.delete(key);
      this.timestamps.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    const node = this.cache.get(key);
    
    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    this.timestamps.delete(key);
    return true;
  }

  /**
   * Get current size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys (ordered from most to least recently used)
   */
  keys(): string[] {
    const keys: string[] = [];
    let current = this.head;
    
    while (current) {
      keys.push(current.key);
      current = current.next;
    }
    
    return keys;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
    this.head = null;
    this.tail = null;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    capacity: number;
    utilization: number; // percentage
    oldestEntryAge: number | null; // milliseconds
  } {
    const now = Date.now();
    let oldestTimestamp: number | null = null;

    // Find oldest entry
    for (const timestamp of this.timestamps.values()) {
      if (oldestTimestamp === null || timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
      }
    }

    return {
      size: this.cache.size,
      capacity: this.capacity,
      utilization: (this.cache.size / this.capacity) * 100,
      oldestEntryAge: oldestTimestamp ? now - oldestTimestamp : null,
    };
  }

  /**
   * Move node to front (most recently used position)
   */
  private moveToFront(node: LRUNode<T>): void {
    this.removeNode(node);
    this.addToFront(node);
  }

  /**
   * Add node to front of list
   */
  private addToFront(node: LRUNode<T>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Remove node from list
   */
  private removeNode(node: LRUNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * Evict least recently used entry (tail of list)
   * REQ-MEM-007: Page replacement algorithm
   */
  private evictLeastRecentlyUsed(): void {
    if (!this.tail) {
      return;
    }

    const lruKey = this.tail.key;
    this.removeNode(this.tail);
    this.cache.delete(lruKey);
    this.timestamps.delete(lruKey);
  }

  /**
   * Check if entry has expired (TTL)
   */
  private isExpired(key: string): boolean {
    if (!this.ttl) {
      return false;
    }

    const timestamp = this.timestamps.get(key);
    if (!timestamp) {
      return false;
    }

    return Date.now() - timestamp > this.ttl;
  }
}

/**
 * LRU Cache Manager specialized for Memory Pages
 * Extends base LRU cache with MemoryPage-specific logic
 */
export class MemoryPageLRUCache {
  private cache: LRUCache<MemoryPage>;

  constructor(config: LRUConfig) {
    this.cache = new LRUCache<MemoryPage>(config);
  }

  /**
   * Get memory page by composite key (agentId:key)
   */
  getPage(agentId: string, key: string): MemoryPage | undefined {
    const compositeKey = this.getCompositeKey(agentId, key);
    const page = this.cache.get(compositeKey);

    if (page) {
      // Update access tracking
      page.accessCount++;
      page.lastAccessedAt = new Date();
      page.status = PageStatus.ACTIVE;
    }

    return page;
  }

  /**
   * Put memory page in cache
   */
  putPage(page: MemoryPage): void {
    const compositeKey = this.getCompositeKey(page.agentId, page.key);
    page.lastAccessedAt = new Date();
    page.status = PageStatus.ACTIVE;
    this.cache.put(compositeKey, page);
  }

  /**
   * Delete memory page from cache
   */
  deletePage(agentId: string, key: string): boolean {
    const compositeKey = this.getCompositeKey(agentId, key);
    return this.cache.delete(compositeKey);
  }

  /**
   * Check if page exists in cache
   */
  hasPage(agentId: string, key: string): boolean {
    const compositeKey = this.getCompositeKey(agentId, key);
    return this.cache.has(compositeKey);
  }

  /**
   * Get least recently used page for eviction
   */
  getLRUPage(): { agentId: string; key: string; page: MemoryPage } | null {
    const keys = this.cache.keys();
    
    if (keys.length === 0) {
      return null;
    }

    // Least recently used is at the end
    const lruKey = keys[keys.length - 1];
    const page = this.cache.get(lruKey);

    if (!page) {
      return null;
    }

    const [agentId, key] = this.parseCompositeKey(lruKey);
    return { agentId, key, page };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Clear all pages
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Generate composite key from agentId and key
   */
  private getCompositeKey(agentId: string, key: string): string {
    return `${agentId}:${key}`;
  }

  /**
   * Parse composite key into agentId and key
   */
  private parseCompositeKey(compositeKey: string): [string, string] {
    const parts = compositeKey.split(':');
    const agentId = parts[0];
    const key = parts.slice(1).join(':'); // Handle keys with colons
    return [agentId, key];
  }
}
