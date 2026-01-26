= Learning Guide: OS Memory Management for AI Agents
<learning-guide-os-memory-management-for-ai-agents>
== Introduction
<introduction>
Welcome to this learning guide! This document will help you understand
how Operating System memory management concepts are applied to AI agent
context management.

#strong[Prerequisites:] - Basic programming knowledge (any language) -
Understanding of what AI/LLM agents are - No prior OS knowledge required

#strong[Learning Objectives:] 1. Understand memory hierarchy concepts 2.
Learn how paging and virtual memory work 3. Understand cache replacement
algorithms (LRU) 4. Apply these concepts to AI agent development

#line(length: 100%)

== Table of Contents
<table-of-contents>
+ #link(<1-memory-hierarchy-basics>)[Memory Hierarchy Basics]
+ #link(<2-understanding-paging>)[Understanding Paging]
+ #link(<3-lru-cache-algorithm>)[LRU Cache Algorithm]
+ #link(<4-applying-to-ai-agents>)[Applying to AI Agents]
+ #link(<5-hands-on-exercises>)[Hands-On Exercises]
+ #link(<6-practice-problems>)[Practice Problems]

#line(length: 100%)

== 1. Memory Hierarchy Basics
<memory-hierarchy-basics>
=== 1.1 The Speed vs.~Capacity Trade-off
<the-speed-vs.-capacity-trade-off>
Imagine you're studying for an exam. You have: - Your desk (fast access,
limited space) - Your bookshelf (slower, more capacity) - The library
(slowest, unlimited resources)

You keep the most important books on your desk for quick reference. When
your desk is full and you need a new book, you move the least used book
to the shelf.

#strong[This is exactly how computer memory works!]

```
Speed     <---------------------------- Capacity
Fast                                         Large
|                                              |
|  CPU Registers  (~1 nanosecond)             |
|       |                                      |
|   L1/L2 Cache   (~10 nanoseconds)           |
|       |                                      |
|    Main RAM     (~100 nanoseconds)          |
|       |                                      |
|   SSD Storage   (~100 microseconds)         |
|       |                                      |
|   HDD Storage   (~10 milliseconds)          |
|                                              |
```

=== 1.2 Why Do We Need This?
<why-do-we-need-this>
#strong[Problem:] Fast memory is expensive and limited.

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Type], [Speed], [Cost/GB], [Typical Size],),
    table.hline(),
    [CPU Register], [0.5ns], [N/A], [\~1KB],
    [L1 Cache], [1ns], [\$\$\$\$ | 32KB |
    | L2 Cache | 10ns | \$\$\$], [256KB],
    [RAM], [100ns], [\$\$], [8-64GB],
    [SSD], [100,000ns], [\$], [256GB-2TB],
    [HDD], [10,000,000ns], [\$], [1TB-10TB],
  )]
  , kind: table
  )

#strong[Solution:] Use a #strong[hierarchy] - keep frequently used data
in fast storage, move rarely used data to slow storage.

=== 1.3 Locality of Reference
<locality-of-reference>
Why does the hierarchy work? Because of #strong[locality]:

#strong[Temporal Locality:] If you accessed data recently, you'll
probably access it again soon. - Example: You keep checking the same
recipe while cooking

#strong[Spatial Locality:] If you accessed data at location X, you'll
probably access data near X soon. - Example: When reading a book, you
read consecutive pages

#line(length: 100%)

== 2. Understanding Paging
<understanding-paging>
=== 2.1 What is a Page?
<what-is-a-page>
A #strong[page] is a fixed-size chunk of memory. Instead of managing
individual bytes, the OS manages pages (typically 4KB).

#strong[Analogy:] Think of pages like shipping containers. It's easier
to track and move containers than individual items.

=== 2.2 Page Table
<page-table>
The #strong[page table] is like an address book that translates virtual
page numbers to physical frame numbers.

```
Each entry contains:
+----------+---------+----------+----------+------------+
| Frame #  | Present | Modified | Accessed | Permission |
+----------+---------+----------+----------+------------+
     |          |          |          |           |
     |          |          |          |           +- Read/Write?
     |          |          |          +- Recently used?
     |          |          +- Changed since loaded?
     |          +- Is page in RAM?
     +- Physical location
```

=== 2.3 Page Faults
<page-faults>
A #strong[page fault] occurs when a program tries to access a page
that's not in RAM.

#strong[What happens:] 1. Program tries to access page X 2. OS checks
page table - page X is on disk! 3. OS pauses the program 4. OS loads
page X from disk to RAM 5. OS updates page table 6. OS resumes the
program

#strong[In our Memory Manager:] - L1 miss -\> check L2 (minor page
fault) - L2 miss -\> check L3 (major page fault) - L3 miss -\> data
doesn't exist

#line(length: 100%)

== 3. LRU Cache Algorithm
<lru-cache-algorithm>
=== 3.1 The Cache Problem
<the-cache-problem>
When the cache is full and you need to add a new item, which item do you
remove?

