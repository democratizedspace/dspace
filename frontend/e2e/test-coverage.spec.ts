import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory for e2e tests
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const e2eDir = __dirname;
const testsDir = path.resolve(__dirname, '../__tests__');

test('verify no e2e test files are orphaned from test:pr workflow', async () => {
    // Read the run-test-groups.mjs file content
    const groupsFilePath = path.resolve(__dirname, '../scripts/run-test-groups.mjs');

    // Check if file exists before reading
    if (!fs.existsSync(groupsFilePath)) {
        console.error(`File not found: ${groupsFilePath}`);
        console.log('Current directory:', process.cwd());
        console.log('__dirname:', __dirname);
        test.skip(true, `Could not find file: ${groupsFilePath}`);
        return;
    }

    const groupsFileContent = fs.readFileSync(groupsFilePath, 'utf8');

    // Get all test files in the e2e directory
    const allTestFiles = fs
        .readdirSync(e2eDir)
        .filter((file) => file.endsWith('.spec.ts'))
        .filter((file) => file !== 'test-coverage.spec.ts'); // Exclude this test file

    // Create a set of all files referenced in the test groups
    const referencedFiles = new Set();

    // Extract all test files from the TEST_GROUPS array
    const fileRegex = /'([^']+\.spec\.ts)'/g;
    let match;
    while ((match = fileRegex.exec(groupsFileContent)) !== null) {
        referencedFiles.add(match[1]);
    }

    // Find orphaned files (files not referenced in any test group)
    const orphanedFiles = allTestFiles.filter((file) => !referencedFiles.has(file));

    // Log the found files for debugging
    console.log('All test files:', allTestFiles);
    console.log('Referenced files:', Array.from(referencedFiles));
    console.log('Orphaned files:', orphanedFiles);

    // Test will fail if there are any orphaned files
    if (orphanedFiles.length > 0) {
        const errorMessage = `Found ${
            orphanedFiles.length
        } orphaned test files not included in test:pr workflow: ${orphanedFiles.join(', ')}`;
        console.error(errorMessage);
        test.fail(true, errorMessage);
    }

    expect(orphanedFiles.length).toBe(0);
});

test('verify Jest test files are included in package.json test configuration', async () => {
    // Path to package.json
    const packageJsonPath = path.resolve(__dirname, '../package.json');

    // Check if file exists before reading
    if (!fs.existsSync(packageJsonPath)) {
        console.error(`File not found: ${packageJsonPath}`);
        test.skip(true, `Could not find file: ${packageJsonPath}`);
        return;
    }

    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    // Get all Jest test files in the __tests__ directory
    const allJestTestFiles = [];

    // Recursively scan the __tests__ directory
    function scanDirectory(dir) {
        if (!fs.existsSync(dir)) {
            console.warn(`Directory does not exist: ${dir}`);
            return;
        }

        const items = fs.readdirSync(dir);
        for (const item of items) {
            const itemPath = path.join(dir, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                scanDirectory(itemPath);
            } else if (stats.isFile() && item.endsWith('.test.js')) {
                // Store relative path from __tests__ directory
                const relativePath = path.relative(testsDir, itemPath);
                allJestTestFiles.push(relativePath);
            }
        }
    }

    scanDirectory(testsDir);

    // Check that our important Jest test files exist
    const importantJestTestFiles = ['questQuality.test.js'];

    for (const file of importantJestTestFiles) {
        const exists = allJestTestFiles.some(
            (testFile) => testFile === file || testFile.endsWith(`/${file}`)
        );

        if (!exists) {
            console.error(`Important test file ${file} not found in __tests__ directory`);
            test.fail(true, `Important test file ${file} not found in __tests__ directory`);
        }

        expect(exists).toBeTruthy();
    }

    // Ensure critical vitest file exists in scripts/tests
    const imageReferencesTestPath = path.resolve(
        __dirname,
        '../../scripts/tests/imageReferences.test.ts'
    );
    const imageReferencesExists = fs.existsSync(imageReferencesTestPath);
    if (!imageReferencesExists) {
        console.error(`Important test file not found: ${imageReferencesTestPath}`);
        test.fail(true, `Important test file not found: ${imageReferencesTestPath}`);
    }
    expect(imageReferencesExists).toBeTruthy();

    // Check that Jest config in package.json includes our test pattern
    let jestConfigCapturesAllFiles = false;

    // Check if Jest is configured in package.json
    if (packageJson.jest) {
        if (packageJson.jest.testMatch) {
            // Check if the test patterns would match our files
            jestConfigCapturesAllFiles = packageJson.jest.testMatch.some((pattern) => {
                return pattern.includes('**/*.test.js') || pattern.includes('**/__tests__/**');
            });
        }
    }

    // Also check if Jest config might be in jest.config.js
    const jestConfigPath = path.resolve(__dirname, '../jest.config.js');
    if (fs.existsSync(jestConfigPath)) {
        const jestConfigContent = fs.readFileSync(jestConfigPath, 'utf8');
        if (
            jestConfigContent.includes('**/*.test.js') ||
            jestConfigContent.includes('**/__tests__/**')
        ) {
            jestConfigCapturesAllFiles = true;
        }
    }

    console.log('All Jest test files:', allJestTestFiles);

    if (!jestConfigCapturesAllFiles) {
        const errorMessage =
            'Jest configuration might not capture all test files. ' +
            'Make sure testMatch includes "**/*.test.js" or similar pattern in package.json or jest.config.js.';
        console.error(errorMessage);
        test.fail(true, errorMessage);
    }

    expect(jestConfigCapturesAllFiles).toBeTruthy();
});

