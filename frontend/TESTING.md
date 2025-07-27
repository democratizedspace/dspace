# DSPACE Testing Guide

This document provides comprehensive information about DSPACE's testing infrastructure, how to run tests, and best practices for writing new tests.

## Testing Architecture

DSPACE uses a multi-layered testing approach:

1. **Unit Tests** (Jest) - For testing individual components and utilities
2. **End-to-End Tests** (Playwright) - For testing full user workflows and functionality
3. **Test Coverage Validation** - To ensure all tests are properly included in the CI workflow

## Running Tests

### Full Test Suite

To run the complete test suite:

```bash
# From the project root
SKIP_E2E=1 npm run test:pr  # omit SKIP_E2E=1 for full suite

# Or from the frontend directory
npm run test:all
```

### Preventing Playwright Artifact Errors

When running Playwright tests or developing with a recent test history, you might encounter ENOENT errors related to missing trace or network files. We've added tools to prevent these errors:

#### During Development

Use the enhanced dev script that automatically handles missing Playwright artifacts:

```bash
# Start the dev server with artifact error prevention
npm run dev:safe
```

This runs both the development server and a file watcher that creates any missing trace/network files that would otherwise cause errors.

#### Before Running Tests

All test commands automatically run the `setup-test-env` script, which ensures that all required directories and placeholder files exist. You don't need to run this manually.

If you still encounter artifact errors, you can run the fix directly:

```bash
npm run fix-artifacts
```

### Unit Tests Only

```bash
npm test
```

### End-to-End Tests Only

```bash
# Run all E2E tests in optimized groups
npm run test:e2e:groups

# Run a specific test file
npx playwright test e2e/custom-content.spec.ts

# The `constellations-quest.spec.ts` file demonstrates creating a full quest
# in the UI and validating it. Run it directly with:
npx playwright test e2e/constellations-quest.spec.ts

# Run tests with a specific tag or pattern
npx playwright test -g "create a custom item"
```

## Automated Server Management

**Important:** Playwright automatically starts and stops the development server for E2E tests. You should **not** manually start a server when running tests.

### How the Automated Server Works

The automated server is configured in `playwright.config.ts`:

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3002',
  reuseExistingServer: !process.env.CI,
  stdout: 'ignore',
  stderr: 'pipe',
}
```

This configuration:

1. Starts a server using `npm run dev` before tests begin
2. Waits for the server to be available at `http://localhost:3002`
3. Runs tests against this server
4. Shuts down the server when tests finish

### Common Server-Related Issues

1. **Port Conflicts**: If you manually start a server on port 3002 and then run tests, you may see errors as Playwright tries to start another server on the same port
2. **Server Not Started**: If the server fails to start or doesn't respond at the expected URL, tests will fail with connection errors
3. **Trace Collection Errors**: You may see errors about missing trace files in the console output - these are typically harmless and related to how Playwright collects debugging information

## Test Coverage Validation

We have automated checks to ensure no test files are orphaned from the test workflow:

1. The `test-coverage.spec.ts` file verifies:
    - All E2E tests are included in our test groups
    - Important Jest test files are properly configured
    - Your browser environment supports the capabilities needed for testing

This test runs as part of the `test:pr` and `test:e2e:groups` commands.

## Writing New Tests

### Adding New Test Files

When creating new test files:

1. For E2E tests:

    - Place `.spec.ts` files in the `frontend/e2e/` directory
    - Add them to a test group in `frontend/scripts/run-test-groups.mjs`

2. For Jest tests:
    - Place `.test.js` files in the `frontend/__tests__/` directory
    - Ensure they match the patterns in Jest's `testMatch` configuration

### Best Practices for Tests

1. **Make Tests Skip Gracefully**: Use conditional skipping when features may not be available

    ```typescript
    if (!(await page.locator('#feature-element').count())) {
        test.skip(true, 'Feature not available in this environment');
    }
    ```

