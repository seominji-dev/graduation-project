/**
 * Deadlock Detector - Main Entry Point
 *
 * Multi-agent system deadlock detection and recovery using Wait-For Graph
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import config from './config/index.js';
import apiRoutes from './api/routes/index.js';
import { connectToMongoDB, disconnectFromMongoDB } from './infrastructure/mongodb.js';
import { connectToRedis, disconnectFromRedis } from './infrastructure/redis.js';
import logger from './utils/logger.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.debug('HTTP Request', { method: req.method, path: req.path });
  next();
});

// API Routes
app.use('/api', apiRoutes);

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

    httpServer.listen(config.port, () => {
      logger.info('Deadlock Detector API server started', { port: config.port });
      logger.info('Socket.IO server running', { port: config.port });
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
