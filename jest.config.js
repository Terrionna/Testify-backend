// JavaScript source code
// Jest settings for Testify.
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    // Runs before each test file to set the environment variables the code reads.
    setupFiles: ['<rootDir>/tests/setup-env.js'],
    // The first run downloads a test database, which can take a while.
    testTimeout: 60000
};