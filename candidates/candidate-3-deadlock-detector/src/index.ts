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
import { connectToRedis, disconnectFromRedis, cacheWFG, publishDeadlockEvent } from './infrastructure/redis.js';
import DeadlockController from './api/controllers/DeadlockController.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});

const controller = new DeadlockController();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(req.method + ' ' + req.path);
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Socket.IO for real-time deadlock notifications
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.emit('connected', {
    message: 'Connected to Deadlock Detector',
    timestamp: new Date().toISOString(),
  });

  socket.on('subscribe:graph', () => {
    socket.join('graph-updates');
    console.log('Client subscribed to graph updates:', socket.id);
  });

  socket.on('subscribe:deadlock', () => {
    socket.join('deadlock-alerts');
    console.log('Client subscribed to deadlock alerts:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

function broadcastDeadlock(deadlockData: any): void {
  io.to('deadlock-alerts').emit('deadlock-detected', deadlockData);
}

function broadcastGraphUpdate(graphData: any): void {
  io.to('graph-updates').emit('graph-updated', graphData);
}

async function startServer(): Promise<void> {
  try {
    await connectToMongoDB();
    await connectToRedis();

    httpServer.listen(config.port, () => {
      console.log('Deadlock Detector API server running on port', config.port);
      console.log('Socket.IO server running on port', config.port);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown(): Promise<void> {
  console.log('Shutting down server...');
  
  httpServer.close(async () => {
    await disconnectFromMongoDB();
    await disconnectFromRedis();
    console.log('Server shutdown complete');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();

export { app, io, broadcastDeadlock, broadcastGraphUpdate };
