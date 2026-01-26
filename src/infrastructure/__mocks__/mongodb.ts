/**
 * Mock MongoDB Connection Manager for Unit Tests
 */

import { EventEmitter } from 'events';

class MockMongoConnection extends EventEmitter {
  status = 'connected';
  async connect() {
    this.emit('connected');
    return this;
  }
  async disconnect() {
    this.status = 'closed';
  }
  async close() {
    this.status = 'closed';
  }
}

class MockModel {
  static async create() {
    return {};
  }
  static async findOne() {
    return null;
  }
  static async find() {
    return { exec: async () => [] };
  }
  static async findById() {
    return null;
  }
  static async findByIdAndUpdate() {
    return null;
  }
  static async deleteOne() {
    return { deletedCount: 1 };
  }
  static async deleteMany() {
    return { deletedCount: 1 };
  }
  static async countDocuments() {
    return 0;
  }
  async save() {
    return this;
  }
  async deleteOne() {
    return { deletedCount: 1 };
  }
}

class MongoDBManager {
  private connection: MockMongoConnection | null = null;

  async connect(): Promise<MockMongoConnection> {
    if (!this.connection) {
      this.connection = new MockMongoConnection();
    }
    return this.connection.connect();
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  getConnection(): MockMongoConnection | null {
    return this.connection;
  }
}

// Export singleton instance
export const mongodbManager = new MongoDBManager();
