/**
 * Application Configuration
 * Re-exports environment configuration and provides additional constants
 */

// Re-export all configuration from env.ts
export { env, config } from './env.js';
export type { Env, Config } from './env.js';

// Re-export constants
export * from './constants.js';
