# Memory Manager - OS Paging for AI Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-94.44%25-brightgreen)](https://github.com/YOUR_USERNAME/memory-manager)

> Applies Operating Systems paging and virtual memory concepts to AI agent context management

[![Star us on GitHub](https://img.shields.io/badge/⭐-Star%20us%20on%20GitHub-yellow?style=social)](https://github.com/YOUR_USERNAME/memory-manager)

---

## Overview

Implements a three-tier hierarchical memory architecture with LRU cache eviction, page fault handling, and semantic search for AI agents.

**Status:** ✅ Complete - All 57 tests passing (94.44% coverage)

## Architecture

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

## Features

- **Three-tier memory hierarchy** (L1 Redis → L2 ChromaDB → L3 MongoDB)
- **LRU cache eviction** - Automatically evicts least recently used pages
- **Page fault handling** - Transparent promotion from lower levels
- **Semantic search** - Vector-based similarity search across contexts
- **Multi-agent support** - Isolated memory per agent
- **REST API** - Simple HTTP interface for memory operations

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Ollama with nomic-embed-text model

### Installation

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

### Usage

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

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/memory/get` | Get value from memory |
| POST | `/api/memory/put` | Store value in memory |
| DELETE | `/api/memory` | Delete from memory |
| POST | `/api/memory/search` | Semantic search |
| GET | `/api/stats` | Memory statistics |
| POST | `/api/memory/clear` | Clear all memory |

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Results

- **57/57 tests passing** (100%)
- **94.44% code coverage**
- Domain Models: 12/12 passing
- LRU Cache: 45/45 passing

## OS Concepts Applied

| OS Concept | AI Application | Implementation |
|------------|----------------|----------------|
| Paging | Context storage | MemoryPage as unit |
| Page Table | Address translation | PageTableEntry mapping |
| LRU Eviction | Cache management | Doubly-linked list cache |
| Page Fault | Cache miss handling | Automatic promotion |
| Virtual Memory | Memory hierarchy | Three-tier levels |
| Thrashing Prevention | Access pattern tracking | Statistics & monitoring |

## Configuration

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

## Project Structure

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

## Performance

### Access Times (expected)

| Operation | L1 Hit | L2 Hit | L3 Hit (Page Fault) |
|-----------|--------|--------|---------------------|
| GET | ~1ms | ~10ms | ~50ms |
| PUT | ~5ms | ~15ms | ~60ms |
| Search | N/A | ~20ms | N/A |

### Memory Efficiency

- **L1 Capacity**: Configurable (default: 100 pages)
- **Hit Rate Target**: >80% for optimal performance
- **Page Fault Rate**: <20% acceptable

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'feat: add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

For security concerns, please see [SECURITY.md](SECURITY.md) and report vulnerabilities responsibly.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

This project is licensed under the [MIT License](LICENSE).

## Technologies

- **TypeScript** 5.9 - Type-safe development
- **Node.js** 20 LTS - Runtime environment
- **Redis** 7.2 - L1 cache
- **ChromaDB** 1.8 - L2 vector database
- **MongoDB** 7.0 - L3 persistent storage
- **Ollama** - Local LLM embeddings
- **Express.js** 4.18 - REST API
- **Zod** 3.22 - Schema validation
- **Jest** 29.7 - Testing framework

## Documentation

- [Implementation Report](./IMPLEMENTATION_REPORT.md) - Detailed implementation documentation
- [Domain Models](./src/domain/models.ts) - Core data structures
- [API Endpoints](./src/server.ts) - REST API documentation

## Acknowledgments

**Part of:** 2025 Hongik University Computer Science Graduation Project  
**Topic:** OS Concepts Applied to AI/LLM Agents  
**Status:** ✅ Complete
