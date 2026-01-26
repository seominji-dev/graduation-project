= Memory Manager - OS Paging for AI Agents
<memory-manager---os-paging-for-ai-agents>
#strong[MIT License]
#strong[Node.js >= 20.0.0]
#strong[TypeScript 5.9]
#strong[Coverage: 97.08%]

#quote(block: true)[
Applies Operating Systems paging and virtual memory concepts to AI agent
context management
]

#link("https://github.com")[Star on GitHub]

#line(length: 100%)

== Overview
<overview>
Implements a three-tier hierarchical memory architecture with LRU cache
eviction, page fault handling, and semantic search for AI agents.

#strong[Status:] ✅ Complete - All 57 tests passing (94.44% coverage)

== Architecture
<architecture>
```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Application                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Hierarchical Memory Manager                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │   L1    │  │   L2    │  │   L3    │                     │
│  │  Redis  │◄─┤ChromaDB │◄─┤ MongoDB │                     │
│  │  ~1ms   │  │  ~10ms  │  │  ~50ms  │                     │
│  └────┬────┘  └────┬────┘  └────┬────┘                     │
│       │            │            │                          │
│       ▼            ▼            ▼                          │
│  Fast Cache   Vector Search  Long-term                    │
│  (Hot Data)   (Semantic)     Storage                      │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Ollama Embedding Service                       │
│           (nomic-embed-text model)                         │
└─────────────────────────────────────────────────────────────┘
```

== Features
<features>
- #strong[Three-tier memory hierarchy] (L1 Redis → L2 ChromaDB → L3
  MongoDB)
- #strong[LRU cache eviction] - Automatically evicts least recently used
  pages
- #strong[Page fault handling] - Transparent promotion from lower levels
- #strong[Semantic search] - Vector-based similarity search across
  contexts
- #strong[Multi-agent support] - Isolated memory per agent
- #strong[REST API] - Simple HTTP interface for memory operations

== Quick Start
<quick-start>
=== Prerequisites
<prerequisites>
- Node.js 20+
- Docker & Docker Compose
- Ollama with nomic-embed-text model

=== Installation
<installation>
```bash
# Clone and navigate
cd candidates/candidate-2-memory-manager

# Install dependencies
npm install

# Start infrastructure services
docker-compose up -d

# Pull Ollama embedding model
ollama pull nomic-embed-text

# Start API server
npm run dev
```

=== Usage
<usage>
```bash
# Store a value
curl -X POST http://localhost:3001/api/memory/put \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-001",
    "key": "conversation:123",
    "value": "User asked about the weather"
  }'

# Retrieve a value
curl -X POST http://localhost:3001/api/memory/get \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-001",
    "key": "conversation:123"
  }'

# Semantic search
curl -X POST http://localhost:3001/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-001",
    "query": "weather discussion",
    "topK": 5
  }'

# Get statistics
curl http://localhost:3001/api/stats
```

== API Endpoints
<api-endpoints>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Method], [Endpoint], [Description],),
    table.hline(),
    [GET], [`/api/health`], [Health check],
    [POST], [`/api/memory/get`], [Get value from memory],
    [POST], [`/api/memory/put`], [Store value in memory],
    [DELETE], [`/api/memory`], [Delete from memory],
    [POST], [`/api/memory/search`], [Semantic search],
    [GET], [`/api/stats`], [Memory statistics],
    [POST], [`/api/memory/clear`], [Clear all memory],
  )]
  , kind: table
  )

== Testing
<testing>
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

=== Test Results
<test-results>
- #strong[57/57 tests passing] (100%)
- #strong[94.44% code coverage]
- Domain Models: 12/12 passing
- LRU Cache: 45/45 passing

== OS Concepts Applied
<os-concepts-applied>
#figure(
  align(center)[#table(
    columns: (27.27%, 36.36%, 36.36%),
    align: (auto,auto,auto,),
    table.header([OS Concept], [AI Application], [Implementation],),
    table.hline(),
    [Paging], [Context storage], [MemoryPage as unit],
    [Page Table], [Address translation], [PageTableEntry mapping],
    [LRU Eviction], [Cache management], [Doubly-linked list cache],
    [Page Fault], [Cache miss handling], [Automatic promotion],
    [Virtual Memory], [Memory hierarchy], [Three-tier levels],
    [Thrashing Prevention], [Access pattern tracking], [Statistics &
    monitoring],
  )]
  , kind: table
  )

