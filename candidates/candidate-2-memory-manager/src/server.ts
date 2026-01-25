/**
 * Memory Manager API Server
 * REST API for hierarchical memory management
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { HierarchicalMemoryManager, MemoryAccessRequest } from './index';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Memory Manager
const memoryManager = new HierarchicalMemoryManager({
  l1Capacity: parseInt(process.env.L1_CACHE_SIZE || '100'),
  l1Ttl: parseInt(process.env.L1_TTL || '300000'), // 5 minutes default
  l2CollectionName: process.env.L2_COLLECTION_NAME || 'agent_contexts',
  l3DbName: process.env.MONGODB_DB_NAME || 'memory_manager',
  l3CollectionName: process.env.L3_COLLECTION_NAME || 'archived_contexts',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379'),
  chromaHost: process.env.CHROMADB_HOST || 'localhost',
  chromaPort: parseInt(process.env.CHROMADB_PORT || '8000'),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'memory-manager',
    timestamp: new Date().toISOString(),
  });
});

// Get memory value
app.post('/api/memory/get', async (req: Request, res: Response) => {
  try {
    const { agentId, key } = req.body;

    if (!agentId || !key) {
      return res.status(400).json({
        success: false,
        message: 'agentId and key are required',
      });
    }

    const request: MemoryAccessRequest = {
      agentId,
      key,
      operation: 'get',
    };

    const response = await memoryManager.get(request);
    res.json(response);
  } catch (error) {
    console.error('GET error:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error}`,
    });
  }
});

// Put memory value
app.post('/api/memory/put', async (req: Request, res: Response) => {
  try {
    const { agentId, key, value, metadata } = req.body;

    if (!agentId || !key || !value) {
      return res.status(400).json({
        success: false,
        message: 'agentId, key, and value are required',
      });
    }

    const request: MemoryAccessRequest = {
      agentId,
      key,
      value,
      operation: 'put',
      metadata,
    };

    const response = await memoryManager.put(request);
    res.json(response);
  } catch (error) {
    console.error('PUT error:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error}`,
    });
  }
});

// Delete memory value
app.delete('/api/memory', async (req: Request, res: Response) => {
  try {
    const { agentId, key } = req.query;

    if (!agentId || !key) {
      return res.status(400).json({
        success: false,
        message: 'agentId and key are required',
      });
    }

    const request: MemoryAccessRequest = {
      agentId: agentId as string,
      key: key as string,
      operation: 'delete',
    };

    const response = await memoryManager.delete(request);
    res.json(response);
  } catch (error) {
    console.error('DELETE error:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error}`,
    });
  }
});

// Semantic search
app.post('/api/memory/search', async (req: Request, res: Response) => {
  try {
    const { agentId, query, topK } = req.body;

    if (!agentId || !query) {
      return res.status(400).json({
        success: false,
        message: 'agentId and query are required',
      });
    }

    const results = await memoryManager.semanticSearch(
      agentId,
      query,
      topK || 5
    );

    res.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error}`,
    });
  }
});

// Get statistics
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const stats = memoryManager.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error}`,
    });
  }
});

// Clear all memory
app.post('/api/memory/clear', async (req: Request, res: Response) => {
  try {
    await memoryManager.clear();
    res.json({
      success: true,
      message: 'All memory cleared',
    });
  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error}`,
    });
  }
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize memory manager
    console.log('Initializing Memory Manager...');
    await memoryManager.initialize();
    console.log('Memory Manager initialized successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`Memory Manager API running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Statistics: http://localhost:${PORT}/api/stats`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Memory Manager...');
  await memoryManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Memory Manager...');
  await memoryManager.shutdown();
  process.exit(0);
});

// Start server if this is the main module
if (require.main === module) {
  startServer();
}

export { app, memoryManager };