2. **Use Proper Waiting**: Always wait for network idle or specific elements to be visible

    ```typescript
    await page.waitForLoadState('networkidle');
    await page.locator('.element').waitFor({ state: 'visible' });
    ```

3. **Handle Both Client and Server Rendering**: Account for hydration in tests
    ```typescript
    // Wait for hydration to complete
    await page.locator('[data-hydrated="true"]').first().waitFor();
    ```

## Debugging Test Failures

When tests fail, several options are available for debugging:

1. **View Test Report**:

    ```bash
    npx playwright show-report test-results/html-report
    ```

2. **View Browser Traces**:

    ```bash
    npx playwright show-report test-results/html-report --tracing
    ```

3. **Run Tests in UI Mode**:

    ```bash
    npm run test:e2e:ui
    ```

4. **Run Tests in Debug Mode**:
    ```bash
    PWDEBUG=1 npx playwright test e2e/my-failing-test.spec.ts
    ```

## Continuous Integration

In CI environments, tests run with special settings:

-   No server reuse (`reuseExistingServer: false`)
-   Headless browsers
-   Parallel execution based on available CPU cores

The `test:pr` command simulates this environment locally before you submit a PR.

## Test Structure

### Unit Tests

-   Unit test files are located in `__tests__/` directory
-   Name your tests with `.test.js` extension
-   Use Jest's `describe` and `it` syntax for clear organization

Example:

```javascript
describe('ItemForm Component', () => {
    it('should render the form correctly', () => {
        // Test code here
    });
});
```

### Content Quality Tests

We have specialized tests to ensure content quality:

1. **Quest Quality Tests** (`questQuality.test.js`):

    - Validates NPC dialogue style consistency
    - Checks for ethical considerations in aquarium quests
    - Verifies proper quest progression and dependencies. Failures now occur if any quest chain issues are detected.
    - Identifies dialogue that doesn't match NPC personalities
    - Uses simple heuristics for now; integration with the OpenAI API is planned

2. **Image Reference Tests** (`imageReferences.test.js`):
    - Scans all quest JSON files for image references
    - Verifies that referenced images exist in the public directory
    - Checks for proper image naming conventions
    - Suggests similar images when references are broken
3. **Quest Canonical Tests** (`questCanonical.test.js`):
    - Ensures each quest includes a start node
    - Requires at least one intermediate step and a finish option
    - Helps keep quest dialogue consistent across repos
4. **Item Quality Tests** (`itemQuality.test.js`):
    - Verifies item names, descriptions, and images
    - Checks price formatting and flags unrealistic values
5. **Process Quality Tests** (`processQuality.test.js`):
    - Validates duration strings and item references
    - Warns when processes lack items or have extreme durations
6. **Quest Dependency Tests** (`questDependencies.test.js`):
    - Ensures quest chains reference existing quests
    - Detects circular dependencies that could block progress

These tests are designed to produce warnings rather than failures, allowing for ongoing development while still identifying quality issues to address.

To run these tests specifically:

```bash
npm test -- questQuality
npm test -- itemQuality
npm test -- processQuality
npm test -- imageReferences
npm test -- questCanonical
npm test -- questDependencies
```

### Performance Benchmarks

To gauge the speed of IndexedDB operations, run:

```bash
npm run benchmark:db
```

This script adds and reads a batch of sample records and prints timing metrics so you can track performance regressions.

### End-to-End Tests

-   E2E test files are in the `e2e/` directory
-   Name your tests with `.spec.ts` extension
-   Use Playwright's `test.describe` and `test` syntax

Example:

```typescript
test.describe('Profile Page Functionality', () => {
    test('profile page should load with user information', async ({ page }) => {
        // Test code here
    });
});
```

## Best Practices for Playwright Tests

### 1. Use Proper Waiting Mechanisms

Always wait for the page to load properly:

```typescript
// Recommended way
await page.goto('/profile');
await page.waitForLoadState('networkidle');

// Avoid using waitForHydration as it may be less reliable
```

