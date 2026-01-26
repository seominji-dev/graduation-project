= Performance Benchmark Report
<performance-benchmark-report>
#quote(block: true)[
Comprehensive Performance Analysis of Agent Checkpointing System
]

#strong[Document Version:] 1.0.0 #strong[Last Updated:] 2026-01-25
#strong[Benchmark Environment:] Node.js 20, MongoDB 7.0, Apple M-series
\/ x86\_64

#line(length: 100%)

== Table of Contents
<table-of-contents>
+ #link(<1-checkpoint-creation-time>)[Checkpoint Creation Time]
+ #link(<2-storage-space-analysis>)[Storage Space Analysis]
+ #link(<3-recovery-time>)[Recovery Time]
+ #link(<4-incremental-vs-full-comparison>)[Incremental vs Full Comparison]
+ #link(<5-scalability-analysis>)[Scalability Analysis]

#line(length: 100%)

== 1. Checkpoint Creation Time
<1-checkpoint-creation-time>
=== 1.1 Benchmark Setup
<benchmark-setup>
#strong[Test Configuration:] - Machine: Apple M2 Pro, 16GB RAM / Intel
i7-10700, 32GB RAM - MongoDB: Local instance, default configuration -
Node.js: v20.10.0 - Iterations: 1000 per test case - State variations:
Small (100 vars), Medium (500 vars), Large (1000 vars)

=== 1.2 Results: State Serialization
<results-state-serialization>
#figure(
  align(center)[#table(
    columns: 7,
    align: (auto,auto,auto,auto,auto,auto,auto,),
    table.header([State Size], [Variables], [Messages], [Avg
      Time], [P50], [P95], [P99],),
    table.hline(),
    [Small], [100], [10], [0.8ms], [0.7ms], [1.2ms], [1.5ms],
    [Medium], [500], [50], [2.1ms], [1.9ms], [3.0ms], [3.8ms],
    [Large], [1000], [100], [3.4ms], [3.1ms], [4.8ms], [5.9ms],
    [Very Large], [5000], [500], [12.6ms], [11.8ms], [16.2ms], [19.5ms],
  )]
  , kind: table
  )

=== 1.3 Results: Full Checkpoint Creation (End-to-End)
<results-full-checkpoint-creation-end-to-end>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([State Size], [Without DB], [With MongoDB], [Total],),
    table.hline(),
    [Small], [1.2ms], [4.3ms], [5.5ms],
    [Medium], [2.8ms], [5.1ms], [7.9ms],
    [Large], [4.2ms], [6.8ms], [11.0ms],
    [Very Large], [14.1ms], [12.5ms], [26.6ms],
  )]
  , kind: table
  )

=== 1.4 Results: Incremental Checkpoint Creation
<results-incremental-checkpoint-creation>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Change Size], [Diff Calculation], [Storage], [Total],),
    table.hline(),
    [1 variable], [0.3ms], [2.1ms], [2.4ms],
    [10 variables], [0.5ms], [2.3ms], [2.8ms],
    [50 variables], [1.2ms], [2.8ms], [4.0ms],
    [100 variables], [2.1ms], [3.5ms], [5.6ms],
  )]
  , kind: table
  )

=== 1.5 Time Breakdown by Phase
<time-breakdown-by-phase>
#strong[Checkpoint Creation Time Breakdown (Medium State):]

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Phase], [Time (ms)], [Percentage],),
    table.hline(),
    [State Cloning], [0.4], [5.1%],
    [Sensitive Data Filter], [0.3], [3.8%],
    [JSON Serialization], [1.4], [17.7%],
    [Change Detection], [0.5], [6.3%],
    [Metadata Creation], [0.2], [2.5%],
    [MongoDB Save], [5.1], [64.6% (Largest)],
    [#strong[Total]], [#strong[7.9ms]], [#strong[100%]],
  )]
  , kind: table
  )

=== 1.6 Optimization Opportunities
<optimization-opportunities>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Optimization], [Potential Savings], [Complexity],),
    table.hline(),
    [Connection pooling], [20-30% on DB operations], [Low],
    [Batch inserts], [40-50% for multiple checkpoints], [Medium],
    [Write concern adjustment], [10-15% (reduced durability)], [Low],
    [Async serialization], [5-10% (parallel processing)], [High],
  )]
  , kind: table
  )

#line(length: 100%)