== Configuration
<configuration>
Environment variables (`.env`):

```bash
# L1 Cache (Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
L1_CACHE_SIZE=100
L1_TTL=300000  # 5 minutes

# L2 Vector DB (ChromaDB)
CHROMADB_HOST=localhost
CHROMADB_PORT=8000

# L3 Storage (MongoDB)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=memory_manager

# Embeddings (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

== Project Structure
<project-structure>
```
src/
├── domain/
│   └── models.ts              # Domain models & schemas
├── managers/
│   ├── LRUCache.ts            # LRU cache implementation
│   └── HierarchicalMemoryManager.ts  # Core memory manager
├── infrastructure/
│   ├── RedisClient.ts         # L1 cache client
│   ├── ChromaDBClient.ts      # L2 vector DB client
│   └── MongoDBClient.ts       # L3 storage client
├── services/
│   └── OllamaEmbeddingService.ts  # Embedding generation
├── config/
│   └── config.ts              # Configuration
├── api/
│   └── routes.ts              # API routes
├── server.ts                  # Express server
└── index.ts                   # Main exports

tests/
├── unit/
│   ├── domain/
│   │   └── models.test.ts     # Domain model tests
│   └── managers/
│       └── LRUCache.test.ts   # LRU cache tests
└── integration/
    └── memory-manager.test.ts # Integration tests
```

== Performance
<performance>
=== Access Times (expected)
<access-times-expected>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([Operation], [L1 Hit], [L2 Hit], [L3 Hit (Page Fault)],),
    table.hline(),
    [GET], [\~1ms], [\~10ms], [\~50ms],
    [PUT], [\~5ms], [\~15ms], [\~60ms],
    [Search], [N/A], [\~20ms], [N/A],
  )]
  , kind: table
  )

=== Memory Efficiency
<memory-efficiency>
- #strong[L1 Capacity]: Configurable (default: 100 pages)
- #strong[Hit Rate Target]: \>80% for optimal performance
- #strong[Page Fault Rate]: \<20% acceptable

== Contributing
<contributing>
Contributions are welcome! Please see #link("CONTRIBUTING.md") for
details.

+ Fork the repository
+ Create a feature branch (`git checkout -b feature/amazing-feature`)
+ Commit (`git commit -m 'feat: add amazing feature'`)
+ Push (`git push origin feature/amazing-feature`)
+ Open a Pull Request

== Security
<security>
For security concerns, please see #link("SECURITY.md") and report
vulnerabilities responsibly.

== Changelog
<changelog>
See #link("CHANGELOG.md") for version history.

== License
<license>
This project is licensed under the #link("LICENSE")[MIT License].

== Technologies
<technologies>
- #strong[TypeScript] 5.9 - Type-safe development
- #strong[Node.js] 20 LTS - Runtime environment
- #strong[Redis] 7.2 - L1 cache
- #strong[ChromaDB] 1.8 - L2 vector database
- #strong[MongoDB] 7.0 - L3 persistent storage
- #strong[Ollama] - Local LLM embeddings
- #strong[Express.js] 4.18 - REST API
- #strong[Zod] 3.22 - Schema validation
- #strong[Jest] 29.7 - Testing framework

== Documentation
<documentation>
- #link("./IMPLEMENTATION_REPORT.md")[Implementation Report] - Detailed
  implementation documentation
- #link("./src/domain/models.ts")[Domain Models] - Core data structures
- #link("./src/server.ts")[API Endpoints] - REST API documentation

== Acknowledgments
<acknowledgments>
#strong[Part of:] 2025 Hongik University Computer Science Graduation
Project \
#strong[Topic:] OS Concepts Applied to AI/LLM Agents \
#strong[Status:] ✅ Complete
