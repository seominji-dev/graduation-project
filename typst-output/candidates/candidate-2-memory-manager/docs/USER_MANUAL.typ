= User Manual: Memory Manager
<user-manual-memory-manager>
== Quick Start
<quick-start>
Get the Memory Manager running in 5 minutes.

=== Prerequisites
<prerequisites>
- Node.js 20 or higher
- Docker and Docker Compose
- Ollama installed locally

=== Installation Steps
<installation-steps>
```bash
# 1. Navigate to project directory
cd candidates/candidate-2-memory-manager

# 2. Install Node.js dependencies
npm install

# 3. Start infrastructure services
docker-compose up -d

# 4. Pull the embedding model
ollama pull nomic-embed-text

# 5. Create environment file
cp .env.example .env

# 6. Start the API server
npm run dev
```

=== Verify Installation
<verify-installation>
```bash
# Check health endpoint
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","service":"memory-manager","timestamp":"..."}
```

#line(length: 100%)

== Table of Contents
<table-of-contents>
+ #link(<1-installation-and-setup>)[Installation and Setup]
+ #link(<2-configuration>)[Configuration]
+ #link(<3-api-reference>)[API Reference]
+ #link(<4-usage-examples>)[Usage Examples]
+ #link(<5-rag-system-integration>)[RAG System Integration]
+ #link(<6-troubleshooting>)[Troubleshooting]

#line(length: 100%)

== 1. Installation and Setup
<1-installation-and-setup>
=== 1.1 System Requirements
<system-requirements>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Component], [Minimum], [Recommended],),
    table.hline(),
    [Node.js], [20.x], [22.x LTS],
    [RAM], [4 GB], [8 GB],
    [Disk], [10 GB], [50 GB],
    [Docker], [24.x], [Latest],
  )]
  , kind: table
  )

=== 1.2 Infrastructure Services
<infrastructure-services>
The Memory Manager requires three backend services:

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Service], [Port], [Purpose],),
    table.hline(),
    [Redis], [6379], [L1 Cache],
    [ChromaDB], [8000], [L2 Vector DB],
    [MongoDB], [27017], [L3 Storage],
  )]
  , kind: table
  )

=== 1.3 Starting Services with Docker
<starting-services-with-docker>
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (clean start)
docker-compose down -v
```

=== 1.4 Installing Ollama
<installing-ollama>
#strong[macOS:]

```bash
brew install ollama
ollama serve  # Start the server
ollama pull nomic-embed-text
```

#strong[Linux:]

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
ollama pull nomic-embed-text
```

#line(length: 100%)

== 2. Configuration
<2-configuration>
=== 2.1 Environment Variables
<environment-variables>
Create a `.env` file in the project root:

```bash
# Redis Configuration (L1 Cache)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=           # Optional: Redis password

# MongoDB Configuration (L3 Storage)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=memory_manager

# ChromaDB Configuration (L2 Vector DB)
CHROMADB_HOST=localhost
CHROMADB_PORT=8000

# Ollama Configuration (Embeddings)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# API Configuration
PORT=3001
NODE_ENV=development

# Memory Configuration
L1_CACHE_SIZE=100         # Maximum pages in L1 cache
L1_TTL=300000             # TTL in milliseconds (5 minutes)
L2_COLLECTION_NAME=agent_contexts
L3_COLLECTION_NAME=archived_contexts
```

=== 2.2 Configuration Options
<configuration-options>
==== L1 Cache Settings
<l1-cache-settings>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Variable], [Default], [Description],),
    table.hline(),
    [`L1_CACHE_SIZE`], [100], [Maximum number of pages in LRU cache],
    [`L1_TTL`], [300000], [Time-to-live in milliseconds (0 = no TTL)],
  )]
  , kind: table
  )

#strong[Tuning Tips:] - Increase `L1_CACHE_SIZE` for workloads with high
temporal locality - Decrease TTL for frequently changing data - Monitor
hit rate via `/api/stats`

#line(length: 100%)

== 3. API Reference
<3-api-reference>
=== 3.1 Base URL
<base-url>
```
http://localhost:3001/api
```

