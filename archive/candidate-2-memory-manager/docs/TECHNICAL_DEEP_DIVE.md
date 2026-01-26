# Technical Deep Dive: Memory Manager

## Introduction

This document provides an in-depth technical analysis of the Memory Manager system, explaining the Operating System concepts applied and their implementation details.

---

## Table of Contents

1. [OS Memory Management Fundamentals](#1-os-memory-management-fundamentals)
2. [Paging and Virtual Memory](#2-paging-and-virtual-memory)
3. [LRU Cache Algorithm Analysis](#3-lru-cache-algorithm-analysis)
4. [Redis Layer Deep Dive](#4-redis-layer-deep-dive)
5. [ChromaDB Vector Search Implementation](#5-chromadb-vector-search-implementation)
6. [MongoDB Persistent Storage](#6-mongodb-persistent-storage)
7. [Vector Embedding Implementation](#7-vector-embedding-implementation)
8. [System Integration](#8-system-integration)

---

## 1. OS Memory Management Fundamentals

### 1.1 The Memory Hierarchy Problem

Modern computer systems face a fundamental challenge: fast memory is expensive and limited, while large storage is slow and cheap. This creates a **memory hierarchy**:

```
            +------------------+
            |   CPU Registers  |  <- Fastest, smallest (~1KB)
            +------------------+
                    |
            +------------------+
            |   L1/L2 Cache    |  <- Very fast (~1-10MB)
            +------------------+
                    |
            +------------------+
            |     Main RAM     |  <- Fast (~8-128GB)
            +------------------+
                    |
            +------------------+
            |    SSD/HDD       |  <- Slow (~1TB+)
            +------------------+
```

### 1.2 Applying to AI Agents

AI agents face the same challenge with context management:

| Traditional OS | AI Agent Application |
|----------------|---------------------|
| CPU Registers | Current conversation turn |
| L1/L2 Cache | In-memory LRU cache |
| Main RAM | Redis cache |
| SSD/HDD | MongoDB/ChromaDB |

### 1.3 Key OS Concepts Applied

| Concept | OS Definition | Our Implementation |
|---------|---------------|-------------------|
| Page | Fixed-size unit of memory | MemoryPage (variable size) |
| Frame | Physical memory slot | Cache slot in LRU |
| Page Table | Virtual to physical mapping | PageTableEntry |
| Page Fault | Access to non-resident page | L3 hit after L1/L2 miss |
| Swapping | Moving pages between levels | Promotion/Demotion |
| TLB | Fast address translation cache | In-memory HashMap |

---

## 2. Paging and Virtual Memory

### 2.1 Virtual Memory Concept

In traditional OS, **virtual memory** allows processes to use more memory than physically available by using disk as extended memory. Our implementation provides similar benefits:

**Benefits Achieved**:
1. **Address Space Abstraction**: Agents use simple keys, system handles placement
2. **Memory Protection**: Each agent has isolated namespace
3. **Efficient Memory Use**: Hot data in fast storage, cold data in slow storage
4. **Transparent Access**: Automatic promotion/demotion

### 2.2 Page Structure

Our `MemoryPage` is analogous to OS memory pages:

```typescript
// OS Page in typical system
struct Page {
    uint32_t frame_number;    // Physical location
    uint32_t flags;           // Present, dirty, accessed bits
    void* data;               // Page content
};

// Our MemoryPage
interface MemoryPage {
    id: string;               // Unique identifier
    agentId: string;          // Namespace (like process ID)
    key: string;              // Logical address
    value: string;            // Page content
    level: MemoryLevel;       // Current physical location
    status: PageStatus;       // Page state flags
    accessCount: number;      // For LRU tracking
    lastAccessedAt: Date;     // Access timestamp
}
```

### 2.3 Page Table Implementation

The `PageTableEntry` tracks page location and state:

```typescript
interface PageTableEntry {
    pageNumber: number;       // Logical page number
    frameNumber?: number;     // Physical frame (if present)
    level: MemoryLevel;       // L1, L2, or L3
    present: boolean;         // Page fault if false
    referenced: boolean;      // Used for LRU approximation
    modified: boolean;        // Dirty bit for write-back
    lastAccessTime: Date;     // For eviction decisions
}
```

### 2.4 Page Fault Handling

A **page fault** occurs when requested data is not in the cache:

```
                    GET Request
                         |
                         v
                 +---------------+
                 | Check L1 Cache|
                 +---------------+
                    |         |
                   HIT       MISS
                    |         |
                    v         v
              Return Data  +---------------+
                          | Check L1 Redis |
                          +---------------+
                             |         |
                            HIT       MISS (Page Fault)
                             |         |
                             v         v
                       Promote &    +---------------+
                       Return      | Check L2 Chroma|
                                   +---------------+
                                      |         |
                                     HIT       MISS (Major Fault)
                                      |         |
                                      v         v
                                Promote &    +---------------+
                                Return      | Check L3 Mongo |
                                            +---------------+
                                               |         |
                                              HIT       MISS
                                               |         |
                                               v         v
                                         Promote &   Not Found
                                         Return
```

---

## 3. LRU Cache Algorithm Analysis

### 3.1 Algorithm Overview

**LRU (Least Recently Used)** is a page replacement algorithm that evicts the page that hasn't been accessed for the longest time. It's based on the **locality of reference** principle.

### 3.2 Data Structure Design

Traditional LRU implementations have O(n) eviction. We achieve O(1) using:

```
+---------------------------------------------------+
|                 HashMap (O(1) lookup)              |
|  key1 -> Node1, key2 -> Node2, key3 -> Node3      |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|            Doubly Linked List (O(1) ops)           |
|                                                   |
|  HEAD <-> [Node1] <-> [Node2] <-> [Node3] <-> TAIL|
|  (MRU)                                     (LRU)  |
+---------------------------------------------------+
```

### 3.3 Complexity Analysis

| Operation | Time | Space |
|-----------|------|-------|
| get() | O(1) | - |
| put() | O(1) | O(1) per entry |
| delete() | O(1) | - |
| evict() | O(1) | - |
| Total Space | - | O(n) |

### 3.4 Implementation Details

**Node Structure:**
```typescript
class LRUNode<T> {
    key: string;
    value: T;
    prev: LRUNode<T> | null = null;
    next: LRUNode<T> | null = null;
}
```

**Core Operations:**
- **GET**: HashMap lookup + move node to front
- **PUT**: HashMap insert + add to front + evict tail if full
- **EVICT**: Remove tail node + delete from HashMap

---

## 4. Redis Layer Deep Dive

### 4.1 Why Redis for L1?

| Feature | Benefit |
|---------|---------|
| In-memory storage | Sub-millisecond latency |
| Persistence (AOF) | Data survives restarts |
| Data structures | Sets for agent page tracking |
| TTL support | Automatic expiration |
| Atomic operations | Thread-safe operations |

### 4.2 Data Model

**Key Schema:**
```
memory:{agentId}:{key}     -> JSON serialized MemoryPage
memory:agent:{agentId}:pages -> Set of page keys for agent
```

### 4.3 Redis Operations Used

| Command | Purpose |
|---------|---------|
| `SET key value` | Store page data |
| `GET key` | Retrieve page data |
| `DEL key` | Delete page |
| `EXPIRE key seconds` | Set TTL |
| `EXISTS key` | Check existence |
| `SADD set member` | Track agent pages |
| `SREM set member` | Remove from tracking |
| `SMEMBERS set` | List agent pages |
| `FLUSHDB` | Clear all data |

---

## 5. ChromaDB Vector Search Implementation

### 5.1 Vector Database Concepts

**Vector Embedding**: Numerical representation of text that captures semantic meaning. Similar texts have similar vectors.

**Vector Search**: Finding the k most similar vectors to a query vector using distance metrics (cosine similarity, Euclidean distance).

### 5.2 HNSW Algorithm Overview

**HNSW (Hierarchical Navigable Small World)** is a graph-based approximate nearest neighbor algorithm:

```
Layer 2:  A --------- B
           \         /
            \       /
Layer 1:  A -- C -- B -- D
           \   |   /   /
            \  |  /   /
Layer 0:  A-C-E-B-F-D-G-H
```

- Build a multi-layer graph where higher layers have fewer nodes
- Search starts from top layer, greedily moving to closer nodes
- Descend to lower layers for refinement
- **Complexity**: O(log N) average case

### 5.3 Collection Schema

```typescript
// ChromaDB collection structure
{
    name: "agent_contexts",
    metadata: { description: "AI Agent Context Vectors" },
    
    // For each document:
    id: "{agentId}:{key}",           // Unique identifier
    embedding: number[],              // 768-dimensional vector
    document: string,                 // Original text (page.value)
    metadata: {
        agentId: string,
        key: string,
        level: "L2_VECTOR",
        status: string,
        createdAt: string,
        lastAccessedAt: string,
        accessCount: number,
        size: number
    }
}
```

---

## 6. MongoDB Persistent Storage

### 6.1 Why MongoDB for L3?

| Feature | Benefit |
|---------|---------|
| Document model | Flexible schema for metadata |
| Horizontal scaling | Sharding for large datasets |
| Indexes | Fast queries by agentId, key |
| Aggregation | Statistics and analytics |
| Durability | Write-ahead logging |

### 6.2 Schema Definition

```typescript
const MemoryPageSchema = new Schema({
    id: { type: String, required: true, unique: true },
    agentId: { type: String, required: true, index: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
    embedding: { type: [Number] },
    level: { type: String, enum: ['L1_CACHE', 'L2_VECTOR', 'L3_DISK'] },
    status: { type: String, enum: ['active', 'idle', 'swapped_out', 'evicted'] },
    accessCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    size: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed }
});

// Compound indexes
MemoryPageSchema.index({ agentId: 1, key: 1 }, { unique: true });
MemoryPageSchema.index({ agentId: 1, lastAccessedAt: -1 });
```

---

## 7. Vector Embedding Implementation

### 7.1 Embedding Fundamentals

**What are embeddings?**
- Dense vector representations of text
- Capture semantic meaning in geometric space
- Similar concepts have similar vectors

**nomic-embed-text model:**
- 768-dimensional output
- Trained on diverse text corpus
- Optimized for retrieval tasks

### 7.2 Cosine Similarity

Used to measure similarity between embeddings:

```typescript
calculateSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
```

**Properties:**
- Range: [-1, 1] (1 = identical, 0 = orthogonal, -1 = opposite)
- For normalized vectors: equivalent to dot product

---

## 8. System Integration

### 8.1 Initialization Flow

```typescript
async initialize(): Promise<void> {
    await Promise.all([
        this.l1Store.initialize(),    // Redis connection
        this.l2Store.initialize(),    // ChromaDB collection
        this.l3Store.initialize(),    // MongoDB connection
        this.embeddingService.initialize(), // Ollama check
    ]);
    this.initialized = true;
}
```

### 8.2 Write Path (PUT)

```
1. Validate request
2. Generate embedding via Ollama
3. Create MemoryPage object
4. Store in L1 (with potential eviction)
5. Store in L2 ChromaDB (with embedding)
6. Store in L3 MongoDB (for durability)
7. Return success
```

### 8.3 Read Path (GET)

```
1. Validate request
2. Check L1 in-memory cache
   -> Hit: Update access time, return
3. Check L1 Redis
   -> Hit: Promote to in-memory, return
4. Check L2 ChromaDB
   -> Hit: Promote to L1, return
5. Check L3 MongoDB
   -> Hit: Promote to L1 via L2, return
6. Return not found
```

### 8.4 Statistics Tracking

```typescript
interface MemoryManagerStats {
    l1Size: number;         // Current L1 cache size
    l1Capacity: number;     // L1 maximum capacity
    l2Size: number;         // L2 collection size
    l3Size: number;         // L3 document count
    totalAccesses: number;  // Total GET requests
    pageFaults: number;     // L3 hits (major faults)
    hits: number;           // Successful retrievals
    misses: number;         // Key not found
    hitRate: number;        // hits / totalAccesses * 100
    averageAccessTime: number; // Exponential moving average
    evictions: number;      // LRU evictions
    promotions: number;     // Lower to higher level moves
    demotions: number;      // Higher to lower level moves
}
```

---

## Conclusion

This technical deep dive has covered:

1. **OS Fundamentals**: How traditional memory management concepts map to AI agent context
2. **Paging**: Page structure, page tables, and fault handling
3. **LRU Algorithm**: O(1) implementation with HashMap + Doubly Linked List
4. **Redis**: Fast in-memory caching with persistence
5. **ChromaDB**: Vector-based semantic search
6. **MongoDB**: Durable long-term storage
7. **Embeddings**: Text-to-vector transformation for semantic similarity
8. **Integration**: How all components work together

The system successfully applies proven OS techniques to solve the AI agent context management problem.

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-25
**Technical Level:** Advanced