### 2. Handle Element Selectors Safely

Playwright runs in strict mode, so follow these practices:

```typescript
// Use first() for selectors that might match multiple elements
const button = page.locator('button').filter({ hasText: 'Save' }).first();

// Check element count before interacting
if ((await button.count()) > 0) {
    await button.click();
}

// Use filter() with regular expressions for text matching
page.locator('button').filter({ hasText: /save/i });

// Avoid using text= prefix in selectors (deprecated)
```

### 3. Conditional Test Execution

Handle scenarios where elements may not be present:

```typescript
// Check if feature exists before testing it
const featureElement = page.locator('.feature-container').first();
if ((await featureElement.count()) > 0) {
    // Run test for this feature
} else {
    // Skip test properly
    test.skip();
    console.log('Feature not available, skipping test');
}
```

### 4. Robust Selector Strategies

Use multiple strategies to find elements:

```typescript
// Chain selectors from parent to child
const menu = page.locator('nav').locator('.menu-item');

// Use multiple attributes/selectors for more reliability
const submitButton = page
    .locator('[type="submit"], button.submit, button:has-text("Submit")')
    .first();

// Use data-testid for stable selectors
const profile = page.locator('[data-testid="profile-section"]');
```

### 5. Clean Test Data

Always start with a clean environment:

```typescript
// Use beforeEach to reset state
test.beforeEach(async ({ page }) => {
    await clearUserData(page);
});
```

## Common Testing Errors and Solutions

### Strict Mode Violations

**Error:** "strict mode violation: locator('button') resolved to X elements"

**Solution:** Use `.first()` or more specific selectors:

```typescript
// Instead of
page.locator('button');

// Use
page.locator('button').first();
// or
page.locator('button#submit-form');
```

### Text Content Assertions

**Error:** "Error: expect(...).toContainText(/Text/)"

**Solution:** Ensure text is actually present and wait for elements to be loaded:

```typescript
await expect(page.locator('h1')).toContainText(/Welcome/);
```

### Timeouts

**Error:** "Timeout X ms exceeded"

**Solution:** Increase wait time or fix application slowness:

```typescript
// Increase timeout for slow operations
test.setTimeout(60000);

// Or use explicit waiting
await page.waitForTimeout(2000);
```

### Locator Not Found

**Error:** "locator.click: Target closed"

**Solution:** Ensure the page is fully loaded:

```typescript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // Sometimes needed for dynamic content
```

## Adding New Tests to Test Groups

When adding new E2E tests, update the test groups configuration in `scripts/run-test-groups.mjs`:

```javascript
// Example: Adding a new test to Structure Tests group
const TEST_GROUPS = [
    {
        name: 'Structure Tests',
        files: ['page-structure.spec.ts', 'error-pages.spec.ts', 'your-new-test.spec.ts'],
        workers: MAX_WORKERS,
        retries: 1,
    },
    // Other test groups...
];
```

## Testing Hydrated Svelte Components

Since DSpace uses Astro SSR with hydrated Svelte components:

1. Always wait for component hydration
2. Understand that interactivity only works after hydration
3. Use `page.waitForLoadState('networkidle')` to ensure components are ready

## Test Artifacts

Tests generate artifacts for debugging:

-   **Screenshots**: In `test-artifacts/` directory
-   **Videos**: In `test-videos/` directory
-   **Traces**: In `.playwright-artifacts/traces/` directory

These should be ignored in version control but preserved locally for debugging.

## Further Resources

