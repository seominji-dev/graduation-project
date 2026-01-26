/**
 * Deadlock Detector - Main Entry Point
 *
 * Multi-agent system deadlock detection and recovery using Wait-For Graph
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import apiRoutes from './api/routes/index.js';
import { connectToMongoDB, disconnectFromMongoDB } from './infrastructure/mongodb.js';
import { connectToRedis, disconnectFromRedis } from './infrastructure/redis.js';
import logger from './utils/logger.js';
import {
  errorHandler,
  notFoundHandler,
} from './api/middlewares/errorHandler.js';
import { authMiddleware } from './api/middlewares/auth.js';
import { apiRateLimiter } from './api/middlewares/rateLimit.js';
import { metricsMiddleware, metricsHandler } from './metrics/index.js';

const app = express();
const httpServer = createServer(app);

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

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

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
        connectSrc: ["'self'", 'ws:', 'wss:', ...getAllowedOrigins()],
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
  }),
);

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Rate limiting
app.use(apiRateLimiter);

// CORS with restricted origins
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.debug('HTTP Request', { method: req.method, path: req.path });
  next();
});

// Prometheus metrics endpoint (public - no auth required)
app.get('/metrics', (req, res) => { void metricsHandler(req, res); });

// API Routes with authentication
// Health endpoint is excluded in the auth middleware itself
app.use('/api', authMiddleware, apiRoutes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.IO for real-time deadlock notifications
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.emit('connected', {
    message: 'Connected to Deadlock Detector',
    timestamp: new Date().toISOString(),
  });

  socket.on('subscribe:graph', () => {
    void socket.join('graph-updates');
    logger.debug('Client subscribed to graph updates', { socketId: socket.id });
  });

  socket.on('subscribe:deadlock', () => {
    void socket.join('deadlock-alerts');
    logger.debug('Client subscribed to deadlock alerts', { socketId: socket.id });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

function broadcastDeadlock(deadlockData: unknown): void {
  io.to('deadlock-alerts').emit('deadlock-detected', deadlockData);
}

function broadcastGraphUpdate(graphData: unknown): void {
  io.to('graph-updates').emit('graph-updated', graphData);
}

async function startServer(): Promise<void> {
  try {
    await connectToMongoDB();
    await connectToRedis();

    httpServer.listen(config.server.port, () => {
      logger.info('Deadlock Detector API server started', { port: config.server.port });
      logger.info('Socket.IO server running', { port: config.server.port });
      logger.info('Security: Helmet.js enabled with CSP');
      logger.info('CORS: Restricted to allowed origins');
      logger.info('Authentication: API Key required for protected endpoints');
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

function shutdown(): void {
  logger.info('Shutting down server...');

  httpServer.close(() => {
    void (async (): Promise<void> => {
      await disconnectFromMongoDB();
      await disconnectFromRedis();
      logger.info('Server shutdown complete');
      process.exit(0);
    })();
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

void startServer();

export { app, io, broadcastDeadlock, broadcastGraphUpdate };
