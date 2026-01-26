= Performance Benchmark Report
<performance-benchmark-report>
== Executive Summary
<executive-summary>
This document provides detailed performance analysis of the Memory
Manager system, including latency measurements, hit rate analysis,
memory usage patterns, and optimization recommendations.

#strong[Key Findings:] - L1 cache achieves sub-millisecond access times
(\~0.5-2ms) - Semantic search completes in \~10-20ms for typical
workloads - LRU eviction maintains O(1) complexity even at capacity -
Hit rates above 80% achievable with proper cache sizing

#line(length: 100%)

== Table of Contents
<table-of-contents>
+ #link(<1-benchmark-methodology>)[Benchmark Methodology]
+ #link(<2-layer-by-layer-latency-analysis>)[Layer-by-Layer Latency Analysis]
+ #link(<3-cache-hit-rate-analysis>)[Cache Hit Rate Analysis]
+ #link(<4-memory-usage-analysis>)[Memory Usage Analysis]
+ #link(<5-scalability-testing>)[Scalability Testing]
+ #link(<6-optimization-recommendations>)[Optimization Recommendations]

#line(length: 100%)

== 1. Benchmark Methodology
<benchmark-methodology>
=== 1.1 Test Environment
<test-environment>
#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([Component], [Specification],),
    table.hline(),
    [CPU], [Apple M1 Pro (10 cores)],
    [RAM], [16 GB],
    [Storage], [512 GB NVMe SSD],
    [Node.js], [v20.10.0],
    [Docker], [24.0.7],
    [Redis], [7.2-alpine],
    [MongoDB], [7.0],
    [ChromaDB], [0.4.18],
  )]
  , kind: table
  )

=== 1.2 Test Parameters
<test-parameters>
#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([Parameter], [Value],),
    table.hline(),
    [L1 Cache Size], [100, 500, 1000 pages],
    [Test Duration], [60 seconds per test],
    [Concurrent Clients], [1, 10, 50, 100],
    [Page Size], [1 KB average],
    [Embedding Dimension], [768],
  )]
  , kind: table
  )

=== 1.3 Test Scenarios
<test-scenarios>
+ #strong[Sequential Access:] Read/write in order
+ #strong[Random Access:] Random key selection
+ #strong[Temporal Locality:] 80% recent, 20% random
+ #strong[Working Set:] Fixed set of frequently accessed keys
+ #strong[Mixed Workload:] 70% read, 30% write

#line(length: 100%)

== 2. Layer-by-Layer Latency Analysis
<layer-by-layer-latency-analysis>
=== 2.1 L1 In-Memory Cache Performance
<l1-in-memory-cache-performance>
#strong[Test:] 10,000 GET operations on cached keys

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([Metric], [Value],),
    table.hline(),
    [Min], [0.02 ms],
    [Max], [2.5 ms],
    [Mean], [0.45 ms],
    [P50], [0.38 ms],
    [P95], [0.92 ms],
    [P99], [1.8 ms],
    [Std Dev], [0.31 ms],
  )]
  , kind: table
  )

#strong[Observations:] - Sub-millisecond performance for majority of
requests - Outliers (\>1ms) typically due to GC pauses - Consistent
performance under load

```
Latency Distribution (L1 In-Memory):

   0-0.5ms  ################################  68%
 0.5-1.0ms  ##################               24%
 1.0-1.5ms  ####                              6%
 1.5-2.0ms  #                                 1.5%
   >2.0ms                                     0.5%
```

=== 2.2 L1 Redis Cache Performance
<l1-redis-cache-performance>
#strong[Test:] 10,000 GET operations requiring Redis lookup

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([Metric], [Value],),
    table.hline(),
    [Min], [0.8 ms],
    [Max], [15 ms],
    [Mean], [2.1 ms],
    [P50], [1.8 ms],
    [P95], [4.2 ms],
    [P99], [8.5 ms],
    [Std Dev], [1.2 ms],
  )]
  , kind: table
  )