#strong[Options:] - #strong[FIFO (First In, First Out):] Remove the
oldest item - #strong[LFU (Least Frequently Used):] Remove the least
accessed item - #strong[LRU (Least Recently Used):] Remove the item not
accessed for longest

=== 3.2 Why LRU?
<why-lru>
LRU is often the best choice because of #strong[temporal locality] -
recently used items are likely to be used again.

#strong[Example:]

```
Cache capacity: 3 items
Access sequence: A, B, C, A, D, B

Step 1: Access A -> Cache: [A]
Step 2: Access B -> Cache: [B, A]
Step 3: Access C -> Cache: [C, B, A]
Step 4: Access A -> Cache: [A, C, B]  (A moves to front)
Step 5: Access D -> Cache: [D, A, C]  (B evicted - it was LRU)
Step 6: Access B -> Cache: [B, D, A]  (C evicted - it was LRU)
```

=== 3.3 Implementing LRU Efficiently
<implementing-lru-efficiently>
#strong[Naive approach:] Linear search to find LRU - O(n) time

#strong[Smart approach:] HashMap + Doubly Linked List - O(1) time

```
HashMap for O(1) lookup:
+-------------------------------+
|  A -> Node1, B -> Node2, ...  |
+-------------------------------+
              |
              v
Doubly Linked List for O(1) reordering:
HEAD <-> [Node1:A] <-> [Node2:B] <-> [Node3:C] <-> TAIL
(MRU)                                            (LRU)
```

#strong[Operations:] - #strong[get(key):] HashMap lookup + move node to
front - #strong[put(key, value):] HashMap insert + add to front + evict
tail if full - #strong[evict():] Remove tail node + delete from HashMap

#line(length: 100%)

== 4. Applying to AI Agents
<applying-to-ai-agents>
=== 4.1 The AI Agent Memory Problem
<the-ai-agent-memory-problem>
AI agents like ChatGPT have limited #strong[context windows] (the amount
of text they can "remember" at once).

#strong[Challenge:] How do you maintain conversation history and
knowledge when: - Context window is limited (e.g., 8K-128K tokens) -
Conversations can be long - Agents need to remember user preferences -
Multiple agents share a system

=== 4.2 The Memory Manager Solution
<the-memory-manager-solution>
We apply OS concepts:

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([OS Concept], [AI Agent Equivalent],),
    table.hline(),
    [Page], [Context chunk (conversation, fact, preference)],
    [RAM], [Fast Redis cache],
    [Disk], [MongoDB storage],
    [Page Table], [Key -\> Location mapping],
    [Page Fault], [Cache miss],
    [LRU Eviction], [Remove old contexts],
  )]
  , kind: table
  )

#strong[Our Three-Tier Hierarchy:]

```
+-------------------------------------------------------+
|                    AI Agent Query                      |
|               "What did we discuss yesterday?"         |
+------------------------+------------------------------+
                         |
                         v
+-------------------------------------------------------+
|                   L1: Redis Cache                      |
|                                                       |
|  * Stores: Recent conversations                       |
|  * Speed: ~1ms                                        |
|  * Capacity: 100 pages                                |
|  * Eviction: LRU algorithm                            |
|                                                       |
|  Like your desk - quick access, limited space         |
+------------------------+------------------------------+
                         | Cache miss?
                         v
+-------------------------------------------------------+
|                  L2: ChromaDB Vectors                  |
|                                                       |
|  * Stores: Semantic embeddings                        |
|  * Speed: ~10ms                                       |
|  * Feature: Similarity search                         |
|  * Can find related contexts                          |
|                                                       |
|  Like a smart bookshelf - find related topics         |
+------------------------+------------------------------+
                         | Still not found?
                         v
+-------------------------------------------------------+
|                   L3: MongoDB Storage                  |
|                                                       |
|  * Stores: All historical data                        |
|  * Speed: ~50ms                                       |
|  * Capacity: Unlimited                                |
|  * Purpose: Long-term persistence                     |
|                                                       |
|  Like a library - everything is there, slower access  |
+-------------------------------------------------------+
```

=== 4.3 Semantic Search Bonus
<semantic-search-bonus>
Unlike traditional OS memory, our L2 layer adds #strong[semantic
search]:

- Traditional: "Give me page 42"
- Semantic: "Find contexts about weather discussions"

#strong[How it works:] 1. Convert text to vector (embedding) 2. Similar
concepts have similar vectors 3. Find the k nearest vectors to query

#line(length: 100%)

== 5. Hands-On Exercises
<hands-on-exercises>
=== Exercise 1: Trace LRU Operations
<exercise-1-trace-lru-operations>
Given an LRU cache with capacity 3, trace the state after each
operation:

```
Operations: PUT(A), PUT(B), PUT(C), GET(A), PUT(D), GET(B), GET(C)

Initial: []

After PUT(A): [A]
After PUT(B): [?, ?]
After PUT(C): [?, ?, ?]
After GET(A): [?, ?, ?]  # What order now?
After PUT(D): [?, ?, ?]  # What got evicted?
After GET(B): ?
After GET(C): ?
```

