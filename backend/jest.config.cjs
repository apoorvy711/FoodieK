module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js"],
  moduleNameMapper: {
    "^uuid$": "<rootDir>/tests/mocks/uuid.cjs",
  },
};