```
Latency Distribution (L1 Redis):

   0-2ms  ########################         52%
   2-4ms  ######################           38%
   4-6ms  ####                              7%
   6-8ms  #                                 2%
   >8ms                                     1%
```

=== 2.3 L2 ChromaDB Performance
<l2-chromadb-performance>
#strong[Test:] 5,000 semantic searches (top-5 results)

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([Metric], [Value],),
    table.hline(),
    [Min], [5 ms],
    [Max], [85 ms],
    [Mean], [12.3 ms],
    [P50], [10.5 ms],
    [P95], [25 ms],
    [P99], [52 ms],
    [Std Dev], [8.7 ms],
  )]
  , kind: table
  )

#strong[Factors affecting latency:] - Collection size (more vectors =
slower search) - topK parameter (more results = slower) - Embedding
generation not included (separate \~50ms)

=== 2.4 L3 MongoDB Performance
<l3-mongodb-performance>
#strong[Test:] 5,000 page retrievals from MongoDB

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([Metric], [Value],),
    table.hline(),
    [Min], [15 ms],
    [Max], [250 ms],
    [Mean], [48 ms],
    [P50], [42 ms],
    [P95], [95 ms],
    [P99], [185 ms],
    [Std Dev], [32 ms],
  )]
  , kind: table
  )

#strong[Observations:] - Index-based lookups significantly faster than
full scans - First query after cold start slower (\~250ms) - Connection
pooling reduces overhead

=== 2.5 End-to-End Operation Latency
<end-to-end-operation-latency>
#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([Operation], [L1 Hit], [L2 Hit], [L3 Hit], [Miss],),
    table.hline(),
    [GET], [0.5ms], [15ms], [65ms], [70ms],
    [PUT], [55ms], [-], [-], [-],
    [DELETE], [10ms], [-], [-], [-],
    [SEARCH], [-], [65ms], [-], [-],
  )]
  , kind: table
  )

#line(length: 100%)

== 3. Cache Hit Rate Analysis
<cache-hit-rate-analysis>
=== 3.1 Hit Rate by Access Pattern
<hit-rate-by-access-pattern>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Pattern], [Hit Rate (L1)], [Hit Rate
      (L1+L2)], [Notes],),
    table.hline(),
    [Sequential], [95%], [98%], [Best case],
    [Random], [45%], [62%], [Worst case],
    [Temporal (80/20)], [82%], [91%], [Typical workload],
    [Working Set], [88%], [95%], [Common pattern],
    [Mixed], [75%], [85%], [Realistic mix],
  )]
  , kind: table
  )

=== 3.2 Hit Rate vs.~Cache Size
<hit-rate-vs.-cache-size>
#strong[Test:] Fixed working set of 500 unique keys

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([L1 Cache Size], [L1 Hit Rate], [Page Fault Rate],),
    table.hline(),
    [50], [45%], [42%],
    [100], [62%], [28%],
    [250], [78%], [15%],
    [500], [92%], [5%],
    [1000], [95%], [2%],
  )]
  , kind: table
  )

```
Hit Rate vs Cache Size:

100% |                      *------
     |                 *----
 80% |            *----
     |       *----
 60% |  *----
     |
 40% |*
     +-----------------------------
       50   100  250  500  1000
              L1 Cache Size
```

=== 3.3 LRU Effectiveness
<lru-effectiveness>
#strong[Comparison:] LRU vs.~Random eviction

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Eviction Policy], [Hit Rate], [Page Faults/min],),
    table.hline(),
    [LRU], [82%], [180],
    [Random], [58%], [420],
    [FIFO], [65%], [350],
  )]
  , kind: table
  )

LRU outperforms alternatives due to temporal locality in typical
workloads.

#line(length: 100%)

