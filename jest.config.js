module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  moduleNameMapper: {
    '^bullmq$': '<rootDir>/tests/__mocks__/bullmq.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/errors$': '<rootDir>/shared/errors/dist/index.js',
    '^@shared/logger$': '<rootDir>/shared/logger/dist/index.js',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  // Fix worker teardown issues
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: false,
  // Cleanup after tests
  globalTeardown: '<rootDir>/tests/teardown.js',
};
