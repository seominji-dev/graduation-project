/**
 * Tests for MongoDB Infrastructure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock mongoose before importing the module
vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    default: {
      ...actual.default,
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      model: vi.fn((name: string, schema: any) => {
        return {
          modelName: name,
          schema,
          find: vi.fn(),
          findOne: vi.fn(),
          create: vi.fn(),
        };
      }),
      Schema: actual.Schema,
    },
  };
});

describe('MongoDB Infrastructure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Module Exports', () => {
    it('should export connectToMongoDB function', async () => {
      const module = await import('../../src/infrastructure/mongodb.js');
      expect(module.connectToMongoDB).toBeDefined();
      expect(typeof module.connectToMongoDB).toBe('function');
    });

    it('should export disconnectFromMongoDB function', async () => {
      const module = await import('../../src/infrastructure/mongodb.js');
      expect(module.disconnectFromMongoDB).toBeDefined();
      expect(typeof module.disconnectFromMongoDB).toBe('function');
    });

    it('should export AgentModel', async () => {
      const module = await import('../../src/infrastructure/mongodb.js');
      expect(module.AgentModel).toBeDefined();
    });

    it('should export ResourceModel', async () => {
      const module = await import('../../src/infrastructure/mongodb.js');
      expect(module.ResourceModel).toBeDefined();
    });

    it('should export DeadlockEventModel', async () => {
      const module = await import('../../src/infrastructure/mongodb.js');
      expect(module.DeadlockEventModel).toBeDefined();
    });

    it('should export RecoveryActionModel', async () => {
      const module = await import('../../src/infrastructure/mongodb.js');
      expect(module.RecoveryActionModel).toBeDefined();
    });
  });

  describe('connectToMongoDB', () => {
    it('should be a function that accepts no parameters', async () => {
      const { connectToMongoDB } = await import('../../src/infrastructure/mongodb.js');
      expect(connectToMongoDB.length).toBe(0);
    });

    it('should return a promise', async () => {
      const { connectToMongoDB } = await import('../../src/infrastructure/mongodb.js');
      const result = connectToMongoDB();
      expect(result).toBeInstanceOf(Promise);
      // Wait for the mocked promise to resolve
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('disconnectFromMongoDB', () => {
    it('should be a function that accepts no parameters', async () => {
      const { disconnectFromMongoDB } = await import('../../src/infrastructure/mongodb.js');
      expect(disconnectFromMongoDB.length).toBe(0);
    });

    it('should return a promise', async () => {
      const { disconnectFromMongoDB } = await import('../../src/infrastructure/mongodb.js');
      const result = disconnectFromMongoDB();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Schema Structure', () => {
    it('should create AgentModel with mongoose', async () => {
      const { AgentModel } = await import('../../src/infrastructure/mongodb.js');
      expect(AgentModel).toBeDefined();
      expect(AgentModel.modelName).toBe('Agent');
    });

    it('should create ResourceModel with mongoose', async () => {
      const { ResourceModel } = await import('../../src/infrastructure/mongodb.js');
      expect(ResourceModel).toBeDefined();
      expect(ResourceModel.modelName).toBe('Resource');
    });

    it('should create DeadlockEventModel with mongoose', async () => {
      const { DeadlockEventModel } = await import('../../src/infrastructure/mongodb.js');
      expect(DeadlockEventModel).toBeDefined();
      expect(DeadlockEventModel.modelName).toBe('DeadlockEvent');
    });

    it('should create RecoveryActionModel with mongoose', async () => {
      const { RecoveryActionModel } = await import('../../src/infrastructure/mongodb.js');
      expect(RecoveryActionModel).toBeDefined();
      expect(RecoveryActionModel.modelName).toBe('RecoveryAction');
    });
  });
});
