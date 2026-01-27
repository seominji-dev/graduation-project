/**
 * Database Error
 *
 * Used for database-related errors (e.g., connection failures,
 * query errors, transaction failures).
 */

import { AppError, AppErrorOptions } from './AppError';

export type DatabaseType = 'mongodb' | 'redis' | 'chromadb' | 'postgres' | 'unknown';
export type DatabaseOperation =
  | 'connect'
  | 'disconnect'
  | 'query'
  | 'insert'
  | 'update'
  | 'delete'
  | 'transaction'
  | 'unknown';

export interface DatabaseErrorOptions extends Omit<AppErrorOptions, 'statusCode'> {
  databaseType?: DatabaseType;
  operation?: DatabaseOperation;
  collection?: string;
}

export class DatabaseError extends AppError {
  public readonly databaseType: DatabaseType;
  public readonly operation: DatabaseOperation;
  public readonly collection?: string;

  constructor(options: DatabaseErrorOptions | string) {
    const opts: DatabaseErrorOptions =
      typeof options === 'string' ? { message: options } : options;

    super({
      ...opts,
      statusCode: 503,
      isOperational: opts.isOperational ?? false,
    });

    this.databaseType = opts.databaseType ?? 'unknown';
    this.operation = opts.operation ?? 'unknown';
    this.collection = opts.collection;
  }

  static connectionFailed(databaseType: DatabaseType, cause?: Error): DatabaseError {
    return new DatabaseError({
      message: 'Failed to connect to ' + databaseType,
      databaseType,
      operation: 'connect',
      cause,
      isOperational: false,
    });
  }

  static notInitialized(databaseType: DatabaseType): DatabaseError {
    const capitalizedType = databaseType.charAt(0).toUpperCase() + databaseType.slice(1);
    return new DatabaseError({
      message: capitalizedType + ' not initialized',
      databaseType,
      operation: 'connect',
      isOperational: true,
    });
  }

  static queryFailed(
    databaseType: DatabaseType,
    operation: DatabaseOperation,
    cause?: Error
  ): DatabaseError {
    return new DatabaseError({
      message: databaseType + ' ' + operation + ' operation failed',
      databaseType,
      operation,
      cause,
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      databaseType: this.databaseType,
      operation: this.operation,
      collection: this.collection,
    };
  }
}
