/**
 * Jest 설정 - 단순화된 구현용
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests-simple'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src-simple/**/*.js',
    '!src-simple/index.js'
  ],
  coverageDirectory: 'coverage-simple',
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  verbose: true
};
