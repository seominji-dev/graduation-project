/**
 * Configuration Specification Tests
 */

import { config } from '../../../src/config';

describe('Configuration', () => {
  it('should have server configuration', () => {
    expect(config.server).toBeDefined();
    expect(config.server.port).toBeDefined();
    expect(config.server.nodeEnv).toBeDefined();
  });

  it('should have Redis configuration', () => {
    expect(config.redis).toBeDefined();
    expect(config.redis.host).toBeDefined();
    expect(config.redis.port).toBeDefined();
  });

  it('should have MongoDB configuration', () => {
    expect(config.mongodb).toBeDefined();
    expect(config.mongodb.uri).toBeDefined();
  });

  it('should have LLM provider configuration', () => {
    expect(config.llm).toBeDefined();
    expect(config.llm.provider).toBeDefined();
    expect(['ollama', 'openai']).toContain(config.llm.provider);
  });

  it('should have Socket.io configuration', () => {
    expect(config.socket).toBeDefined();
    expect(config.socket.corsOrigin).toBeDefined();
  });
});