=== 3.2 Endpoints Overview
<endpoints-overview>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([Method], [Endpoint], [Description],),
    table.hline(),
    [GET], [`/health`], [Health check],
    [POST], [`/memory/get`], [Retrieve value],
    [POST], [`/memory/put`], [Store value],
    [DELETE], [`/memory`], [Delete value],
    [POST], [`/memory/search`], [Semantic search],
    [GET], [`/stats`], [Memory statistics],
    [POST], [`/memory/clear`], [Clear all memory],
  )]
  , kind: table
  )

=== 3.3 Health Check
<health-check>
#strong[Request:]

```bash
GET /api/health
```

#strong[Response:]

```json
{
  "status": "ok",
  "service": "memory-manager",
  "timestamp": "2026-01-25T10:30:00.000Z"
}
```

=== 3.4 Store Value (PUT)
<store-value-put>
Store a value in the memory hierarchy.

#strong[Request:]

```bash
POST /api/memory/put
Content-Type: application/json

{
  "agentId": "agent-001",
  "key": "conversation:123",
  "value": "User asked about the weather in Seoul",
  "metadata": {
    "timestamp": "2026-01-25T10:30:00Z",
    "topic": "weather"
  }
}
```

#strong[Response:]

```json
{
  "success": true,
  "data": "550e8400-e29b-41d4-a716-446655440000",
  "level": "L1_CACHE",
  "accessTime": 45,
  "pageFault": false,
  "message": "Stored in all memory levels"
}
```

=== 3.5 Retrieve Value (GET)
<retrieve-value-get>
#strong[Request:]

```bash
POST /api/memory/get
Content-Type: application/json

{
  "agentId": "agent-001",
  "key": "conversation:123"
}
```

#strong[Response (Cache Hit):]

```json
{
  "success": true,
  "data": "User asked about the weather in Seoul",
  "level": "L1_CACHE",
  "accessTime": 2,
  "pageFault": false,
  "message": "L1 cache hit"
}
```

=== 3.6 Semantic Search
<semantic-search>
Search for similar contexts using vector similarity.

#strong[Request:]

```bash
POST /api/memory/search
Content-Type: application/json

{
  "agentId": "agent-001",
  "query": "weather forecast",
  "topK": 5
}
```

#strong[Response:]

```json
{
  "success": true,
  "results": [
    {
      "key": "conversation:123",
      "value": "User asked about the weather in Seoul",
      "similarity": 0.89,
      "level": "L2_VECTOR"
    }
  ],
  "count": 1
}
```

=== 3.7 Statistics
<statistics>
#strong[Request:]

```bash
GET /api/stats
```

#strong[Response:]

```json
{
  "l1Size": 42,
  "l1Capacity": 100,
  "l2Size": 0,
  "l3Size": 0,
  "totalAccesses": 150,
  "pageFaults": 12,
  "hits": 138,
  "misses": 5,
  "hitRate": 92,
  "averageAccessTime": 8.5,
  "evictions": 3,
  "promotions": 15,
  "demotions": 3
}
```

#line(length: 100%)

== 4. Usage Examples
<4-usage-examples>
=== 4.1 Basic Usage with cURL
<basic-usage-with-curl>
```bash
# Store a conversation
curl -X POST http://localhost:3001/api/memory/put \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "assistant-1",
    "key": "user:profile",
    "value": "User prefers formal communication"
  }'

# Retrieve the conversation
curl -X POST http://localhost:3001/api/memory/get \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "assistant-1",
    "key": "user:profile"
  }'

# Search for related contexts
curl -X POST http://localhost:3001/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "assistant-1",
    "query": "communication preferences",
    "topK": 3
  }'
```