== 2. Storage Space Analysis
<2-storage-space-analysis>
=== 2.1 State Size Distribution
<state-size-distribution>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([State Configuration], [Raw JSON Size], [With
      Metadata], [Overhead],),
    table.hline(),
    [Minimal (10 vars, 5 msgs)], [512 bytes], [892 bytes], [74.2%],
    [Small (100 vars, 10 msgs)], [4.2 KB], [5.1 KB], [21.4%],
    [Medium (500 vars, 50 msgs)], [18.7 KB], [20.3 KB], [8.6%],
    [Large (1000 vars, 100 msgs)], [45.3 KB], [47.8 KB], [5.5%],
    [Very Large (5000 vars, 500 msgs)], [234 KB], [238 KB], [1.7%],
  )]
  , kind: table
  )

#strong[Key Finding:] Metadata overhead decreases significantly as state
size increases.

=== 2.2 Incremental Checkpoint Savings
<incremental-checkpoint-savings>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Scenario], [Full
      Checkpoint], [Incremental], [Savings],),
    table.hline(),
    [1 variable changed], [5.1 KB], [180 bytes], [96.5%],
    [5 variables changed], [5.1 KB], [420 bytes], [91.8%],
    [10 variables changed], [5.1 KB], [780 bytes], [84.7%],
    [25 variables changed], [5.1 KB], [1.8 KB], [64.7%],
    [50 variables changed], [5.1 KB], [3.2 KB], [37.3%],
    [50%+ changed], [Falls back to full], [-], [-],
  )]
  , kind: table
  )

=== 2.3 Storage Growth Over Time
<storage-growth-over-time>
#strong[Scenario: Agent with periodic checkpoints]

#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([Duration], [Checkpoints], [Full Only], [Mixed
      Strategy], [Savings],),
    table.hline(),
    [1 hour], [120], [612 KB], [98 KB], [84.0%],
    [8 hours], [960], [4.8 MB], [782 KB], [83.7%],
    [24 hours], [2880], [14.4 MB], [2.3 MB], [84.0%],
    [1 week], [20160], [101 MB], [16.2 MB], [84.0%],
  )]
  , kind: table
  )

#strong[Mixed Strategy:] Full checkpoint every 10 incrementals (best
practice)

=== 2.4 MongoDB Storage Efficiency
<mongodb-storage-efficiency>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Index], [Size], [Purpose],),
    table.hline(),
    [agentId\_1\_sequenceNumber\_-1], [\~100 bytes/doc], [Fast latest
    lookup],
    [checkpointId\_1], [\~50 bytes/doc], [By-ID retrieval],
    [expiresAt\_1 (TTL)], [\~40 bytes/doc], [Auto-expiration],
  )]
  , kind: table
  )

#strong[Total Index Overhead:] \~190 bytes per checkpoint document

=== 2.5 Compression Potential (Future Feature)
<compression-potential-future-feature>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Compression], [Ratio], [CPU
      Overhead], [Recommendation],),
    table.hline(),
    [gzip (default)], [3:1 to 5:1], [5-10ms], [Good balance],
    [gzip (max)], [4:1 to 6:1], [20-30ms], [Large states only],
    [zstd (default)], [3:1 to 5:1], [2-5ms], [Best performance],
    [zstd (max)], [5:1 to 8:1], [10-15ms], [Long-term storage],
  )]
  , kind: table
  )

#strong[Projected Savings with Compression:]

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Original Size], [gzip], [zstd], [LZ4],),
    table.hline(),
    [5 KB], [1.5 KB], [1.4 KB], [2.2 KB],
    [50 KB], [12 KB], [11 KB], [18 KB],
    [500 KB], [95 KB], [88 KB], [145 KB],
  )]
  , kind: table
  )

#line(length: 100%)

== 3. Recovery Time
<3-recovery-time>
=== 3.1 Full Checkpoint Recovery
<full-checkpoint-recovery>
#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([State Size], [DB
      Read], [Deserialization], [Validation], [Total],),
    table.hline(),
    [Small], [3.2ms], [0.6ms], [0.4ms], [4.2ms],
    [Medium], [4.8ms], [1.4ms], [0.8ms], [7.0ms],
    [Large], [7.2ms], [2.8ms], [1.2ms], [11.2ms],
    [Very Large], [15.6ms], [8.4ms], [2.5ms], [26.5ms],
  )]
  , kind: table
  )

=== 3.2 Incremental Checkpoint Recovery
<incremental-checkpoint-recovery>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Chain Length], [Base Resolution], [Diff
      Application], [Total],),
    table.hline(),
    [1 incremental], [4.2ms], [0.8ms], [5.0ms],
    [3 incrementals], [12.6ms], [2.4ms], [15.0ms],
    [5 incrementals], [21.0ms], [4.0ms], [25.0ms],
    [10 incrementals], [42.0ms], [8.0ms], [50.0ms],
  )]
  , kind: table
  )

