const { GRIDMIX_TEST = 'unit' } = process.env

module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^chalk$': '<rootDir>/test-utils/chalk-jest-mock.js'
  },
  testMatch: [
    `**/__tests__/**/*.${GRIDMIX_TEST === 'e2e' ? 'e2e' : 'spec'}.js`
  ],
  collectCoverageFrom: [
    'gridmix/lib/**/*.js'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__fixtures__/',
    '<rootDir>/projects/',
    '<rootDir>/scripts/'
  ],
  watchPathIgnorePatterns: [
    '<rootDir>/__fixtures__/',
    '/node_modules/',
    '<rootDir>/projects/',
    '/.git/'
  ]
}
