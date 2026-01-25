/**
 * Checkpointing System Main Entry Point
 */

import express from 'express';
import cors from 'cors';
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

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoHealthy = mongodbManager.isHealthy();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoHealthy ? 'healthy' : 'unhealthy',
      api: 'healthy',
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

  // Setup API routes
  app.use('/api', createCheckpointRoutes(checkpointManager, recoveryManager));

  console.log('Services initialized successfully');
}

// Graceful shutdown
async function shutdown() {
  console.log('Starting graceful shutdown...');

  // Create final checkpoints for all agents
  if (periodicManager) {
    await periodicManager.createFinalCheckpointsForAll();
  }

  // Disconnect from MongoDB
  await mongodbManager.disconnect();

  console.log('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    await initializeServices();

    app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   AI Agent Checkpointing System                          ║
║   OS Checkpointing applied to LLM Agents                  ║
║                                                           ║
║   Server running on: http://localhost:${config.port}       ║
║   Health check: http://localhost:${config.port}/api/health ║
║                                                           ║
║   Features:                                               ║
║   - Periodic checkpointing (${config.checkpointing.intervalMs}ms interval)     ║
║   - Incremental checkpoints                              ║
║   - Automatic recovery                                   ║
║   - State versioning                                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
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
