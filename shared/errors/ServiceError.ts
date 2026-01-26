/**
 * Service Error
 *
 * Used for service-layer errors (e.g., external API failures,
 * service not initialized, processing errors).
 */

import { AppError, AppErrorOptions } from './AppError';

export type ServiceName =
  | 'scheduler'
  | 'llm'
  | 'memory'
  | 'deadlock'
  | 'checkpoint'
  | 'ollama'
  | 'openai'
  | 'unknown';

export interface ServiceErrorOptions extends Omit<AppErrorOptions, 'statusCode'> {
  statusCode?: number;
  serviceName?: ServiceName;
  operation?: string;
}

export class ServiceError extends AppError {
  public readonly serviceName: ServiceName;
  public readonly operation?: string;

  constructor(options: ServiceErrorOptions | string) {
    const opts: ServiceErrorOptions =
      typeof options === 'string' ? { message: options } : options;

    super({
      ...opts,
      statusCode: opts.statusCode ?? 500,
      isOperational: opts.isOperational ?? true,
    });

    this.serviceName = opts.serviceName ?? 'unknown';
    this.operation = opts.operation;
  }

  static notInitialized(serviceName: ServiceName): ServiceError {
    const capitalizedName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
    return new ServiceError({
      message: capitalizedName + ' not initialized',
      serviceName,
      statusCode: 503,
      isOperational: true,
    });
  }

  static externalFailure(
    serviceName: ServiceName,
    operation: string,
    cause?: Error
  ): ServiceError {
    const errorMsg = cause?.message ?? 'Unknown error';
    return new ServiceError({
      message: serviceName + ' ' + operation + ' failed: ' + errorMsg,
      serviceName,
      operation,
      statusCode: 502,
      cause,
    });
  }

  static processingFailed(
    serviceName: ServiceName,
    operation: string,
    details?: string
  ): ServiceError {
    const detailSuffix = details ? ': ' + details : '';
    return new ServiceError({
      message: serviceName + ' processing failed' + detailSuffix,
      serviceName,
      operation,
      statusCode: 500,
    });
  }

  static unsupportedOperation(serviceName: ServiceName, operation: string): ServiceError {
    return new ServiceError({
      message: 'Unsupported ' + serviceName + ' operation: ' + operation,
      serviceName,
      operation,
      statusCode: 400,
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      serviceName: this.serviceName,
      operation: this.operation,
    };
  }
}