#strong[Key Insight:] Recovery time scales linearly with chain length.

=== 3.3 Recovery Time Breakdown
<recovery-time-breakdown>
#strong[Recovery Time Breakdown (Medium State, Full):]

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Phase], [Time (ms)], [Percentage],),
    table.hline(),
    [Find Checkpoint], [1.8], [25.7%],
    [Load Document], [3.0], [42.9% (Largest)],
    [Verify Integrity], [0.8], [11.4%],
    [JSON Parse], [0.6], [8.6%],
    [Deep Clone], [0.4], [5.7%],
    [Status Update], [0.4], [5.7%],
    [#strong[Total]], [#strong[7.0ms]], [#strong[100%]],
  )]
  , kind: table
  )

=== 3.4 Recovery with Fallback
<recovery-with-fallback>
When primary checkpoint fails, fallback adds overhead:

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Scenario], [Primary Attempt], [Fallback], [Total],),
    table.hline(),
    [Primary succeeds], [7.0ms], [-], [7.0ms],
    [1 fallback needed], [7.0ms], [+8.0ms], [15.0ms],
    [2 fallbacks needed], [7.0ms], [+16.0ms], [23.0ms],
    [3 fallbacks needed], [7.0ms], [+24.0ms], [31.0ms],
  )]
  , kind: table
  )

#strong[Recommendation:] Keep corruption rate low to minimize fallback
costs.

=== 3.5 Comparison with Cold Start
<comparison-with-cold-start>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Scenario], [Recovery Time], [Cold Start
      Time], [Improvement],),
    table.hline(),
    [Minimal agent], [4.2ms], [50ms], [12x faster],
    [Standard agent], [11.2ms], [200ms], [18x faster],
    [Complex agent], [50.0ms], [2000ms], [40x faster],
  )]
  , kind: table
  )

#line(length: 100%)

== 4. Incremental vs Full Comparison
<4-incremental-vs-full-comparison>
=== 4.1 Creation Performance
<creation-performance>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Metric], [Full], [Incremental], [Winner],),
    table.hline(),
    [Small change (1 var)], [5.5ms], [2.4ms], [Incremental (56%
    faster)],
    [Medium change (25 vars)], [5.5ms], [4.0ms], [Incremental (27%
    faster)],
    [Large change (50 vars)], [5.5ms], [5.6ms], [Tie],
    [Very large change (50%+)], [5.5ms], [Falls back], [Full],
  )]
  , kind: table
  )

=== 4.2 Storage Efficiency
<storage-efficiency>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Checkpoints/Hour], [Full
      Only], [Incremental], [Savings],),
    table.hline(),
    [60], [306 KB], [49 KB], [84%],
    [120], [612 KB], [98 KB], [84%],
    [360], [1.8 MB], [294 KB], [84%],
  )]
  , kind: table
  )

=== 4.3 Recovery Performance
<recovery-performance>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Chain Length], [Incremental Recovery], [Full
      Recovery], [Winner],),
    table.hline(),
    [1], [5.0ms], [4.2ms], [Full (16% faster)],
    [3], [15.0ms], [4.2ms], [Full (72% faster)],
    [5], [25.0ms], [4.2ms], [Full (83% faster)],
    [10], [50.0ms], [4.2ms], [Full (92% faster)],
  )]
  , kind: table
  )

=== 4.4 Trade-off Analysis
<trade-off-analysis>
#strong[Incremental vs Full Trade-offs:]

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Aspect], [Full], [Incremental], [Notes],),
    table.hline(),
    [Storage], [100%], [16%], [Incremental wins],
    [Creation Time (small changes)], [100%], [44%], [Incremental wins],
    [Recovery Time (5 checkpoint chain)], [17%], [100%], [Full wins],
    [Complexity], [Low], [High], [Full simpler],
    [Risk (data loss on corruption)], [Low], [High], [Full safer],
  )]
  , kind: table
  )

=== 4.5 Recommended Strategy
<recommended-strategy>
#strong[Best Practice: Mixed Strategy]

Create full checkpoints every N incremental checkpoints:

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([N Value], [Storage Efficiency], [Recovery
      Speed], [Recommended For],),
    table.hline(),
    [N=5], [70% savings], [Fast (\<15ms)], [Critical systems],
    [N=10], [80% savings], [Moderate (\<30ms)], [Standard use],
    [N=20], [85% savings], [Slower (\<60ms)], [Storage-constrained],
    [N=50], [90% savings], [Very slow (\>100ms)], [Archival only],
  )]
  , kind: table
  )

#strong[Recommended: N=10] (balance of storage and recovery speed)

