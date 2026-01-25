/**
 * Memory Manager API Server
 * REST API for hierarchical memory management
 */

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import { HierarchicalMemoryManager, MemoryAccessRequest } from './index';
import logger from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper to wrap async handlers
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper to format error messages
const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

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
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'memory-manager',
    timestamp: new Date().toISOString(),
  });
});

// Get memory value
app.post(
  '/api/memory/get',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { agentId, key } = req.body as { agentId?: string; key?: string };

      if (!agentId || !key) {
        res.status(400).json({
          success: false,
          message: 'agentId and key are required',
        });
        return;
      }

      const request: MemoryAccessRequest = {
        agentId,
        key,
        operation: 'get',
      };

      const response = await memoryManager.get(request);
      res.json(response);
    } catch (error) {
      logger.error('GET error:', error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${formatError(error)}`,
      });
    }
  }),
);

// Put memory value
app.post(
  '/api/memory/put',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { agentId, key, value, metadata } = req.body as {
        agentId?: string;
        key?: string;
        value?: string;
        metadata?: Record<string, unknown>;
      };

      if (!agentId || !key || !value) {
        res.status(400).json({
          success: false,
          message: 'agentId, key, and value are required',
        });
        return;
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
      logger.error('PUT error:', error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${formatError(error)}`,
      });
    }
  }),
);

// Delete memory value
app.delete(
  '/api/memory',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { agentId, key } = req.query;

      if (!agentId || !key) {
        res.status(400).json({
          success: false,
          message: 'agentId and key are required',
        });
        return;
      }

      const request: MemoryAccessRequest = {
        agentId: agentId as string,
        key: key as string,
        operation: 'delete',
      };

      const response = await memoryManager.delete(request);
      res.json(response);
    } catch (error) {
      logger.error('DELETE error:', error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${formatError(error)}`,
      });
    }
  }),
);

// Semantic search
app.post(
  '/api/memory/search',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { agentId, query, topK } = req.body as {
        agentId?: string;
        query?: string;
        topK?: number;
      };

      if (!agentId || !query) {
        res.status(400).json({
          success: false,
          message: 'agentId and query are required',
        });
        return;
      }

      const results = await memoryManager.semanticSearch(agentId, query, topK || 5);

      res.json({
        success: true,
        results,
        count: results.length,
      });
    } catch (error) {
      logger.error('Search error:', error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${formatError(error)}`,
      });
    }
  }),
);

// Get statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const stats = memoryManager.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${formatError(error)}`,
    });
  }
});

// Clear all memory
app.post(
  '/api/memory/clear',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      await memoryManager.clear();
      res.json({
        success: true,
        message: 'All memory cleared',
      });
    } catch (error) {
      logger.error('Clear error:', error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${formatError(error)}`,
      });
    }
  }),
);

// Initialize and start server
async function startServer() {
  try {
    // Initialize memory manager
    logger.info('Initializing Memory Manager...');
    await memoryManager.initialize();
    logger.info('Memory Manager initialized successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Memory Manager API running on port ${String(PORT)}`);
      logger.info(`Health check: http://localhost:${String(PORT)}/api/health`);
      logger.info(`Statistics: http://localhost:${String(PORT)}/api/stats`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down Memory Manager...');
  memoryManager
    .shutdown()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
});

process.on('SIGTERM', () => {
  logger.info('Shutting down Memory Manager...');
  memoryManager
    .shutdown()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
});

// Start server if this is the main module
if (require.main === module) {
  void startServer();
}

export { app, memoryManager };
