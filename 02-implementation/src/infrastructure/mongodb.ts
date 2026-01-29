/**
 * MongoDB Connection Manager
 * Manages Mongoose connection for request logging
 */

import mongoose from "mongoose";
import { config } from "../config";
import { createLogger } from "../utils/logger";

const logger = createLogger("MongoDB");

class MongoDBManager {
  private isConnected: boolean = false;

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await mongoose.connect(config.mongodb.uri);
      this.isConnected = true;
      logger.info("MongoDB connected successfully");
    } catch (error) {
      logger.error("MongoDB connection error:", error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info("MongoDB disconnected");
    }
  }

  /**
   * Check connection status
   */
  isHealthy(): boolean {
    return this.isConnected && Number(mongoose.connection.readyState) === 1;
  }
}

// Export singleton instance
export const mongodbManager = new MongoDBManager();