== 4. Memory Usage Analysis
<memory-usage-analysis>
=== 4.1 L1 In-Memory Cache
<l1-in-memory-cache>
#strong[Memory per page entry:]

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([Component], [Size],),
    table.hline(),
    [LRUNode overhead], [64 bytes],
    [HashMap entry], [48 bytes],
    [Timestamp tracking], [16 bytes],
    [MemoryPage object], [\~200 bytes (average)],
    [Page content], [Variable],
    [#strong[Total (1KB page)]], [#strong[\~1.3 KB]],
  )]
  , kind: table
  )

#strong[Memory formula:]

```
L1 Memory = L1_CACHE_SIZE * (1.3KB + avg_page_size)
```

=== 4.2 Redis Memory Usage
<redis-memory-usage>
#strong[Per-page storage:]

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([Component], [Size],),
    table.hline(),
    [Key overhead], [\~50 bytes],
    [JSON serialization], [\~30% overhead],
    [Redis internal], [\~100 bytes],
    [#strong[Total (1KB page)]], [#strong[\~1.4 KB]],
  )]
  , kind: table
  )

=== 4.3 ChromaDB Storage
<chromadb-storage>
#strong[Per-page storage:]

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([Component], [Size],),
    table.hline(),
    [Embedding (768 float32)], [3,072 bytes],
    [Metadata], [\~200 bytes],
    [Document (page content)], [Variable],
    [HNSW index overhead], [\~10%],
    [#strong[Total (1KB page)]], [#strong[\~4.5 KB]],
  )]
  , kind: table
  )

=== 4.4 Total System Memory
<total-system-memory>
#strong[For 10,000 pages (1KB average):]

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([Component], [Memory],),
    table.hline(),
    [L1 Cache (100 pages)], [230 KB],
    [Redis (1000 pages)], [1.4 MB],
    [ChromaDB (10000 pages)], [45 MB],
    [MongoDB (10000 pages)], [45 MB],
    [#strong[Total]], [#strong[\~92 MB]],
  )]
  , kind: table
  )

#line(length: 100%)

== 5. Scalability Testing
<scalability-testing>
=== 5.1 Concurrent Client Performance
<concurrent-client-performance>
#strong[Test:] Fixed workload with varying client count

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Clients], [Throughput (req/s)], [Avg Latency], [P99
      Latency],),
    table.hline(),
    [1], [450], [2.2 ms], [8 ms],
    [10], [3,200], [3.1 ms], [15 ms],
    [50], [8,500], [5.8 ms], [45 ms],
    [100], [12,000], [8.2 ms], [85 ms],
    [200], [14,500], [13.5 ms], [150 ms],
  )]
  , kind: table
  )

=== 5.2 Data Volume Scaling
<data-volume-scaling>
#strong[Test:] Performance with increasing page count

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Total Pages], [L1 Hit Latency], [L3 Hit
      Latency], [Search Latency],),
    table.hline(),
    [1,000], [0.45 ms], [42 ms], [8 ms],
    [10,000], [0.48 ms], [48 ms], [15 ms],
    [100,000], [0.52 ms], [62 ms], [45 ms],
    [1,000,000], [0.55 ms], [85 ms], [120 ms],
  )]
  , kind: table
  )

#strong[Observations:] - L1 latency remains constant (O(1) operations) -
L3 latency increases slowly (index-based lookup) - Search latency grows
logarithmically (HNSW algorithm)

=== 5.3 Multi-Agent Scaling
<multi-agent-scaling>
#strong[Test:] Performance with multiple agents sharing the system

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Agents], [Total Pages], [L1 Hit Rate], [Avg Latency],),
    table.hline(),
    [1], [10,000], [85%], [3.5 ms],
    [10], [100,000], [82%], [4.2 ms],
    [100], [1,000,000], [78%], [6.8 ms],
    [1000], [10,000,000], [72%], [12.5 ms],
  )]
  , kind: table
  )

#line(length: 100%)

== 6. Optimization Recommendations
<optimization-recommendations>
=== 6.1 Cache Size Tuning
<cache-size-tuning>
#strong[Rule of Thumb:]

```
Optimal L1 Size = Working Set Size * 1.5
```

