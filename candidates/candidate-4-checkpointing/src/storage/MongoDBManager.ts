/**
 * MongoDB Connection Manager
 */

import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const log = logger.child('MongoDB');

class MongoDBManager {
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await mongoose.connect(config.mongodb.uri);
      this.isConnected = true;
      log.info('MongoDB connected successfully');
    } catch (error) {
      log.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      log.info('MongoDB disconnected');
    }
  }

  isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export const mongodbManager = new MongoDBManager();
