/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '8080';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.SQL_SERVER = 'localhost';
process.env.SQL_DATABASE = 'TestDB';
process.env.SQL_USER = 'sa';
process.env.SQL_PASSWORD = 'TestPassword123!';
process.env.SQL_ENCRYPT = 'false';
process.env.SQL_TRUST_SERVER_CERTIFICATE = 'true';

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock Azure services for testing
jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn()
}));

jest.mock('@azure/keyvault-secrets', () => ({
  SecretClient: jest.fn()
}));

jest.mock('applicationinsights', () => ({
  setup: jest.fn(() => ({
    setAutoDependencyCorrelation: jest.fn().mockReturnThis(),
    setAutoCollectRequests: jest.fn().mockReturnThis(),
    setAutoCollectPerformance: jest.fn().mockReturnThis(),
    setAutoCollectExceptions: jest.fn().mockReturnThis(),
    setAutoCollectDependencies: jest.fn().mockReturnThis(),
    setAutoCollectConsole: jest.fn().mockReturnThis(),
    setUseDiskRetryCaching: jest.fn().mockReturnThis(),
    setSendLiveMetrics: jest.fn().mockReturnThis(),
    setDistributedTracingMode: jest.fn().mockReturnThis(),
    start: jest.fn()
  })),
  defaultClient: {
    trackEvent: jest.fn(),
    trackMetric: jest.fn(),
    trackException: jest.fn()
  }
}));