-   [Playwright Documentation](https://playwright.dev/docs/intro)
-   [Jest Documentation](https://jestjs.io/docs/getting-started)
-   [Svelte Testing Library](https://testing-library.com/docs/svelte-testing-library/intro/)

## Developer Insights

These insights were gathered from real debugging scenarios and represent common "aha moments" when working with the DSpace testing suite.

### Environment Limitations and Browser Capabilities

Tests might fail due to browser environment limitations, particularly:

-   **localStorage restrictions**: Affects game save tests
-   **Cookie restrictions**: Affects session management tests
-   **Fetch API limitations**: Affects API call tests

Our test-coverage.spec.ts handles these issues by:

1. Checking which capabilities are available
2. Warning about missing capabilities
3. Continuing tests with appropriate expectations

```typescript
// Example of capability checking pattern
try {
    await page.evaluate(() => window.localStorage.setItem('test', 'test'));
    // localStorage is available
} catch (e) {
    console.warn('localStorage is not available. Game save tests may fail.');
}
```

### Handling Strict Mode Violations

Playwright's strict mode will fail tests if selectors match multiple elements. Common patterns to avoid this:

```typescript
// BAD: Might match multiple buttons
await page.locator('button').click();

// GOOD: Use first() to explicitly handle multiple matches
await page.locator('button').first().click();

// BETTER: Use filtering to get exactly what you want
await page.locator('button').filter({ hasText: 'Submit' }).first().click();

// BEST: Check visibility first to avoid clicking hidden elements
const button = page.locator('button').filter({ hasText: 'Submit' }).first();
await expect(button).toBeVisible();
await button.click();
```

### ES Modules and CommonJS Warnings

Tests might show warnings about ES Modules being loaded by CommonJS. These are generally safe to ignore:

```
ExperimentalWarning: CommonJS module is loading ES Module using require()
```

However, if you see actual errors related to modules, you may need to update your import statements.

### Orphaned Tests Detection

The `test-coverage.spec.ts` test verifies that no tests are orphaned from the test groups. If you add a new test file:

1. Make sure it's included in one of the test groups in `scripts/run-test-groups.mjs`
2. Run the orphaned test check to verify: `npx playwright test e2e/test-coverage.spec.ts`

### Making Tests Environment-Resilient

To write tests that work across different environments (local, CI, etc.):

1. **Use try/catch for optional capabilities**:

```typescript
let hasLocalStorage = false;
try {
    await page.evaluate(() => window.localStorage.setItem('test', 'test'));
    hasLocalStorage = true;
} catch (e) {
    console.log('localStorage test failed:', e.message);
}

// Only run localStorage-dependent tests if available
if (hasLocalStorage) {
    // Test localStorage functionality
}
```

2. **Check for features before testing them**:

```typescript
const chatButton = page.locator('[data-testid="chat-button"]').first();
if ((await chatButton.count()) > 0) {
    await chatButton.click();
    // Test chat functionality
} else {
    console.log('Chat button not found, skipping chat tests');
    test.skip();
}
```

### Development Server Requirements

Remember that E2E tests require a running development server:

-   Server must be running on port 3002 (`npm run dev`)
-   Run your server in a separate terminal before starting tests
-   If tests show connection errors, check that your server is running

## Troubleshooting

If you encounter persistent issues, try:

1. Clearing the test cache: `npx playwright clear-cache`
2. Reinstalling browsers: `npx playwright install chromium`
3. Restarting the dev server
4. Checking the logs in the test artifacts directories

## Known Test Failures

### Game Systems Tests

The "Game Systems" test group currently has some known failures:

1. **Chat System Tests**: Tests fail when the chat interface cannot be found. This may occur if:

    - The chat feature is under active development
    - The selectors have changed since the tests were written
    - The chat components aren't properly hydrating

2. **Game Save System Tests**: Failures occur when:
    - The game save interface doesn't load properly
    - Local storage isn't being properly populated

### Handling Test Failures in Pull Requests

When encountering test failures in the Game Systems group, follow these steps:

1. **First, verify your changes**: Make sure your changes haven't broken the tests
2. **Check the test artifacts**: Examine screenshots and videos in the `test-videos/` directory
3. **Open a discussion**: If the failures appear to be in unchanged code, mention this in your PR
4. **Consider skipping problematic tests**: In extreme cases, you may need to add `.skip()` to failing tests with a comment explaining why

```javascript
// Example of temporarily skipping a problematic test
test.skip('should open the chat interface', async ({ page }) => {
    // Test code
    // FIXME: Skipped due to chat interface redesign in progress - Issue #123
});
```

## Advanced Troubleshooting for Game Systems Tests

### Chat System Failures

If chat tests are failing with "element not found" errors:

1. Check if the chat interface has been redesigned
2. Update the locators to match the new structure:

```typescript
// Old selector
const chatInterface = page.locator('.chat-interface');

// More robust selector that may work with different designs
const chatInterface = page
    .locator('[data-testid="chat"], .chat-interface, .chat-window, .message-container')
    .first();
```

### Game Save System Failures

For game save test failures:

1. Ensure localStorage is working in the test environment
2. Try adding a pause before checking localStorage:

```typescript
// Add a pause to allow localStorage updates
await page.waitForTimeout(1000);
```

3. Verify the localStorage keys being used in tests match the actual application:

```typescript
// Check what keys are actually being used
const actualKeys = await page.evaluate(() => Object.keys(localStorage));
console.log('Actual localStorage keys:', actualKeys);
```

Remember that maintaining tests is as important as writing them. As the application evolves, tests need to be updated to reflect changes in the UI and application behavior.

## Test Artifact Management

When running Playwright tests, particularly with tracing enabled, you may encounter file system errors like:

```
Error: ENOENT: no such file or directory, stat '.playwright-artifacts-*/traces/*.network'
```

These errors typically occur when:

1. Tests are terminated abruptly while writing trace/network files
2. Multiple test runs overlap and compete for the same file resources
3. Large trace files exceed system resource limits

### Preventing Test Artifact Issues

To prevent these issues:

1. **Clean up artifacts regularly**:

    ```bash
    # Before test runs, clean up old artifacts
    rm -rf test-videos/ .playwright-artifacts-*/ test-results/
    ```

2. **Configure trace retention selectively**:

    ```typescript
    // In playwright.config.ts, only retain traces for failing tests
    use: {
      trace: 'retain-on-failure',
      video: 'on-first-retry'
    }
    ```

3. **Run tests with lower concurrency** if you see file system errors:

    ```bash
    # Reduce worker count to minimize file system contention
    npx playwright test --workers=1
    ```

4. **Use separate output directories** for parallel test runs:
    ```typescript
    // In run-test-groups.mjs
    const outputDir = `test-results-group-${groupIndex}`;
    commands.push(`--output=${outputDir}`);
    ```

### Recovering From Artifact Errors

If you encounter ENOENT or file system errors during test runs:

1. Stop any running test processes
2. Clear all test artifacts and temporary files:
    ```bash
    rm -rf test-videos/ .playwright-artifacts-*/ test-results/
    ```
3. Restart the dev server and run tests with reduced concurrency
4. If problems persist, try running individual test files or smaller groups

Remember that test artifacts are valuable for debugging but can consume significant disk space. Consider regularly cleaning them up in CI environments.

## Test Types

DSPACE uses several types of tests to ensure quality:

### Unit Tests

Unit tests focus on testing individual components, functions, or modules in isolation. These tests are written using Jest and are located in the `__tests__` directory.

### Image Reference Tests

The `imageReferences.test.js` file performs comprehensive validation of all images referenced in quest files:

1. **Existence Verification**: Checks that all referenced images exist in the public directory
2. **Size Validation**: Warns if images exceed recommended file size limits (150KB)
3. **Dimension Checking**: Verifies that images conform to standardized dimensions (512x512px)
4. **Naming Convention Validation**: Ensures quest and NPC images follow proper naming patterns

To run just the image reference tests:

```bash
npm test -- imageReferences
```

If you encounter warnings about missing or incorrect images:

-   Check the image paths in your quest JSON files
-   Ensure all images are placed in the correct directory structure
-   Verify that images meet the size and dimension requirements

### End-to-End Tests

// ... rest of existing content ...
