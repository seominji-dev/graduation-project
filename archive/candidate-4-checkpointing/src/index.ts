/**
 * Checkpointing System Main Entry Point
 */

import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { mongodbManager } from './storage/MongoDBManager.js';
import { CheckpointStore } from './storage/CheckpointStore.js';
import { StateRepository } from './storage/StateRepository.js';
import { StateSerializer } from './serialization/StateSerializer.js';
import { CheckpointManager } from './managers/CheckpointManager.js';
import { PeriodicCheckpointManager } from './managers/PeriodicCheckpointManager.js';
import { RollbackExecutor } from './recovery/RollbackExecutor.js';
import { RecoveryManager } from './recovery/RecoveryManager.js';
import { createCheckpointRoutes } from './api/checkpoints.js';
import { logger } from './utils/logger.js';
import {
  errorHandler,
  notFoundHandler,
} from './middlewares/errorHandler.js';
import { authMiddleware } from './middlewares/auth.js';
import { apiRateLimiter } from './middlewares/rateLimit.js';
import { metricsMiddleware, metricsHandler } from './metrics/index.js';

// Initialize Express app
const app = express();

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

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Prometheus metrics endpoint (public - no auth required)
app.get('/metrics', metricsHandler);

// Health check endpoint (public - no auth required)
app.get('/api/health', (req, res) => {
  const mongoHealthy = mongodbManager.isHealthy();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoHealthy ? 'healthy' : 'unhealthy',
      api: 'healthy',
    },
    security: {
      helmet: 'enabled',
      cors: 'restricted',
      csp: 'enabled',
      authentication: 'api-key',
    },
    config: {
      maxCheckpointsPerAgent: config.checkpointing.maxCheckpointsPerAgent,
      checkpointInterval: config.checkpointing.intervalMs,
      maxStateSize: config.checkpointing.maxStateSizeBytes,
    },
  });
});

// Initialize managers after MongoDB connects
let checkpointManager: CheckpointManager;
let periodicManager: PeriodicCheckpointManager;
let recoveryManager: RecoveryManager;
let stateRepository: StateRepository;

async function initializeServices() {
  // Connect to MongoDB
  await mongodbManager.connect();

  // Initialize storage layer
  const store = new CheckpointStore();
  const serializer = new StateSerializer(config.checkpointing.maxStateSizeBytes);

  // Initialize repositories
  stateRepository = new StateRepository(store);

  // Initialize rollback executor
  const rollbackExecutor = new RollbackExecutor(store, serializer);

  // Initialize managers
  checkpointManager = new CheckpointManager(
    store,
    serializer,
    config.checkpointing.maxCheckpointsPerAgent
  );

  periodicManager = new PeriodicCheckpointManager(checkpointManager, {
    intervalMs: config.checkpointing.intervalMs,
    idleCheckpointsEnabled: true,
    adaptiveInterval: true,
  });

  recoveryManager = new RecoveryManager(store, stateRepository, rollbackExecutor);

  // Setup API routes with authentication
  // Health endpoint is defined above without auth
  app.use('/api', authMiddleware, createCheckpointRoutes(checkpointManager, recoveryManager));

  // Error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info('Services initialized successfully');
}

// Graceful shutdown
async function shutdown() {
  logger.info('Starting graceful shutdown...');

  // Create final checkpoints for all agents
  if (periodicManager) {
    await periodicManager.createFinalCheckpointsForAll();
  }

  // Disconnect from MongoDB
  await mongodbManager.disconnect();

  logger.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    await initializeServices();

    app.listen(config.server.port, () => {
      logger.info('');
      logger.info('AI Agent Checkpointing System');
      logger.info('OS Checkpointing applied to LLM Agents');
      logger.info('');
      logger.info('Server running on: http://localhost:' + config.server.port);
      logger.info('Health check: http://localhost:' + config.server.port + '/api/health');
      logger.info('');
      logger.info('Security: Helmet.js enabled with CSP');
      logger.info('CORS: Restricted to allowed origins');
      logger.info('Authentication: API Key required for protected endpoints');
      logger.info('');
      logger.info('Features:');
      logger.info('- Periodic checkpointing (' + config.checkpointing.intervalMs + 'ms interval)');
      logger.info('- Incremental checkpoints');
      logger.info('- Automatic recovery');
      logger.info('- State versioning');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export managers for testing/external use
export {
  checkpointManager,
  periodicManager,
  recoveryManager,
  stateRepository,
};

// Start the server
start();
