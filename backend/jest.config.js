module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/backend/tests/**/*.test.js'],
    verbose: true,
    forceExit: true,
    detectOpenHandles: false,
    testPathIgnorePatterns: ['checkout.integration.test.js'],
};
