import { Logger, LogLevel, logger } from '../../../src/utils/logger';

describe('Logger - Additional Coverage', () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleError: typeof console.error;
  let originalConsoleDebug: typeof console.debug;
  let mockLog: jest.Mock;
  let mockWarn: jest.Mock;
  let mockError: jest.Mock;
  let mockDebug: jest.Mock;

  beforeEach(() => {
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    originalConsoleDebug = console.debug;

    mockLog = jest.fn();
    mockWarn = jest.fn();
    mockError = jest.fn();
    mockDebug = jest.fn();

    console.log = mockLog;
    console.warn = mockWarn;
    console.error = mockError;
    console.debug = mockDebug;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.debug = originalConsoleDebug;
  });

  describe('Logger levels - lines 79-90', () => {
    it('should log debug messages when level is DEBUG', () => {
      const testLogger = new Logger({ level: LogLevel.DEBUG, prefix: 'Test' });
      testLogger.debug('Debug message');

      expect(mockDebug).toHaveBeenCalled();
    });

    it('should not log debug when level is INFO', () => {
      const testLogger = new Logger({ level: LogLevel.INFO, prefix: 'Test' });
      testLogger.debug('Debug message');

      expect(mockDebug).not.toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const testLogger = new Logger({ level: LogLevel.INFO, prefix: 'Test' });
      testLogger.info('Info message');

      expect(mockLog).toHaveBeenCalled();
    });

    it('should not log info when level is WARN', () => {
      const testLogger = new Logger({ level: LogLevel.WARN, prefix: 'Test' });
      testLogger.info('Info message');

      expect(mockLog).not.toHaveBeenCalled();
    });
  });

  describe('Logger warn - line 100', () => {
    it('should log warning messages', () => {
      const testLogger = new Logger({ level: LogLevel.WARN, prefix: 'Test' });
      testLogger.warn('Warning message');

      expect(mockWarn).toHaveBeenCalled();
    });

    it('should not log warn when level is ERROR', () => {
      const testLogger = new Logger({ level: LogLevel.ERROR, prefix: 'Test' });
      testLogger.warn('Warning message');

      expect(mockWarn).not.toHaveBeenCalled();
    });
  });

  describe('Logger with metadata - lines 142-149', () => {
    it('should include metadata in log output', () => {
      const testLogger = new Logger({ level: LogLevel.INFO, prefix: 'Test' });
      testLogger.info('Message with metadata', { key: 'value', num: 42 });

      expect(mockLog).toHaveBeenCalled();
      const logCall = mockLog.mock.calls[0][0];
      expect(logCall).toContain('key');
    });

    it('should handle complex metadata objects', () => {
      const testLogger = new Logger({ level: LogLevel.INFO, prefix: 'Test' });
      testLogger.info('Complex metadata', {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
      });

      expect(mockLog).toHaveBeenCalled();
    });
  });

  describe('Logger error with Error object - lines 172-182', () => {
    it('should handle Error objects in metadata', () => {
      const testLogger = new Logger({ level: LogLevel.ERROR, prefix: 'Test' });
      const error = new Error('Test error');
      testLogger.error('Error occurred', error);

      expect(mockError).toHaveBeenCalled();
      const logCall = mockError.mock.calls[0][0];
      expect(logCall).toContain('Test error');
    });

    it('should handle Error objects with additional properties', () => {
      const testLogger = new Logger({ level: LogLevel.ERROR, prefix: 'Test' });
      const error = new Error('Test error');
      (error as any).code = 'ERR_TEST';
      testLogger.error('Error with code', error);

      expect(mockError).toHaveBeenCalled();
    });
  });

  describe('Logger child - lines 230-237', () => {
    it('should create child logger with combined prefix', () => {
      const parentLogger = new Logger({ level: LogLevel.INFO, prefix: 'Parent' });
      const childLogger = parentLogger.child('Child');
      childLogger.info('Child message');

      expect(mockLog).toHaveBeenCalled();
      const logCall = mockLog.mock.calls[0][0];
      expect(logCall).toContain('Parent:Child');
    });

    it('should inherit log level from parent', () => {
      const parentLogger = new Logger({ level: LogLevel.WARN, prefix: 'Parent' });
      const childLogger = parentLogger.child('Child');
      childLogger.info('Should not log');

      expect(mockLog).not.toHaveBeenCalled();
    });
  });

  describe('Default logger instance', () => {
    it('should be a Logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create child loggers', () => {
      const child = logger.child('TestModule');
      expect(child).toBeInstanceOf(Logger);
    });
  });

  describe('setLevel and getLevel', () => {
    it('should allow changing log level dynamically', () => {
      const testLogger = new Logger({ level: LogLevel.ERROR, prefix: 'Test' });
      
      expect(testLogger.getLevel()).toBe(LogLevel.ERROR);
      
      testLogger.setLevel(LogLevel.DEBUG);
      
      expect(testLogger.getLevel()).toBe(LogLevel.DEBUG);
    });
  });

  describe('Timestamp formatting', () => {
    it('should include ISO timestamp in log output', () => {
      const testLogger = new Logger({ level: LogLevel.INFO, prefix: 'Test' });
      testLogger.info('Timestamp test');

      expect(mockLog).toHaveBeenCalled();
      const logCall = mockLog.mock.calls[0][0];
      expect(logCall).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
