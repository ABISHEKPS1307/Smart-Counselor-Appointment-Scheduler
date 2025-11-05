/**
 * Jest Configuration for ES Modules
 */

export default {
  testEnvironment: 'node',
  verbose: true,
  collectCoverageFrom: [
    'server.js',
    '!node_modules/**',
    '!coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/*.test.js'
  ],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
