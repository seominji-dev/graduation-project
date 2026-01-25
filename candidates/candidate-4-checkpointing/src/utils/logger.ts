/**
 * Logger Utility
 * Production-ready logging with log levels and structured output
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
  data?: unknown;
}

class Logger {
  private level: LogLevel;
  private context: string;

  constructor(context: string = 'App', level?: LogLevel) {
    this.context = context;
    this.level = level ?? this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private formatMessage(level: string, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...(data !== undefined && { data }),
    };
  }

  private log(level: LogLevel, levelName: string, message: string, data?: unknown): void {
    if (level < this.level) {
      return;
    }

    const entry = this.formatMessage(levelName, message, data);

    if (process.env.NODE_ENV === 'production') {
      // Structured JSON output for production
      const output = JSON.stringify(entry);
      if (level >= LogLevel.ERROR) {
        process.stderr.write(output + '\n');
      } else {
        process.stdout.write(output + '\n');
      }
    } else {
      // Human-readable output for development
      const prefix = `[${entry.timestamp}] [${levelName}] [${this.context}]`;
      if (level >= LogLevel.ERROR) {
        if (data !== undefined) {
          // eslint-disable-next-line no-console
          console.error(`${prefix} ${message}`, data);
        } else {
          // eslint-disable-next-line no-console
          console.error(`${prefix} ${message}`);
        }
      } else if (level >= LogLevel.WARN) {
        if (data !== undefined) {
          // eslint-disable-next-line no-console
          console.warn(`${prefix} ${message}`, data);
        } else {
          // eslint-disable-next-line no-console
          console.warn(`${prefix} ${message}`);
        }
      } else {
        if (data !== undefined) {
          // eslint-disable-next-line no-console
          console.log(`${prefix} ${message}`, data);
        } else {
          // eslint-disable-next-line no-console
          console.log(`${prefix} ${message}`);
        }
      }
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, 'INFO', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, 'WARN', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, 'ERROR', message, data);
  }

  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`, this.level);
  }
}

// Create default logger instance
export const logger = new Logger('Checkpointing');

// Export Logger class for creating child loggers
export { Logger };