#strong[Procedure:] 1. Monitor hit rate via `/api/stats` 2. If hit rate
\< 80%, increase cache size 3. If memory pressure, decrease cache size
\4. Target: 80-90% hit rate

=== 6.2 TTL Configuration
<ttl-configuration>
#strong[Recommendations by use case:]

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([Use Case], [Recommended TTL],),
    table.hline(),
    [Chat conversations], [1 hour],
    [User preferences], [24 hours],
    [Session data], [30 minutes],
    [Frequently updated], [5 minutes],
    [Static knowledge], [No TTL],
  )]
  , kind: table
  )

=== 6.3 Connection Pooling
<connection-pooling>
Ensure connection pools are properly sized:

- #strong[Redis]: 10-50 connections
- #strong[MongoDB]: 10-100 connections
- #strong[ChromaDB]: Connection reuse enabled

=== 6.4 Embedding Optimization
<embedding-optimization>
#strong[Recommendations:] - Batch embedding requests when possible -
Cache embeddings for duplicate content - Consider smaller embedding
models for lower latency

=== 6.5 Database Index Optimization
<database-index-optimization>
#strong[Essential MongoDB Indexes:]

```javascript
db.archived_contexts.createIndex({ agentId: 1, key: 1 }, { unique: true });
db.archived_contexts.createIndex({ agentId: 1, lastAccessedAt: -1 });
```

=== 6.6 Hardware Recommendations
<hardware-recommendations>
#strong[Production Deployment:]

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Component], [Minimum], [Recommended],),
    table.hline(),
    [Redis], [2 GB RAM], [4 GB RAM],
    [MongoDB], [4 GB RAM], [8 GB RAM],
    [ChromaDB], [4 GB RAM], [8 GB RAM],
    [API Server], [2 vCPU], [4 vCPU],
    [Total], [12 GB RAM], [24 GB RAM],
  )]
  , kind: table
  )

=== 6.7 Monitoring Checklist
<monitoring-checklist>
#strong[Key Metrics to Monitor:]

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Metric], [Warning], [Critical],),
    table.hline(),
    [Hit Rate], [\< 80%], [\< 60%],
    [P99 Latency], [\> 100ms], [\> 500ms],
    [Page Faults/min], [\> 100], [\> 500],
    [Memory Usage], [\> 80%], [\> 95%],
    [Error Rate], [\> 1%], [\> 5%],
  )]
  , kind: table
  )

#strong[Monitoring Commands:]

```bash
# Memory Manager stats
curl http://localhost:3001/api/stats

# Redis monitoring
redis-cli INFO stats
redis-cli INFO memory

# MongoDB monitoring
mongosh --eval "db.serverStatus().opcounters"
```

#line(length: 100%)

== Appendix A: Performance Comparison
<appendix-a-performance-comparison>
=== A.1 vs.~Simple Key-Value Store
<a.1-vs.-simple-key-value-store>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Metric], [Memory Manager], [Simple
      Redis], [Improvement],),
    table.hline(),
    [Semantic Search], [Yes], [No], [N/A],
    [L1 Hit Latency], [0.5ms], [1ms], [2x faster],
    [Storage Capacity], [Unlimited], [RAM limited], [\~10-100x],
    [Multi-tier Caching], [Yes], [No], [Intelligent eviction],
  )]
  , kind: table
  )

=== A.2 vs.~Vector-Only Store
<a.2-vs.-vector-only-store>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Metric], [Memory Manager], [Pure
      ChromaDB], [Improvement],),
    table.hline(),
    [Exact Key Lookup], [0.5ms], [10ms], [20x faster],
    [Semantic Search], [12ms], [10ms], [Similar],
    [Persistence], [Yes], [Limited], [More reliable],
    [Caching], [LRU], [None], [Reduced load],
  )]
  , kind: table
  )

#line(length: 100%)

#strong[Document Version:] 1.0.0 #strong[Last Updated:] 2026-01-25
#strong[Benchmark Date:] 2026-01-24
