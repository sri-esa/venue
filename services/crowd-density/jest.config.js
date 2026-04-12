/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: ['src/processor.ts', 'src/health_monitor.ts'],
  coverageThreshold: {
    global: {
      lines: 70,
    },
  },
};
