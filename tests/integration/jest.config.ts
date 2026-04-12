export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 60000,
  globalSetup: "./setup/global.setup.ts",
  globalTeardown: "./setup/global.teardown.ts",
  setupFilesAfterFramework: ["./setup/test.setup.ts"],
  testMatch: ["**/*.integration.test.ts"],
  reporters: ["default", "jest-junit"]
};
