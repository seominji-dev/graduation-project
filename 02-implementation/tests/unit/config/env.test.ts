/**
 * Environment Configuration Validation Tests
 */

describe('Environment Configuration Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Valid configuration', () => {
    it('should validate and parse valid environment variables', () => {
      process.env.PORT = '3000';
      process.env.NODE_ENV = 'development';
      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_PORT = '6379';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.LLM_PROVIDER = 'ollama';
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      process.env.SOCKET_CORS_ORIGIN = 'http://localhost:3000';
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';

      const { env, config } = require('../../../src/config/env');

      expect(env.PORT).toBe(3000);
      expect(env.NODE_ENV).toBe('development');
      expect(env.REDIS_HOST).toBe('localhost');
      expect(env.REDIS_PORT).toBe(6379);
      expect(config.server.port).toBe(3000);
      expect(config.server.isDevelopment).toBe(true);
    });

    it('should use default values when optional fields are missing', () => {
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';
      delete process.env.PORT;
      delete process.env.NODE_ENV;
      delete process.env.REDIS_HOST;

      const { env } = require('../../../src/config/env');

      expect(env.PORT).toBe(3000);
      expect(env.NODE_ENV).toBe('development');
      expect(env.REDIS_HOST).toBe('localhost');
    });

    it('should handle optional REDIS_PASSWORD field', () => {
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';
      delete process.env.REDIS_PASSWORD;

      const { env } = require('../../../src/config/env');

      expect(env.REDIS_PASSWORD).toBeUndefined();
    });

    it('should handle optional OPENAI_API_KEY field', () => {
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';
      delete process.env.OPENAI_API_KEY;

      const { env } = require('../../../src/config/env');

      expect(env.OPENAI_API_KEY).toBeUndefined();
    });

    it('should correctly parse production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';

      const { config } = require('../../../src/config/env');

      expect(config.server.nodeEnv).toBe('production');
      expect(config.server.isProduction).toBe(true);
      expect(config.server.isDevelopment).toBe(false);
      expect(config.server.isTest).toBe(false);
    });

    it('should correctly parse test environment', () => {
      process.env.NODE_ENV = 'test';
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';

      const { config } = require('../../../src/config/env');

      expect(config.server.nodeEnv).toBe('test');
      expect(config.server.isTest).toBe(true);
      expect(config.server.isDevelopment).toBe(false);
      expect(config.server.isProduction).toBe(false);
    });
  });

  describe('Invalid configuration', () => {
    it('should throw error when PORT is out of valid range', () => {
      process.env.PORT = '99999';
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';

      expect(() => {
        require('../../../src/config/env');
      }).toThrow('Invalid environment configuration');
    });

    it('should throw error when PORT is not a number', () => {
      process.env.PORT = 'invalid';
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';

      expect(() => {
        require('../../../src/config/env');
      }).toThrow('Invalid environment configuration');
    });

    it('should throw error when NODE_ENV is invalid', () => {
      process.env.NODE_ENV = 'staging';
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';

      expect(() => {
        require('../../../src/config/env');
      }).toThrow('Invalid environment configuration');
    });

    it('should throw error when MONGODB_URI is not a valid URL', () => {
      process.env.MONGODB_URI = 'not-a-url';
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';

      expect(() => {
        require('../../../src/config/env');
      }).toThrow('Invalid environment configuration');
    });

    it('should throw error when LLM_PROVIDER is invalid', () => {
      process.env.LLM_PROVIDER = 'invalid-provider';
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';

      expect(() => {
        require('../../../src/config/env');
      }).toThrow('Invalid environment configuration');
    });

    it('should throw error when OLLAMA_BASE_URL is not a valid URL', () => {
      process.env.OLLAMA_BASE_URL = 'not-a-url';
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';

      expect(() => {
        require('../../../src/config/env');
      }).toThrow('Invalid environment configuration');
    });

    it('should throw error when API_KEY is too short', () => {
      process.env.API_KEY = 'short-key';

      expect(() => {
        require('../../../src/config/env');
      }).toThrow('API_KEY must be at least 32 characters for security');
    });

    it('should throw error when API_KEY is missing', () => {
      delete process.env.API_KEY;

      expect(() => {
        require('../../../src/config/env');
      }).toThrow('Invalid environment configuration');
    });
  });

  describe('Configuration object structure', () => {
    beforeEach(() => {
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';
    });

    it('should export typed config object', () => {
      const { config } = require('../../../src/config/env');

      expect(config).toHaveProperty('server');
      expect(config).toHaveProperty('redis');
      expect(config).toHaveProperty('mongodb');
      expect(config).toHaveProperty('llm');
      expect(config).toHaveProperty('socket');
      expect(config).toHaveProperty('auth');
    });

    it('should have correct server config structure', () => {
      const { config } = require('../../../src/config/env');

      expect(config.server).toHaveProperty('port');
      expect(config.server).toHaveProperty('nodeEnv');
      expect(config.server).toHaveProperty('isDevelopment');
      expect(config.server).toHaveProperty('isProduction');
      expect(config.server).toHaveProperty('isTest');
    });

    it('should have correct redis config structure', () => {
      const { config } = require('../../../src/config/env');

      expect(config.redis).toHaveProperty('host');
      expect(config.redis).toHaveProperty('port');
      expect(config.redis).toHaveProperty('password');
    });

    it('should have correct mongodb config structure', () => {
      const { config } = require('../../../src/config/env');

      expect(config.mongodb).toHaveProperty('uri');
    });

    it('should have correct llm config structure', () => {
      const { config } = require('../../../src/config/env');

      expect(config.llm).toHaveProperty('provider');
      expect(config.llm).toHaveProperty('ollama');
      expect(config.llm).toHaveProperty('openai');
      expect(config.llm.ollama).toHaveProperty('baseUrl');
      expect(config.llm.openai).toHaveProperty('apiKey');
    });

    it('should have correct socket config structure', () => {
      const { config } = require('../../../src/config/env');

      expect(config.socket).toHaveProperty('corsOrigin');
    });

    it('should have correct auth config structure', () => {
      const { config } = require('../../../src/config/env');

      expect(config.auth).toHaveProperty('apiKey');
      expect(config.auth.apiKey).toBe('test-api-key-min-32-characters-long-example');
    });
  });

  describe('Type transformations', () => {
    beforeEach(() => {
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';
    });

    it('should transform PORT string to number', () => {
      process.env.PORT = '8080';

      const { env } = require('../../../src/config/env');

      expect(typeof env.PORT).toBe('number');
      expect(env.PORT).toBe(8080);
    });

    it('should transform REDIS_PORT string to number', () => {
      process.env.REDIS_PORT = '6380';

      const { env } = require('../../../src/config/env');

      expect(typeof env.REDIS_PORT).toBe('number');
      expect(env.REDIS_PORT).toBe(6380);
    });

    it('should validate PORT bounds (minimum)', () => {
      process.env.PORT = '0';

      expect(() => {
        require('../../../src/config/env');
      }).toThrow('Invalid environment configuration');
    });

    it('should validate REDIS_PORT bounds (minimum)', () => {
      process.env.REDIS_PORT = '0';

      expect(() => {
        require('../../../src/config/env');
      }).toThrow('Invalid environment configuration');
    });
  });

  describe('LLM Provider configurations', () => {
    beforeEach(() => {
      process.env.API_KEY = 'test-api-key-min-32-characters-long-example';
    });

    it('should configure for ollama provider', () => {
      process.env.LLM_PROVIDER = 'ollama';
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';

      const { config } = require('../../../src/config/env');

      expect(config.llm.provider).toBe('ollama');
      expect(config.llm.ollama.baseUrl).toBe('http://localhost:11434');
    });

    it('should configure for openai provider', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const { config } = require('../../../src/config/env');

      expect(config.llm.provider).toBe('openai');
      expect(config.llm.openai.apiKey).toBe('sk-test-key');
    });
  });
});
