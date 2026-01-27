/**
 * Jest Setup File
 * Sets up required environment variables before tests run
 */

// Set required environment variables for testing
process.env.API_KEY = 'test-api-key-at-least-32-characters-long';
process.env.NODE_ENV = 'test';
