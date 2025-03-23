# DSpace Testing Guide

This document provides comprehensive information about testing in the DSpace project.

## Testing Overview

The DSpace project uses a multi-layered testing approach:

1. **Unit Tests** with Jest
2. **End-to-End Tests** with Playwright
3. **Linting** with ESLint
4. **Formatting** with Prettier

## Setting Up for Testing

Ensure you have all dependencies installed:

```bash
npm install
```

## Running Tests

### Unit Tests

Unit tests use Jest and test components, utilities, and other isolated functionality:

```bash
# Run all unit tests
npm test

# Watch mode for unit tests
npm run test:watch

# Generate coverage report
npm run coverage
```

### End-to-End Tests

E2E tests use Playwright to test the application from a user's perspective:

```bash
# Start the development server (REQUIRED for E2E tests)
npm run dev

# In a separate terminal, run all E2E tests
npm run test:e2e

# Run E2E tests with UI visualization
npm run test:e2e:ui

# Run E2E tests with debug mode
npm run test:e2e:debug

# Run E2E tests in logical groups (recommended for CI)
npm run test:e2e:groups

# Run specific test groups
npm run test:e2e:structure
npm run test:e2e:quests
npm run test:e2e:process
npm run test:e2e:custom
npm run test:e2e:integration
```

> **Important:** E2E tests require a running development server on port 3002. If you see connection errors like `ERR_CONNECTION_REFUSED`, make sure you've started the dev server with `npm run dev` in a separate terminal.

### Running All Checks (Pre-PR)

Before submitting a PR, run the comprehensive validation:

```bash
# First, start the development server
npm run dev

# In a separate terminal, from project root, run
npm run test:pr
```

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

- **localStorage restrictions**: Affects game save tests
- **Cookie restrictions**: Affects session management tests
- **Fetch API limitations**: Affects API call tests

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
if (await chatButton.count() > 0) {
    await chatButton.click();
    // Test chat functionality
} else {
    console.log('Chat button not found, skipping chat tests');
    test.skip();
}
```

### Development Server Requirements

Remember that E2E tests require a running development server:

- Server must be running on port 3002 (`npm run dev`)
- Run your server in a separate terminal before starting tests
- If tests show connection errors, check that your server is running

## Troubleshooting

If you encounter persistent issues, try:

1. Clearing the test cache: `npx playwright clear-cache`
2. Reinstalling browsers: `npx playwright install`
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
