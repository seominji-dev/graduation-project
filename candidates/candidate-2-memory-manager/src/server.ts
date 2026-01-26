/**
 * Memory Manager API Server
 * REST API for hierarchical memory management
 */

import express, { Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import { HierarchicalMemoryManager, MemoryAccessRequest } from './index';
import logger from './utils/logger';
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ValidationError,
} from './middlewares/errorHandler';
import { authMiddleware } from './middlewares/auth';
import { apiRateLimiter } from './middlewares/rateLimit';
import { metricsMiddleware, metricsHandler } from './metrics';

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Security Configuration
 * OWASP compliant security headers and CORS settings
 */
const getAllowedOrigins = (): string[] => {
  const origins = process.env.ALLOWED_ORIGINS || 'http://localhost:3000';
  return origins.split(',').map(origin => origin.trim());
};

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    // Allow requests with no origin (like mobile apps or curl requests) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (origin && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Security Middleware (Helmet.js) - OWASP Top 10 compliant
app.use(
  helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...getAllowedOrigins()],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    // X-Frame-Options: DENY - Prevent clickjacking
    frameguard: { action: 'deny' },
    // X-Content-Type-Options: nosniff - Prevent MIME type sniffing
    noSniff: true,
    // X-XSS-Protection - Enable XSS filter
    xssFilter: true,
    // Strict-Transport-Security - Force HTTPS
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Referrer-Policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // X-DNS-Prefetch-Control
    dnsPrefetchControl: { allow: false },
    // X-Download-Options (IE specific)
    ieNoOpen: true,
    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  })
);

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Rate limiting
app.use(apiRateLimiter);

// CORS with restricted origins
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());

// Apply authentication middleware globally
// Public paths (/api/health, /api/stats) are excluded in the auth middleware itself
app.use(authMiddleware);

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

// Prometheus metrics endpoint (public - no auth required)
app.get('/metrics', metricsHandler);

// Health check endpoint (public - no auth required)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'memory-manager',
    timestamp: new Date().toISOString(),
    security: {
      helmet: 'enabled',
      cors: 'restricted',
      csp: 'enabled',
      authentication: 'api-key',
    },
  });
});

// Get memory value
app.post(
  '/api/memory/get',
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId, key } = req.body as { agentId?: string; key?: string };

    if (!agentId || !key) {
      throw ValidationError.multipleErrors([
        ...(!agentId ? [{ field: 'agentId', constraint: 'required' }] : []),
        ...(!key ? [{ field: 'key', constraint: 'required' }] : []),
      ]);
    }

    const request: MemoryAccessRequest = {
      agentId,
      key,
      operation: 'get',
    };

    const response = await memoryManager.get(request);
    res.json(response);
  }),
);

// Put memory value
app.post(
  '/api/memory/put',
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId, key, value, metadata } = req.body as {
      agentId?: string;
      key?: string;
      value?: string;
      metadata?: Record<string, unknown>;
    };

    if (!agentId || !key || !value) {
      throw ValidationError.multipleErrors([
        ...(!agentId ? [{ field: 'agentId', constraint: 'required' }] : []),
        ...(!key ? [{ field: 'key', constraint: 'required' }] : []),
        ...(!value ? [{ field: 'value', constraint: 'required' }] : []),
      ]);
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
  }),
);

// Delete memory value
app.delete(
  '/api/memory',
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId, key } = req.query;

    if (!agentId || !key) {
      throw ValidationError.multipleErrors([
        ...(!agentId ? [{ field: 'agentId', constraint: 'required' }] : []),
        ...(!key ? [{ field: 'key', constraint: 'required' }] : []),
      ]);
    }

    const request: MemoryAccessRequest = {
      agentId: agentId as string,
      key: key as string,
      operation: 'delete',
    };

    const response = await memoryManager.delete(request);
    res.json(response);
  }),
);

// Semantic search
app.post(
  '/api/memory/search',
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId, query, topK } = req.body as {
      agentId?: string;
      query?: string;
      topK?: number;
    };

    if (!agentId || !query) {
      throw ValidationError.multipleErrors([
        ...(!agentId ? [{ field: 'agentId', constraint: 'required' }] : []),
        ...(!query ? [{ field: 'query', constraint: 'required' }] : []),
      ]);
    }

    const results = await memoryManager.semanticSearch(agentId, query, topK || 5);

    res.json({
      success: true,
      results,
      count: results.length,
    });
  }),
);

// Get statistics (public - no auth required)
app.get(
  '/api/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await memoryManager.getStats();
    res.json(stats);
  }),
);

// Clear all memory
app.post(
  '/api/memory/clear',
  asyncHandler(async (_req: Request, res: Response) => {
    await memoryManager.clear();
    res.json({
      success: true,
      message: 'All memory cleared',
    });
  }),
);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    // Initialize memory manager
    logger.info('Initializing Memory Manager...');
    await memoryManager.initialize();
    logger.info('Memory Manager initialized successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info('Memory Manager API running on port ' + String(PORT));
      logger.info('Health check: http://localhost:' + String(PORT) + '/api/health');
      logger.info('Statistics: http://localhost:' + String(PORT) + '/api/stats');
      logger.info('Security: Helmet.js enabled with CSP');
      logger.info('CORS: Restricted to allowed origins');
      logger.info('Authentication: API Key required for protected endpoints');
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
