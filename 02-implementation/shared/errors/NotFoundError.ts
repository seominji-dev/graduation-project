/**
 * Not Found Error
 *
 * Used when a requested resource cannot be found
 * (e.g., entity not in database, missing file, unknown route).
 */

import { AppError, AppErrorOptions } from './AppError';

export interface NotFoundErrorOptions extends Omit<AppErrorOptions, 'statusCode'> {
  resourceType?: string;
  resourceId?: string;
}

export class NotFoundError extends AppError {
  public readonly resourceType?: string;
  public readonly resourceId?: string;

  constructor(options: NotFoundErrorOptions | string) {
    const opts: NotFoundErrorOptions =
      typeof options === 'string' ? { message: options } : options;

    super({
      ...opts,
      statusCode: 404,
      isOperational: true,
    });

    this.resourceType = opts.resourceType;
    this.resourceId = opts.resourceId;
  }

  /**
   * Create not found error for a specific resource type and ID
   */
  static forResource(resourceType: string, resourceId: string): NotFoundError {
    return new NotFoundError({
      message: `${resourceType} not found: ${resourceId}`,
      resourceType,
      resourceId,
    });
  }

  /**
   * Create not found error for route
   */
  static forRoute(path: string): NotFoundError {
    return new NotFoundError({
      message: `Route not found: ${path}`,
      resourceType: 'route',
      resourceId: path,
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      resourceType: this.resourceType,
      resourceId: this.resourceId,
    };
  }
}
