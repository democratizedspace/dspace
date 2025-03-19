module.exports = {
    transform: {
        '^.+\\.svelte$': ['svelte-jester', { preprocess: true }],
        '^.+\\.js$': 'babel-jest',
        '^.+\\.ts$': 'ts-jest',
    },
    moduleFileExtensions: ['js', 'ts', 'svelte'],
    setupFilesAfterEnv: ['./jest-setup.js'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.js',
        '^\\$lib/(.*)': '<rootDir>/src/$1',
    },
    testPathIgnorePatterns: ['/node_modules/', '/.svelte-kit/'],
    roots: ['./src', './__tests__'],
    collectCoverageFrom: ['src/**/*.{js,svelte}', '!**/node_modules/**'],
    globalTeardown: '<rootDir>/jest.teardown.js',
};
