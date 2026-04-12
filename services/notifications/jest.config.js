/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/__tests__/**', '!src/index.ts'],
  coverageThreshold: {
    global: {
      lines: 70,
    },
  },
};
