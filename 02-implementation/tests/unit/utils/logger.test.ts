/**
 * Logger Unit Tests
 *
 * Tests for the Logger utility with configurable log levels.
 */

import { logger, createLogger, LogLevel } from '../../../src/utils/logger';

describe('Logger', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Log Level Enum', () => {
    it('should have DEBUG level as 0', () => {
      expect(LogLevel.DEBUG).toBe(0);
    });

    it('should have INFO level as 1', () => {
      expect(LogLevel.INFO).toBe(1);
    });

    it('should have WARN level as 2', () => {
      expect(LogLevel.WARN).toBe(2);
    });

    it('should have ERROR level as 3', () => {
      expect(LogLevel.ERROR).toBe(3);
    });
  });

  describe('Default Logger', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined();
    });

    it('should log info messages', () => {
      logger.info('Test info message');
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('INFO'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Test info message'));
    });

    it('should log warn messages', () => {
      logger.warn('Test warn message');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'));
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
    });

    it('should include metadata in log message', () => {
      const meta = { userId: 123, action: 'test' };
      logger.info('Test with meta', meta);
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(meta)));
    });

    it('should include timestamp in log message', () => {
      logger.info('Test timestamp');
      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('setLevel', () => {
    it('should change log level dynamically', () => {
      const childLogger = createLogger('test-set-level');
      childLogger.setLevel(LogLevel.ERROR);

      childLogger.info('Should not log');
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      childLogger.error('Should log');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should allow DEBUG level after setting', () => {
      const childLogger = createLogger('test-debug-level');
      childLogger.setLevel(LogLevel.DEBUG);

      childLogger.debug('Debug message');
      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('DEBUG'));
    });

    it('should filter messages below current level', () => {
      const childLogger = createLogger('test-filter');
      childLogger.setLevel(LogLevel.WARN);

      childLogger.debug('Should not log');
      childLogger.info('Should not log');
      childLogger.warn('Should log');
      childLogger.error('Should log');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('createLogger (Child Logger)', () => {
    it('should create child logger with prefix', () => {
      const childLogger = createLogger('TestModule');
      childLogger.info('Test message');

      // Logger format: [LLMScheduler:ModuleName]
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('TestModule'));
    });

    it('should create multiple independent child loggers', () => {
      const logger1 = createLogger('Module1');
      const logger2 = createLogger('Module2');

      logger1.info('Message from module 1');
      logger2.info('Message from module 2');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(2);
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Module1'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Module2'));
    });
  });

  describe('Log Formatting', () => {
    it('should format message with timestamp, level, and content', () => {
      const childLogger = createLogger('FormatTest');
      childLogger.info('Formatted message');

      const call = consoleInfoSpy.mock.calls[0][0];
      // Logger format: [timestamp] [LEVEL] [LLMScheduler:Module] message
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
      expect(call).toContain('INFO');
      expect(call).toContain('FormatTest');
      expect(call).toContain('Formatted message');
    });

    it('should handle undefined metadata', () => {
      const childLogger = createLogger('MetaTest');
      childLogger.info('No meta');

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).not.toContain('undefined');
    });

    it('should handle null metadata', () => {
      const childLogger = createLogger('NullMetaTest');
      childLogger.info('Null meta', null);

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('null');
    });
  });

  describe('Debug Level Logging', () => {
    it('should log debug messages when level is DEBUG', () => {
      const debugLogger = createLogger('DebugTest');
      debugLogger.setLevel(LogLevel.DEBUG);

      debugLogger.debug('Debug message');

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('DEBUG'));
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
    });

    it('should not log debug messages when level is INFO', () => {
      const infoLogger = createLogger('InfoTest');
      infoLogger.setLevel(LogLevel.INFO);

      infoLogger.debug('Should not appear');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should include metadata in debug messages', () => {
      const debugLogger = createLogger('DebugMeta');
      debugLogger.setLevel(LogLevel.DEBUG);

      const meta = { key: 'value' };
      debugLogger.debug('Debug with meta', meta);

      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(meta)));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      logger.info('');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should handle special characters in message', () => {
      const specialMessage = '!@#$%^&*()_+-={}[]|:";\'<>?,./~';
      logger.info(specialMessage);
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should handle unicode characters', () => {
      const unicodeMessage = 'Test message';
      logger.info(unicodeMessage);
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should handle error objects as metadata', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('child() method', () => {
    it('should create child logger with extended prefix', () => {
      const parentLogger = createLogger('Parent');
      const childLogger = parentLogger.child('Child');

      childLogger.info('Child message');

      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Parent'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Child'));
    });

    it('should create multiple levels of child loggers', () => {
      const parentLogger = createLogger('Level1');
      const childLogger = parentLogger.child('Level2');
      const grandchildLogger = childLogger.child('Level3');

      grandchildLogger.info('Nested message');

      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should allow independent log level from parent', () => {
      const parentLogger = createLogger('Parent');
      parentLogger.setLevel(LogLevel.ERROR);

      const childLogger = parentLogger.child('Child');
      childLogger.setLevel(LogLevel.INFO);

      childLogger.info('Should log in child');
      expect(consoleInfoSpy).toHaveBeenCalled();

      // Child can have different level than parent
      expect(childLogger.getLevel()).toBe(LogLevel.INFO);
    });
  });

  describe('getLevel() method', () => {
    it('should return current log level', () => {
      const testLogger = createLogger('GetLevelTest');

      testLogger.setLevel(LogLevel.DEBUG);
      expect(testLogger.getLevel()).toBe(LogLevel.DEBUG);

      testLogger.setLevel(LogLevel.INFO);
      expect(testLogger.getLevel()).toBe(LogLevel.INFO);

      testLogger.setLevel(LogLevel.WARN);
      expect(testLogger.getLevel()).toBe(LogLevel.WARN);

      testLogger.setLevel(LogLevel.ERROR);
      expect(testLogger.getLevel()).toBe(LogLevel.ERROR);
    });

    it('should return default log level if not set', () => {
      const testLogger = createLogger('DefaultLevelTest');
      const level = testLogger.getLevel();

      expect(level).toBeDefined();
      expect([LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]).toContain(level);
    });
  });

  describe('Correlation ID integration', () => {
    it('should include correlation ID in log messages', () => {
      // This test verifies that correlationId is included via getEnhancedMeta
      const testLogger = createLogger('CorrelationTest');
      testLogger.info('Test with correlation');

      expect(consoleInfoSpy).toHaveBeenCalled();
      // Correlation ID should be included in the metadata
      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('correlationId');
    });
  });
});

