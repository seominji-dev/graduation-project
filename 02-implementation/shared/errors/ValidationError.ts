/**
 * Validation Error
 *
 * Used when request data fails validation (e.g., missing required fields,
 * invalid format, constraint violations).
 */

import { AppError, AppErrorOptions } from './AppError';

export interface ValidationErrorDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
}

export interface ValidationErrorOptions extends Omit<AppErrorOptions, 'statusCode'> {
  details?: ValidationErrorDetails | ValidationErrorDetails[];
}

export class ValidationError extends AppError {
  public readonly details?: ValidationErrorDetails | ValidationErrorDetails[];

  constructor(options: ValidationErrorOptions | string) {
    const opts: ValidationErrorOptions =
      typeof options === 'string' ? { message: options } : options;

    super({
      ...opts,
      statusCode: 400,
      isOperational: true,
    });

    this.details = opts.details;
  }

  /**
   * Create validation error for missing required field
   */
  static missingField(fieldName: string): ValidationError {
    return new ValidationError({
      message: `Missing required field: ${fieldName}`,
      details: { field: fieldName, constraint: 'required' },
    });
  }

  /**
   * Create validation error for invalid field value
   */
  static invalidValue(fieldName: string, value: unknown, constraint?: string): ValidationError {
    return new ValidationError({
      message: `Invalid value for field: ${fieldName}`,
      details: { field: fieldName, value, constraint },
    });
  }

  /**
   * Create validation error for multiple field errors
   */
  static multipleErrors(errors: ValidationErrorDetails[]): ValidationError {
    const fieldNames = errors
      .filter((e) => e.field)
      .map((e) => e.field)
      .join(', ');
    return new ValidationError({
      message: `Validation failed for fields: ${fieldNames}`,
      details: errors,
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      details: this.details,
    };
  }
}