=== 4.2 JavaScript Client
<javascript-client>
```typescript
const MEMORY_API = 'http://localhost:3001/api';

class MemoryClient {
  constructor(private agentId: string) {}

  async store(key: string, value: string) {
    const response = await fetch(`${MEMORY_API}/memory/put`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: this.agentId, key, value })
    });
    return response.json();
  }

  async retrieve(key: string) {
    const response = await fetch(`${MEMORY_API}/memory/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: this.agentId, key })
    });
    return response.json();
  }

  async search(query: string, topK = 5) {
    const response = await fetch(`${MEMORY_API}/memory/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: this.agentId, query, topK })
    });
    return response.json();
  }
}

// Usage
const memory = new MemoryClient('my-agent');
await memory.store('conversation:001', 'User discussed AI topics');
const result = await memory.retrieve('conversation:001');
```

=== 4.3 Python Client
<python-client>
```python
import requests

class MemoryClient:
    def __init__(self, agent_id, base_url="http://localhost:3001/api"):
        self.agent_id = agent_id
        self.base_url = base_url

    def store(self, key, value, metadata=None):
        response = requests.post(
            f"{self.base_url}/memory/put",
            json={"agentId": self.agent_id, "key": key, "value": value}
        )
        return response.json()

    def retrieve(self, key):
        response = requests.post(
            f"{self.base_url}/memory/get",
            json={"agentId": self.agent_id, "key": key}
        )
        return response.json()

    def search(self, query, top_k=5):
        response = requests.post(
            f"{self.base_url}/memory/search",
            json={"agentId": self.agent_id, "query": query, "topK": top_k}
        )
        return response.json()

# Usage
memory = MemoryClient("my-agent")
memory.store("conversation:001", "User discussed Python programming")
result = memory.retrieve("conversation:001")
```

#line(length: 100%)

== 5. RAG System Integration
<5-rag-system-integration>
=== 5.1 What is RAG?
<what-is-rag>
#strong[RAG (Retrieval-Augmented Generation)] enhances LLM responses by
retrieving relevant context before generation.

=== 5.2 Integration Example
<integration-example>
```python
import openai
from memory_client import MemoryClient

class RAGAgent:
    def __init__(self, agent_id, model="gpt-4"):
        self.memory = MemoryClient(agent_id)
        self.model = model

    def query(self, user_input):
        # 1. Retrieve relevant context
        search_results = self.memory.search(user_input, top_k=5)
        context = "\n".join([r["value"] for r in search_results.get("results", [])])

        # 2. Build prompt with context
        prompt = f"""Context:
{context}

User: {user_input}
Assistant:"""

        # 3. Generate response
        response = openai.ChatCompletion.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )

        answer = response.choices[0].message.content

        # 4. Store conversation
        import uuid
        self.memory.store(
            f"conversation:{uuid.uuid4()}",
            f"Human: {user_input}\nAssistant: {answer}"
        )

        return answer

# Usage
agent = RAGAgent("my-rag-agent")
response = agent.query("What did we discuss about Python?")
```

#line(length: 100%)

== 6. Troubleshooting
<6-troubleshooting>
=== 6.1 Common Issues
<common-issues>
==== Connection Refused Errors
<connection-refused-errors>
#strong[Symptom:]

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

#strong[Solution:]

```bash
# Check if services are running
docker-compose ps

# Restart services
docker-compose restart
```

==== Ollama Not Available
<ollama-not-available>
#strong[Symptom:]

```
Error: Failed to initialize Ollama
```

#strong[Solution:]

```bash
# Start Ollama server
ollama serve

# Pull model if missing
ollama pull nomic-embed-text
```

=== 6.2 Performance Issues
<performance-issues>
==== High Page Fault Rate
<high-page-fault-rate>
#strong[Symptom:] `hitRate` below 80% in `/api/stats`

#strong[Solutions:] 1. Increase `L1_CACHE_SIZE` in `.env` 2. Adjust TTL
based on access patterns 3. Pre-warm cache with frequently accessed data

=== 6.3 Debugging
<debugging>
==== Enable Debug Logging
<enable-debug-logging>
```bash
export NODE_ENV=development
npm run dev
```

==== Check Service Health
<check-service-health>
```bash
# Redis
docker exec memory-manager-redis-1 redis-cli PING

# MongoDB
docker exec memory-manager-mongodb-1 mongosh --eval "db.adminCommand('ping')"

# ChromaDB
curl http://localhost:8000/api/v1/heartbeat
```

#line(length: 100%)

#strong[Document Version:] 1.0.0 #strong[Last Updated:] 2026-01-25
