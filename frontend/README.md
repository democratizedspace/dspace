# DSPACE Frontend

DSPACE is a free and open source web-based space exploration idle game where players can acquire resources, build cool things, and ultimately reach the cosmos. The game combines elements of resource management, exploration, and community interaction in an engaging virtual environment.

## Tech Stack

-   **Framework**: [Astro](https://astro.build/) with [Svelte](https://svelte.dev/) components
-   **Styling**: PostCSS with SCSS
-   **Testing**: Jest with Testing Library
-   **Documentation**: Markdown with Remarkable and Prism code highlighting (maps `text` to `plaintext`)
-   **API Integration**: token.place
-   **Code Quality**: ESLint, Prettier

> 📖 For comprehensive documentation, see our [Developer Guide](../DEVELOPER_GUIDE.md).

## Architecture Overview

DSPACE uses Astro's Server-Side Rendering (SSR) with partial hydration of Svelte components on the client side. This architecture provides:

1. **Fast initial page loads** via SSR
2. **Reduced JavaScript payload** through partial hydration
3. **Interactive UI elements** with Svelte components

### Hydration Pattern

When developing Svelte components for this architecture, follow these guidelines:

1. Always use `onMount` for initialization code that requires the browser environment
2. Add an `isClientSide` boolean flag to handle server/client differences
3. Conditionally render UI elements based on `isClientSide` to avoid hydration mismatches
4. Add a `data-hydrated="true"` attribute to components once fully hydrated for testing

Example:

```svelte
<script>
    import { onMount } from 'svelte';

    let isClientSide = false;
    let data = {};

    onMount(() => {
        isClientSide = true;
        // Initialize client-side state here
    });
</script>

<div data-hydrated={isClientSide ? 'true' : 'false'}>
    {#if isClientSide}
        <!-- Interactive client-side content -->
    {:else}
        <!-- Static server-rendered placeholder -->
    {/if}
</div>
```

### Module System

DSPACE uses ES Modules throughout the codebase:

1. **In the Browser**: Native ES modules with import/export syntax
2. **In Node.js**: ES modules enabled via `"type": "module"` in package.json
3. **For Testing**: Custom Jest configuration to support ES modules

When creating new files:

-   Use `.js` extension for standard ES module files
-   Use `.cjs` extension for CommonJS files (rare, mostly for config files)
-   Always use `import`/`export` syntax instead of `require`/`module.exports`

For Node.js scripts that need `__dirname` or `__filename`:

```javascript
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable Svelte components
│   ├── layouts/        # Layout templates
│   ├── pages/          # Page components and routes
│   │   ├── docs/       # Game documentation
│   │   ├── inventory/  # Player inventory system
│   │   ├── quests/     # Mission and quest system
│   │   └── shop/       # In-game marketplace
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   └── scripts/        # Build and utility scripts
├── tests/              # Test suites
├── e2e/                # End-to-end tests with Playwright
└── public/             # Static assets
```

> Utility note: `src/utils/strings.js`'s `getDurationString` now omits undefined
> remaining time to avoid displaying `undefined` in the UI.

> Utility note: `src/utils/strings.js`'s `getDuration` now falls back to
> `0.00%` for non-numeric input to prevent showing `NaN%`.

## Getting Started

### Prerequisites

-   Node.js 18.x or 20.x (LTS)
-   npm 7.x or higher
-   Git

The repo ships with a `.nvmrc` file targeting Node.js 20. Run `nvm use` to
align your local environment.

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/democratizedspace/dspace.git
cd dspace
```

2. Install dependencies:

```bash
npm install
cd frontend
npm install
```

3. Start the development server:

```bash
npm run dev
```

The site will be available at `http://localhost:3002`

## Testing

DSPACE has a robust testing strategy to ensure code quality. For comprehensive documentation on testing, see our dedicated [Testing Guide](./TESTING.md).

The [Developer Guide](../DEVELOPER_GUIDE.md#testing-strategy) also contains high-level information about our testing approach.

### Test Infrastructure

Our testing infrastructure consists of:

-   **Unit Tests** - Using Jest and Testing Library for component and utility testing
-   **End-to-End Tests** - Using Playwright for full application workflow testing
-   **Test Groups** - Optimized test execution through logical grouping and parallelization

Common commands for testing:

```bash
# Run all tests (Playwright will start/stop the server automatically)
npm run test:all

# Unit tests only
npm test

# End-to-end tests (Playwright handles the server)
npm run test:e2e:groups
```

> **Note:** For detailed information about writing tests, running individual test files, debugging test failures, and best practices, refer to our [Testing Guide](./TESTING.md).

## Common Testing Issues and Pitfalls

### Playwright Test Requirements

1. **Hydration and Network States**: Always use appropriate waiting mechanisms in tests:

    ```typescript
    // Use waitForLoadState instead of waitForHydration for more reliable tests
    await page.waitForLoadState('networkidle');
    ```

2. **Strict Mode Violations**: Playwright runs in strict mode, which means:

    - Selectors that match multiple elements will cause tests to fail
    - Always check element count before attempting operations
    - Use `.first()` when dealing with potentially multiple matches

    ```typescript
    // Good practice - check count before proceeding
    const button = page.locator('button').filter({ hasText: 'Save' }).first();
    if ((await button.count()) > 0) {
        await button.click();
    }
    ```

3. **Skipping Tests**: When a test should be skipped conditionally:

    ```typescript
    // Correct way to skip a test
    test.skip();
    console.log('Skipping test because...');
    ```

4. **Text Selectors**: Avoid using text= prefix in selectors. Instead:

    ```typescript
    // Preferred approach
    page.locator('button').filter({ hasText: /save/i });
    ```

5. **Test Artifacts**: Tests may generate artifacts in the `test-artifacts` and `test-videos` directories. These should be ignored in version control but preserved for debugging failed tests.

6. **Formatting Issues**: Always run `npm run format` before submitting PRs to prevent formatting-related test failures.

### Performance Optimization

Our test suite is optimized for performance through:

1. **Parallelization**: Tests are run in parallel based on available CPU cores
2. **Logical Grouping**: Related tests are grouped together to minimize setup/teardown overhead
3. **Dynamic Worker Allocation**: Different test groups use different numbers of workers based on their requirements
4. **Dependency Management**: Tests with interdependencies are grouped to ensure proper execution order

## Testing Insights and Tips

Based on real-world experience with the test suite, here are some valuable insights that will help you be more productive:

### 1. Browser Environment Awareness

When writing tests, be aware of potential browser environment limitations:

-   **localStorage and sessionStorage** may not be available in headless environments
-   **Cookies** might be restricted in test runners
-   **Network abilities** may vary between local and CI environments

Our test suite now includes capability detection to handle these variations (see `test-coverage.spec.ts`). You should make your tests resilient to these limitations:

```typescript
// Test if localStorage is available before relying on it
let hasLocalStorage = false;
try {
    await page.evaluate(() => window.localStorage.setItem('test', 'test'));
    hasLocalStorage = true;
} catch (e) {
    console.log('localStorage not available in this environment');
}

// Only test localStorage-dependent features if it's available
if (hasLocalStorage) {
    // Run tests that require localStorage
}
```

### 2. Server Dependency for E2E Tests

**IMPORTANT**: E2E tests require a running development server:

```bash
# Start the dev server BEFORE running any E2E tests
npm run dev

# Now you can run your tests
npm run test:e2e
```

If you see connection errors like `ERR_CONNECTION_REFUSED`, you forgot to start the dev server.

### 3. Test Group Management

Always check that your new test files are added to the test groups:

1. Edit `scripts/run-test-groups.mjs` to include your test file in an appropriate group
2. Run `npx playwright test e2e/test-coverage.spec.ts` to verify no orphaned tests
3. Test files not included in any group won't run during CI checks

### 4. Common Playwright Patterns

Use these patterns consistently to make tests more reliable:

```typescript
// 1. Always wait for page load
await page.goto('/route');
await page.waitForLoadState('networkidle');

// 2. Always use first() with locators
const button = page.locator('button').first();

// 3. Check visibility before interactions
await expect(element).toBeVisible();
await element.click();

// 4. Use conditional tests based on feature presence
if ((await featureElement.count()) > 0) {
    // Test the feature
} else {
    test.skip();
    console.log('Feature not present, skipping test');
}
```

### 5. Understanding Test Failures

When tests fail, check:

1. **Test logs**: Look for warnings about missing capabilities
2. **Test videos**: Review the generated videos in the `test-videos/` directory
3. **Trace files**: Use `npx playwright show-trace [path]` to see detailed test execution
4. **Screenshots**: Check the screenshots in test-videos directory

For more detailed guidelines, see [TESTING.md](./TESTING.md) for our comprehensive testing documentation.

## Development Guidelines

### Code Style

We follow strict code quality guidelines:

-   Use TypeScript for type safety
-   Follow the [Svelte best practices](https://svelte.dev/docs#template-syntax-each)
-   Maintain component-based architecture
-   Write tests for new features
-   Document complex logic and components

### Game Systems

The game features several core systems:

-   Virtual inventory management
-   Quest and mission progression
-   Resource production and management
-   Community interaction features
-   Achievement tracking

### Custom Content System

DSPACE supports user-created content:

1. **Custom Items** - Players can create their own resources and items
2. **Custom Processes** - Custom manufacturing and conversion processes
3. **Custom Quests** - User-defined missions and adventures

Custom content integrates seamlessly with built-in game content.

## Accessibility

-   Interactive form controls display visible focus outlines.
-   Remove buttons include descriptive `aria-label` attributes.

## Contributing

Please see the [Contribution Guide](../CONTRIBUTORS.md) and our [Developer Guide](../DEVELOPER_GUIDE.md) for detailed information on contributing to DSPACE.

## Community

-   Join our [Discord](https://discord.gg/A3UAfYvnxM) for discussions
-   Visit [democratized.space](https://democratized.space) to play the game
-   Check out the [documentation](https://democratized.space/docs) for detailed guides

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
