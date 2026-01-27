/**
 * Base Application Error Class
 *
 * All custom errors should extend this class.
 * Provides consistent error structure with statusCode and isOperational flag.
 */

export interface AppErrorOptions {
  message: string;
  statusCode?: number;
  isOperational?: boolean;
  cause?: Error;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly cause?: Error;

  constructor(options: AppErrorOptions | string) {
    const opts: AppErrorOptions =
      typeof options === 'string' ? { message: options } : options;

    super(opts.message);

    this.name = this.constructor.name;
    this.statusCode = opts.statusCode ?? 500;
    this.isOperational = opts.isOperational ?? true;
    this.timestamp = new Date();
    this.cause = opts.cause;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize error for JSON response
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp.toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }

  /**
   * Check if an error is an AppError instance
   */
  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}
