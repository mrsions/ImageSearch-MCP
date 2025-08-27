export default {
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results/junit', outputName: 'jest-junit.xml' }],
  ],
  coverageDirectory: 'test-results/coverage',
  transformIgnorePatterns: [
    '/node_modules/(?!node-fetch)/'
  ],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {},
};