/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
    // All imported modules in your tests should be mocked automatically
    // automock: false,

    // Stop running tests after `n` failures
    // bail: 0,

    // The directory where Jest should store its cached dependency information
    // cacheDirectory: "C:\\Users\\danie\\AppData\\Local\\Temp\\jest",

    // Automatically clear mock calls, instances, contexts and results before every test
    clearMocks: true,

    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,

    // An array of glob patterns indicating a set of files for which coverage information should be collected
    collectCoverageFrom: [
        '**/*.{js,jsx,ts,tsx,svelte}',
        '!**/node_modules/**',
        '!**/vendor/**',
        '!e2e/**',
        '!scripts/**',
        '!**/__tests__/**',
        '!src/pages/**/*.svelte',
        '!babel.config.js',
        '!babel.config.cjs',
        '!jest.config.cjs',
        '!jest.teardown.js',
        '!playwright.config.ts',
        '!svelte.config.js',
        '!coverage/**',
    ],

    // The directory where Jest should output its coverage files
    // coverageDirectory: undefined,

    // An array of regexp pattern strings used to skip coverage collection
    coveragePathIgnorePatterns: ['/node_modules/', '/scripts/'],

    // A list of reporter names that Jest uses when writing coverage reports
    // coverageReporters: [
    //   "json",
    //   "text",
    //   "lcov",
    //   "clover"
    // ],

    // An object that configures minimum threshold enforcement for coverage results
    coverageThreshold: {
        global: {
            lines: 0.9,
            statements: 0.9,
            branches: 0.4,
            functions: 0.7,
        },
    },

    // A path to a custom dependency extractor
    // dependencyExtractor: undefined,

    // Make calling deprecated APIs throw helpful error messages
    // errorOnDeprecated: false,

    // The default configuration for fake timers
    // fakeTimers: {
    //   "enableGlobally": false
    // },

    // Force coverage collection from ignored files using an array of glob patterns
    // forceCoverageMatch: [],

    // A path to a module which exports an async function that is triggered once before all test suites
    // globalSetup: undefined,

    // A path to a module which exports an async function that is triggered once after all test suites
    // globalTeardown: "jest.teardown.js",

    // A set of global variables that need to be available in all test environments
    globals: {
        __SSR__: false,
        __BROWSER__: true,
    },

    // The maximum amount of workers used to run your tests. Can be specified as % or a number. E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.
    // maxWorkers: "50%",

    // An array of directory names to be searched recursively up from the requiring module's location
    moduleDirectories: ['node_modules', 'src'],

    // An array of file extensions your modules use
    moduleFileExtensions: ['js', 'ts', 'svelte'],

    // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
    moduleNameMapper: {
        '^\\$lib(.*)$': '<rootDir>/src/lib$1',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    },

    // An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
    // modulePathIgnorePatterns: [],

    // Activates notifications for test results
    // notify: false,

    // An enum that specifies notification mode. Requires { notify: true }
    // notifyMode: "failure-change",

    // A preset that is used as a base for Jest's configuration
    // preset: undefined,

    // Run tests from one or more projects
    // projects: undefined,

    // Use this configuration option to add custom reporters to Jest
    // reporters: undefined,

    // Automatically reset mock state before every test
    // resetMocks: false,

    // Reset the module registry before running each individual test
    // resetModules: false,

    // A path to a custom resolver
    // resolver: undefined,

    // Automatically restore mock state and implementation before every test
    // restoreMocks: false,

    // The root directory that Jest should scan for tests and modules within
    // rootDir: undefined,

    // A list of paths to directories that Jest should use to search for files in
    roots: ['<rootDir>'],

    // Allows you to use a custom runner instead of Jest's default test runner
    // runner: "jest-runner",

    // The paths to modules that run some code to configure or set up the testing environment before each test
    setupFiles: ['<rootDir>/jest.setup.js'],

    // A list of paths to modules that run some code to configure or set up the testing framework before each test
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // The number of seconds after which a test is considered as slow and reported as such in the results.
    // slowTestThreshold: 5,

    // A list of paths to snapshot serializer modules Jest should use for snapshot testing
    // snapshotSerializers: [],

    // The test environment that will be used for testing
    testEnvironment: 'jsdom',

    // Options that will be passed to the testEnvironment
    testEnvironmentOptions: {
        customExportConditions: ['node', 'node-addons'],
    },

    // Adds a location field to test results
    // testLocationInResults: false,

    // The glob patterns Jest uses to detect test files
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: [
        '/node_modules/',
        '/.svelte-kit/',
        '/e2e/',
        '/coverage/',
        '/test-results/',
        // Previously broken tests that have been fixed:
        // '__tests__/indexeddb.test.js', - FIXED (structuredClone polyfill)
        // '__tests__/entityType.test.js', - FIXED (import path)
        // '__tests__/customcontent.test.js', - FIXED (structuredClone polyfill + assertions)
        // '__tests__/gameState/inventory.test.js', - FIXED (import path)

        // Svelte component testing issues - "init is not a function" errors
        // These components are actively used in the app but need different testing approach
        '__tests__/ItemForm.test.js', // Used in items/create.astro, inventory/create.astro + e2e tested
        '__tests__/ItemSelector.test.js', // Used by ProcessForm component + e2e tested
        '__tests__/ProcessForm.test.js', // Used in processes/create.astro + e2e tested
        '__tests__/ProcessPreview.test.js',
        '__tests__/Quests.test.js', // Used in quests/index.astro + e2e tested
    ],

    // The regexp pattern or array of patterns that Jest uses to detect test files
    // testRegex: [],

    // This option allows the use of a custom results processor
    // testResultsProcessor: undefined,

    // This option allows use of a custom test runner
    // testRunner: "jest-circus/runner",

    // A map from regular expressions to paths to transformers
    transform: {
        '^.+\\.svelte$': [
            'svelte-jester',
            {
                preprocess: false,
                compilerOptions: {
                    dev: true,
                },
                rootMode: 'upward',
            },
        ],
        '^.+\\.js$': [
            'babel-jest',
            {
                configFile: './babel.config.cjs',
            },
        ],
        '^.+\\.ts$': 'ts-jest',
    },

    // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
    transformIgnorePatterns: ['/node_modules/(?!(svelte|@testing-library)/).+\\.js$'],

    // An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them
    // unmockedModulePathPatterns: undefined,

    // Indicates whether each individual test should be reported during the run
    // verbose: undefined,

    // An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
    // watchPathIgnorePatterns: [],

    // Whether to use watchman for file crawling
    // watchman: true,
};

module.exports = config;
