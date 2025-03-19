module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: ['./jest.setup.js'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.js',
    },
    testPathIgnorePatterns: ['/node_modules/', '/.svelte-kit/'],
    transform: {
        '^.+\\.svelte$': 'svelte-jester',
        '^.+\\.js$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'svelte'],
    roots: ['./src', './__tests__'],
    collectCoverageFrom: ['src/**/*.{js,svelte}', '!**/node_modules/**'],
    globalTeardown: '<rootDir>/jest.teardown.js',
};
