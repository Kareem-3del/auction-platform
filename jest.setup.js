import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-for-websocket-testing'
process.env.WS_PORT = '8082'
process.env.NODE_ENV = 'test'

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// WebSocket test helpers
global.testConfig = {
  timeout: 5000,
  wsPort: 8082,
  jwtSecret: 'test-jwt-secret-for-websocket-testing',
}

// Setup and teardown helpers
beforeEach(() => {
  jest.clearAllMocks()
})

// Global error handlers for unhandled promises in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})