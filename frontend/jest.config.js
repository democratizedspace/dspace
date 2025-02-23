module.exports = {
  transform: {
    '^.+\\.svelte$': ['svelte-jester', {
      preprocess: false,
      compilerOptions: {
        dev: false
      }
    }],
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'svelte'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    html: '<!DOCTYPE html><html><head></head><body></body></html>',
    url: 'http://localhost',
    includeNodeLocations: true,
    storageQuota: 10000000,
    pretendToBeVisual: true,
    resources: 'usable'
  },
  testPathIgnorePatterns: ['node_modules'],
  bail: false,
  verbose: true,
  transformIgnorePatterns: ['node_modules'],
  setupFiles: [
    '<rootDir>/setupJest.js',
    'fake-indexeddb/auto'
  ],
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  roots: ['./src', './__tests__'],
  collectCoverageFrom: [
    'src/**/*.{js,svelte}',
    '!**/node_modules/**',
  ]
};