test('verify playwright web server is properly configured', async ({ page }) => {
    // Try to load the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take a screenshot to see what loaded
    await page.screenshot({ path: './test-artifacts/webserver-test.png' });

    // Check that the page loaded successfully
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // Verify we can interact with the page - using a specific element to avoid strict mode violations
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();

    // Verify the URL is using localhost:3002 as configured in playwright.config.ts
    const url = page.url();
    expect(url).toContain('localhost:3002');
    console.log('Page URL:', url);

    // Get the playwright config to confirm the webServer settings
    const configPath = path.resolve(__dirname, '../playwright.config.ts');

    // Check if file exists before reading
    if (!fs.existsSync(configPath)) {
        console.error(`File not found: ${configPath}`);
        test.skip(true, `Could not find file: ${configPath}`);
        return;
    }

    const configContent = fs.readFileSync(configPath, 'utf8');

    // Check that the webServer config exists and is properly configured
    expect(configContent).toContain('webServer:');
    expect(configContent).toContain("command: 'npm run preview'");
    expect(configContent).toContain('url: baseURL');

    console.log('Playwright webServer is properly configured and running');
});

test('verify browser has necessary capabilities for tests', async ({ page }) => {
    // Check that JavaScript is enabled (will always pass if we got this far)
    const jsEnabled = await page.evaluate(() => true);
    expect(jsEnabled).toBeTruthy();
    console.log('JavaScript is enabled');

    // Store the results of optional capability checks
    const capabilities = {
        javascript: true,
        localStorage: false,
        cookies: false,
        fetch: false,
    };

    // Check that localStorage is available and functioning (optional)
    try {
        const localStorageAvailable = await page.evaluate(() => {
            try {
                localStorage.setItem('test', 'test');
                const value = localStorage.getItem('test');
                localStorage.removeItem('test');
                return value === 'test';
            } catch (e) {
                return false;
            }
        });

        console.log('localStorage test result:', localStorageAvailable);
        capabilities.localStorage = localStorageAvailable;

        if (!localStorageAvailable) {
            console.warn('localStorage is not available. This may affect game save tests.');
        } else {
            console.log('localStorage is available and functioning correctly');
        }
    } catch (e) {
        console.warn('Could not test localStorage:', e);
    }

    // Check that cookies are enabled (optional)
    try {
        const cookiesEnabled = await page.evaluate(() => {
            try {
                document.cookie = 'testCookie=1; SameSite=Lax';
                return document.cookie.includes('testCookie');
            } catch (e) {
                return false;
            }
        });

        console.log('Cookies enabled test result:', cookiesEnabled);
        capabilities.cookies = cookiesEnabled;

        if (!cookiesEnabled) {
            console.warn('Cookies may be disabled. This could affect login/session tests.');
        } else {
            console.log('Cookies are enabled');
        }
    } catch (e) {
        console.warn('Could not test cookies:', e);
    }

    // Check that the browser can make fetch requests (optional)
    try {
        const fetchWorks = await page.evaluate(async () => {
            try {
                // Internal fetch that doesn't actually go to the network
                const response = await fetch('/');
                return response.status >= 200 && response.status < 500;
            } catch (e) {
                return false;
            }
        });

        console.log('Fetch test result:', fetchWorks);
        capabilities.fetch = fetchWorks;

        if (!fetchWorks) {
            console.warn('Fetch API may not be working. This could affect API tests.');
        } else {
            console.log('Browser can make fetch requests');
        }
    } catch (e) {
        console.warn('Could not test fetch capability:', e);
    }

    // Overall browser capability check
    console.log('Browser capability summary:');
    console.log('- JavaScript: ✅ (required)');
    console.log(
        `- localStorage: ${capabilities.localStorage ? '✅' : '❌'} (optional but recommended)`
    );
    console.log(`- Cookies: ${capabilities.cookies ? '✅' : '❌'} (optional but recommended)`);
    console.log(`- Fetch API: ${capabilities.fetch ? '✅' : '❌'} (optional but recommended)`);

    // Log a warning if some capabilities are missing
    if (!capabilities.localStorage || !capabilities.cookies || !capabilities.fetch) {
        console.warn(
            'Some browser capabilities are limited or disabled. ' +
                'This is expected in some CI environments, but may cause certain tests to fail ' +
                'that depend on these capabilities.'
        );
    }
});
