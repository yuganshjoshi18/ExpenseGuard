module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: '../reports/coverage/backend',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 45,
      functions: 70,
      lines: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // All suites share the same real database, so run them serially to avoid
  // one suite cleaning up records another suite is still using.
  maxWorkers: 1,
  testTimeout: 30000
};