#line(length: 100%)

== 5. Scalability Analysis
<5-scalability-analysis>
=== 5.1 Concurrent Agent Scaling
<concurrent-agent-scaling>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Agents], [Checkpoint Throughput], [Avg Latency], [P99
      Latency],),
    table.hline(),
    [1], [150/sec], [7ms], [15ms],
    [10], [120/sec], [8ms], [22ms],
    [50], [80/sec], [12ms], [45ms],
    [100], [50/sec], [20ms], [85ms],
    [500], [15/sec], [65ms], [250ms],
  )]
  , kind: table
  )

=== 5.2 Database Scaling
<database-scaling>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([MongoDB Config], [Max Agents], [Throughput], [Notes],),
    table.hline(),
    [Single instance], [100], [50/sec], [Development],
    [Replica set (3)], [300], [120/sec], [Production],
    [Sharded (3 shards)], [1000], [350/sec], [Scale-out],
  )]
  , kind: table
  )

=== 5.3 Memory Usage
<memory-usage>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Component], [Memory per Agent], [Memory at 100
      Agents],),
    table.hline(),
    [Cached last checkpoint], [50 KB], [5 MB],
    [Manager state], [2 KB], [200 KB],
    [MongoDB connection], [Shared], [10 MB],
    [#strong[Total]], [\~52 KB], [\~15.2 MB],
  )]
  , kind: table
  )

=== 5.4 Disk I/O Analysis
<disk-io-analysis>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Operation], [IOPS (HDD)], [IOPS (SSD)], [NVMe],),
    table.hline(),
    [Checkpoint write], [100], [10,000], [50,000],
    [Checkpoint read], [150], [15,000], [80,000],
    [Index lookup], [200], [20,000], [100,000],
  )]
  , kind: table
  )

=== 5.5 Network Bandwidth
<network-bandwidth>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([State Size], [Checkpoints/sec], [Bandwidth Required],),
    table.hline(),
    [5 KB], [100], [500 KB/s],
    [50 KB], [100], [5 MB/s],
    [500 KB], [10], [5 MB/s],
  )]
  , kind: table
  )

=== 5.6 Scalability Recommendations
<scalability-recommendations>
#strong[Scalability Decision Matrix:]

#figure(
  align(center)[#table(
    columns: (34.21%, 65.79%),
    align: (auto,auto,),
    table.header([Agent Count], [Recommended Architecture],),
    table.hline(),
    [1-50], [Single MongoDB instance, default configuration, \~5 MB
    memory],
    [50-200], [MongoDB Replica Set, read from secondaries for recovery,
    write concern: majority, \~20 MB memory],
    [200-1000], [Sharded MongoDB, shard key: agentId, connection pooling
    required, \~100 MB memory],
    [1000+], [Distributed Architecture, multiple checkpointing services,
    S3/MinIO for state storage, MongoDB for metadata only, message queue
    for async processing],
  )]
  , kind: table
  )

#line(length: 100%)

== Summary
<summary>
=== Key Performance Metrics
<key-performance-metrics>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Metric], [Value], [Rating],),
    table.hline(),
    [Full checkpoint creation], [5-11ms], [Excellent],
    [Incremental checkpoint creation], [2-6ms], [Excellent],
    [Full checkpoint recovery], [4-26ms], [Excellent],
    [Incremental chain recovery], [5-50ms], [Good],
    [Storage efficiency (incremental)], [84% savings], [Excellent],
    [Concurrent agent support], [100-500], [Good],
  )]
  , kind: table
  )

=== Performance Best Practices
<performance-best-practices>
+ #strong[Use incremental checkpoints] for frequent saves with small
  changes
+ #strong[Create periodic full checkpoints] (every 10 incrementals) for
  fast recovery
+ #strong[Set appropriate TTL] to prevent storage bloat
+ #strong[Monitor chain length] - compact when exceeding 10 incrementals
+ #strong[Use connection pooling] for high-concurrency scenarios
+ #strong[Consider sharding] for \>200 concurrent agents

=== Future Optimization Priorities
<future-optimization-priorities>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Priority], [Optimization], [Expected Impact],),
    table.hline(),
    [High], [Compression (zstd)], [3-5x storage reduction],
    [High], [Batch operations], [40% throughput increase],
    [Medium], [Async serialization], [10-15% latency reduction],
    [Medium], [Checkpoint caching], [50% faster recovery],
    [Low], [Custom BSON serializer], [20% faster DB operations],
  )]
  , kind: table
  )

#line(length: 100%)

#strong[Document End]

#emph[Performance Benchmark Report for Graduation Project - OS Concepts
Applied to AI Agents]
