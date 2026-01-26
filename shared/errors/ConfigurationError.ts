/**
 * Configuration Error
 *
 * Used for configuration-related errors (e.g., missing environment variables,
 * invalid configuration values, missing API keys).
 */

import { AppError, AppErrorOptions } from './AppError';

export interface ConfigurationErrorOptions extends Omit<AppErrorOptions, 'statusCode'> {
  configKey?: string;
  expectedType?: string;
  actualValue?: unknown;
}

export class ConfigurationError extends AppError {
  public readonly configKey?: string;
  public readonly expectedType?: string;

  constructor(options: ConfigurationErrorOptions | string) {
    const opts: ConfigurationErrorOptions =
      typeof options === 'string' ? { message: options } : options;

    super({
      ...opts,
      statusCode: 500,
      isOperational: false,
    });

    this.configKey = opts.configKey;
    this.expectedType = opts.expectedType;
  }

  static missingEnvVar(varName: string): ConfigurationError {
    return new ConfigurationError({
      message: 'Missing required environment variable: ' + varName,
      configKey: varName,
    });
  }

  static missingApiKey(serviceName: string): ConfigurationError {
    return new ConfigurationError({
      message: serviceName + ' client not initialized (missing API key)',
      configKey: serviceName.toUpperCase() + '_API_KEY',
    });
  }

  static invalidValue(
    configKey: string,
    expectedType: string,
    actualValue?: unknown
  ): ConfigurationError {
    return new ConfigurationError({
      message: 'Invalid configuration value for ' + configKey + ': expected ' + expectedType,
      configKey,
      expectedType,
      actualValue,
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      configKey: this.configKey,
      expectedType: this.expectedType,
    };
  }
}
