/**
 * LLM Scheduler Server
 * Main application entry point
 */

import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { config } from './config';
import { mongodbManager } from './infrastructure/mongodb';
import { LLMService } from './services/llmService';
import { SchedulerFactory } from './services/schedulerFactory';
import { FCFSScheduler } from './schedulers/FCFSScheduler';
import { RequestController } from './api/controllers/requestController';
import { createRoutes } from './api/routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { correlationIdMiddleware } from './middlewares/correlationId';
import { apiRateLimiter } from './middlewares/rateLimit';
import { createLogger } from './utils/logger';
import { metricsMiddleware, metricsHandler } from './metrics';

const logger = createLogger('Server');

// Load environment variables
dotenv.config();

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID'],
  exposedHeaders: ['X-Correlation-ID'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

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
        origin: getAllowedOrigins(),
        methods: ['GET', 'POST'],
        credentials: true,
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

    this.setupSecurityMiddleware();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandlers();
  }

  /**
   * Setup security middleware (Helmet.js)
   * OWASP Top 10 compliant security headers
   */
  private setupSecurityMiddleware(): void {
    // Helmet.js with custom configuration
    this.app.use(
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

    // CORS with restricted origins
    this.app.use(cors(corsOptions));

    logger.info('Security middleware configured (Helmet.js + CORS)');
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Prometheus metrics middleware
    this.app.use(metricsMiddleware);

    // Correlation ID middleware for distributed tracing (must be early in chain)
    this.app.use(correlationIdMiddleware);

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    this.app.use(apiRateLimiter);

    // Request logging (now includes correlation ID automatically)
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

    // Prometheus metrics endpoint
    this.app.get('/metrics', metricsHandler);

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
        logger.info('Security: Helmet.js enabled with CSP');
        logger.info('CORS: Restricted to allowed origins');
        logger.info('Distributed Tracing: Correlation ID enabled');
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
