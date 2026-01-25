/**
 * LLM Scheduler Server
 * Main application entry point
 */

import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config';
import { mongodbManager } from './infrastructure/mongodb';
import { LLMService } from './services/llmService';
import { SchedulerFactory } from './services/schedulerFactory';
import { FCFSScheduler } from './schedulers/FCFSScheduler';
import { RequestController } from './api/controllers/requestController';
import { createRoutes } from './api/routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { createLogger } from './utils/logger';

const logger = createLogger('Server');

// Load environment variables
dotenv.config();

class LLMSchedulerServer {
  private app: Application;
  private httpServer: ReturnType<typeof createServer>;
  private io: SocketIOServer;
  private llmService: LLMService;
  private schedulerFactory: SchedulerFactory;
  private scheduler: FCFSScheduler;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: config.socket.corsOrigin,
        methods: ['GET', 'POST'],
      },
    });

    this.llmService = new LLMService();
    this.schedulerFactory = new SchedulerFactory(this.llmService);
    
    // Initialize FCFS scheduler as MVP (SPEC-SCHED-001)
    this.scheduler = new FCFSScheduler(
      {
        name: 'fcfs-queue',
        concurrency: 2, // Process 2 requests concurrently
      },
      this.llmService
    );

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandlers();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug(req.method + ' ' + req.url);
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    const requestController = new RequestController(this.scheduler);
    const apiRoutes = createRoutes(requestController);

    this.app.use('/api', apiRoutes);
  }

  /**
   * Setup Socket.IO for real-time updates
   */
  private setupSocketIO(): void {
    this.io.on('connection', (socket) => {
      logger.debug('Client connected: ' + socket.id);

      socket.on('disconnect', () => {
        logger.debug('Client disconnected: ' + socket.id);
      });
    });

    // Make io accessible to other parts of the app
    (this.app as unknown as { set: (key: string, value: SocketIOServer) => void }).set('io', this.io);
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      // Connect to MongoDB
      await mongodbManager.connect();

      // Initialize scheduler
      await this.scheduler.initialize();

      // Start HTTP server
      this.httpServer.listen(config.server.port, () => {
        logger.info('='.repeat(50));
        logger.info('LLM Scheduler Server Started');
        logger.info('='.repeat(50));
        logger.info('Environment: ' + config.server.nodeEnv);
        logger.info('Server running on: http://localhost:' + config.server.port);
        logger.info('Scheduler type: FCFS (MVP)');
        logger.info('Health check: http://localhost:' + config.server.port + '/api/health');
        logger.info('='.repeat(50));
      });

      // Graceful shutdown
      process.on('SIGTERM', () => { void this.shutdown(); });
      process.on('SIGINT', () => { void this.shutdown(); });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    logger.info('Shutting down gracefully...');

    try {
      // Shutdown scheduler
      await this.scheduler.shutdown();

      // Close MongoDB connection
      await mongodbManager.disconnect();

      // Close HTTP server
      this.httpServer.close(() => {
        logger.info('Server shut down successfully');
        process.exit(0);
      });
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new LLMSchedulerServer();
void server.start();

export default server;