#strong[Solution:]

```
After PUT(A): [A]           # A is MRU
After PUT(B): [B, A]        # B is MRU
After PUT(C): [C, B, A]     # C is MRU
After GET(A): [A, C, B]     # A accessed, moves to front
After PUT(D): [D, A, C]     # B evicted (was LRU)
After GET(B): MISS!         # B was evicted
After GET(C): [C, D, A]     # C moves to front
```

=== Exercise 2: Calculate Hit Rate
<exercise-2-calculate-hit-rate>
Given these access patterns to a 3-page cache, calculate the hit rate:

```
Access sequence: A, B, C, A, D, A, B, E, A

Initial cache: empty
```

#strong[Solution:]

```
A: MISS (load A)        Cache: [A]
B: MISS (load B)        Cache: [B, A]
C: MISS (load C)        Cache: [C, B, A]
A: HIT  (access A)      Cache: [A, C, B]
D: MISS (evict B)       Cache: [D, A, C]
A: HIT  (access A)      Cache: [A, D, C]
B: MISS (evict C)       Cache: [B, A, D]
E: MISS (evict D)       Cache: [E, B, A]
A: HIT  (access A)      Cache: [A, E, B]

Hits: 3 (A, A, A)
Misses: 6 (A, B, C, D, B, E)
Total: 9
Hit Rate: 3/9 = 33.3%
```

#line(length: 100%)

== 6. Practice Problems
<practice-problems>
=== Problem 1: Page Table Lookup (Easy)
<problem-1-page-table-lookup-easy>
Given this page table:

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Page \#], [Frame \#], [Present], [Modified],),
    table.hline(),
    [0], [5], [Yes], [No],
    [1], [2], [Yes], [Yes],
    [2], [-], [No], [-],
    [3], [8], [Yes], [No],
  )]
  , kind: table
  )

Answer these questions: 1. What physical frame does virtual page 0 map
to? 2. Which page is not currently in memory? 3. Which page has been
written to (dirty)?

#strong[Answers:] 1. Frame 5 2. Page 2 (Present = No) 3. Page 1
(Modified = Yes)

=== Problem 2: LRU vs FIFO (Medium)
<problem-2-lru-vs-fifo-medium>
Compare LRU and FIFO for this access pattern with cache size 3:

```
Access: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5
```

Calculate hits for each policy.

#strong[Solution:]

#strong[FIFO:]

```
1: MISS [1]
2: MISS [1,2]
3: MISS [1,2,3]
4: MISS [2,3,4] (evict 1)
1: MISS [3,4,1] (evict 2)
2: MISS [4,1,2] (evict 3)
5: MISS [1,2,5] (evict 4)
1: HIT  [1,2,5]
2: HIT  [1,2,5]
3: MISS [2,5,3] (evict 1)
4: MISS [5,3,4] (evict 2)
5: HIT  [5,3,4]

FIFO Hits: 3/12 = 25%
```

#strong[LRU:]

```
1: MISS [1]
2: MISS [2,1]
3: MISS [3,2,1]
4: MISS [4,3,2] (evict 1)
1: MISS [1,4,3] (evict 2)
2: MISS [2,1,4] (evict 3)
5: MISS [5,2,1] (evict 4)
1: HIT  [1,5,2]
2: HIT  [2,1,5]
3: MISS [3,2,1] (evict 5)
4: MISS [4,3,2] (evict 1)
5: MISS [5,4,3] (evict 2)

LRU Hits: 2/12 = 16.7%
```

Note: In this specific pattern, FIFO slightly outperforms LRU!

#line(length: 100%)

== Summary
<summary>
You've learned:

+ #strong[Memory Hierarchy:] Speed vs.~capacity trade-off, locality of
  reference
+ #strong[Paging:] Pages, frames, page tables, page faults
+ #strong[LRU Algorithm:] O(1) implementation with HashMap + Linked List
+ #strong[AI Application:] Three-tier cache for agent context management
+ #strong[Bonus Features:] Semantic search with vector embeddings

#strong[Key Takeaways:] - OS concepts have broad applications beyond
traditional computing - LRU is effective due to temporal locality -
Vector embeddings enable semantic retrieval - Good system design
considers trade-offs

#line(length: 100%)

== Further Reading
<further-reading>
+ #strong[Operating Systems Concepts] by Silberschatz et al.~- Chapter
  9: Virtual Memory
+ #strong[Computer Architecture: A Quantitative Approach] by Hennessy &
  Patterson
+ #strong[LRU Cache in LeetCode] - Problem \#146
+ #strong[ChromaDB Documentation] - Vector database fundamentals
+ #strong[Ollama Embedding Models] - nomic-embed-text specifications

#line(length: 100%)

#strong[Document Version:] 1.0.0 #strong[Last Updated:] 2026-01-25
#strong[Difficulty Level:] Beginner to Intermediate