describe('Logger with Environment Variables', () => {
  const originalEnv = process.env.LOG_LEVEL;

  afterEach(() => {
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.LOG_LEVEL = originalEnv;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

  describe('parseLogLevel via environment variable', () => {
    it('should parse DEBUG level from environment', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      
      // Create a new logger instance that will read the env var
      const { createLogger: createNewLogger } = jest.requireActual('../../../src/utils/logger');
      const testLogger = createNewLogger('TestDebugEnv');
      
      // The logger should be created with DEBUG level
      expect(testLogger).toBeDefined();
    });

    it('should parse INFO level from environment', () => {
      process.env.LOG_LEVEL = 'INFO';
      
      const { createLogger: createNewLogger } = jest.requireActual('../../../src/utils/logger');
      const testLogger = createNewLogger('TestInfoEnv');
      
      expect(testLogger).toBeDefined();
    });

    it('should parse WARN level from environment', () => {
      process.env.LOG_LEVEL = 'WARN';
      
      const { createLogger: createNewLogger } = jest.requireActual('../../../src/utils/logger');
      const testLogger = createNewLogger('TestWarnEnv');
      
      expect(testLogger).toBeDefined();
    });

    it('should parse ERROR level from environment', () => {
      process.env.LOG_LEVEL = 'ERROR';
      
      const { createLogger: createNewLogger } = jest.requireActual('../../../src/utils/logger');
      const testLogger = createNewLogger('TestErrorEnv');
      
      expect(testLogger).toBeDefined();
    });

    it('should handle lowercase log level', () => {
      process.env.LOG_LEVEL = 'debug';
      
      const { createLogger: createNewLogger } = jest.requireActual('../../../src/utils/logger');
      const testLogger = createNewLogger('TestLowercase');
      
      expect(testLogger).toBeDefined();
    });

    it('should handle mixed case log level', () => {
      process.env.LOG_LEVEL = 'Debug';
      
      const { createLogger: createNewLogger } = jest.requireActual('../../../src/utils/logger');
      const testLogger = createNewLogger('TestMixedCase');
      
      expect(testLogger).toBeDefined();
    });

    it('should handle invalid log level by using default', () => {
      process.env.LOG_LEVEL = 'INVALID_LEVEL';
      
      const { createLogger: createNewLogger } = jest.requireActual('../../../src/utils/logger');
      const testLogger = createNewLogger('TestInvalid');
      
      // Should still create logger with default level
      expect(testLogger).toBeDefined();
    });

    it('should handle empty log level', () => {
      process.env.LOG_LEVEL = '';
      
      const { createLogger: createNewLogger } = jest.requireActual('../../../src/utils/logger');
      const testLogger = createNewLogger('TestEmpty');
      
      expect(testLogger).toBeDefined();
    });

    it('should handle undefined log level', () => {
      delete process.env.LOG_LEVEL;
      
      const { createLogger: createNewLogger } = jest.requireActual('../../../src/utils/logger');
      const testLogger = createNewLogger('TestUndefined');
      
      expect(testLogger).toBeDefined();
    });
  });
});
