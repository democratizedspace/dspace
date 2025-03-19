# Testing Guide for DSPACE

This document provides comprehensive information about the testing approaches used in the DSPACE project.

## Testing Approaches

DSPACE employs multiple testing layers to ensure code quality and functionality:

### 1. Unit Tests

Unit tests validate individual functions and components in isolation.

-   **Framework**: Jest
-   **Location**: `__tests__/` directory
-   **Run command**: `npm test`
-   **Coverage report**: `npm run coverage`

#### Component Testing

-   **Framework**: Testing Library for Svelte
-   **Purpose**: Test Svelte components in isolation
-   **Focus**: Component behavior and user interactions
-   **Run as**: Part of the unit test suite

### 2. End-to-End Tests

E2E tests validate complete user flows and application functionality.

-   **Framework**: Playwright
-   **Location**: `e2e/` directory
-   **Run command**: `npm run test:e2e`
-   **UI mode**: `npm run test:e2e:ui`
-   **Browsers**: Tests run in Chrome, Firefox, and Safari
-   **Reports**: Generates HTML reports, videos, and traces on failures

### 3. Linting and Formatting

Code quality checks ensure consistency and prevent common errors.

-   **ESLint**: Code quality checks (`npm run lint`)
-   **Prettier**: Code formatting (`npm run format:check`)
-   **Combined**: Run all checks with `npm run check`
-   **Auto-fix**: Fix ESLint issues with `npm run lint:fix`

#### ESLint Configuration for Svelte

The project uses `eslint-plugin-svelte3` instead of `svelte-eslint-parser` to avoid ESM/CommonJS compatibility issues. The configuration in `.eslintrc.json` uses the following structure:

```json
{
    "plugins": ["@typescript-eslint", "svelte3"],
    "overrides": [
        {
            "files": ["*.svelte"],
            "processor": "svelte3/svelte3"
        },
        {
            "files": ["*.ts"],
            "parserOptions": {
                "project": "./tsconfig.json"
            }
        }
    ],
    "settings": {
        "svelte3": {
            "ignore-warnings": false
        }
    }
}
```

This configuration:

-   Limits TypeScript project checking to `.ts` files only
-   Uses the Svelte3 processor for `.svelte` files
-   Avoids ESM module compatibility issues

### 4. Combined Testing

Run all tests at once to verify the entire application:

-   **All tests**: `npm run test:all`
-   **Verbose output**: `npm run test:all:verbose`

## Git Hooks

The project uses Husky to enforce code quality via Git hooks:

### Pre-commit Hook

The pre-commit hook automatically runs:

-   Linting checks (ESLint and Prettier)
-   Unit tests for changed files

This ensures that code must pass quality checks before being committed.

### Commit Message Hook

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

-   Start with a type: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, or `chore`
-   Optionally followed by a scope in parentheses
-   Then a colon, space, and description
-   Example: `feat: add new test runner` or `fix(auth): resolve login issue`

## Testing in Docker

For consistent testing across environments, you can use Docker:

-   **Run tests in Docker**: `npm run docker:test`
-   **Run all tests in Docker**: `npm run docker:test:all`
-   **Start app and run tests**: `npm run docker:start-test`

## Astro and Svelte: SSR Considerations

### ⚠️ Important: Server-Side Rendering Implications

DSPACE uses Astro with Svelte components, with Astro configured for server-side rendering (`output: 'server'` in `astro.config.mjs`). This architecture has significant implications for component development and testing:

1. **Components render twice**: Once on the server (Node.js environment) and once on the client (browser)
2. **No DOM in SSR**: Browser APIs like `document` and `window` are unavailable during server rendering
3. **Common error**: `TypeError: Cannot read properties of undefined (reading 'createElement')`
4. **Hydration mismatch**: Differences between server and client rendering can cause hydration errors

### Best Practices for SSR-compatible Components

When developing new Svelte components:

1. **Always use the `onMount` pattern**:

    ```svelte
    <script>
        import { onMount } from 'svelte';
        let mounted = false;
        onMount(() => {
            mounted = true;
        });
    </script>

    {#if mounted}
        <!-- DOM-dependent content -->
    {/if}
    ```

2. **Export handler methods** for better testability:

    ```svelte
    export function handleSubmit(event) {
      // Implementation
    }
    ```

3. **Avoid initialization that requires DOM**:

    ```svelte
    // ❌ Bad - will fail in SSR
    let element = document.createElement('div');

    // ✅ Good - wait for client-side execution
    let element;
    onMount(() => { element = document.createElement('div'); });
    ```

4. **Use defensive coding** with browser APIs:

    ```svelte
    const isClient = typeof window !== 'undefined';
    if (isClient) {
      // Browser-only code
    }
    ```

5. **Add client directives** in Astro files:

    ```astro
    ---
    import MyComponent from '../components/MyComponent.svelte';
    ---

    <!-- Use client:load for components that need immediate hydration -->
    <MyComponent client:load />

    <!-- Use client:idle for non-critical components -->
    <AnotherComponent client:idle />
    ```

### SSR-Compatible Testing

When testing components:

1. **Mock minimal components** rather than depending on real DOM:

    ```javascript
    const component = {
        prop1: 'value',
        handler: jest.fn(),
        $set: function (props) {
            Object.assign(this, props);
        },
    };
    ```

2. **Use conditional testing** to skip DOM-dependent tests in Node.js:

    ```javascript
    const testOrSkip = typeof document !== 'undefined' ? test : test.skip;
    testOrSkip('DOM-dependent test', () => {
        /* ... */
    });
    ```

3. **Test component behavior** instead of DOM interactions:

    ```javascript
    // Test state changes directly
    component.$set({ value: 'new value' });
    expect(component.value).toBe('new value');

    // Direct method calls instead of event simulation
    component.handleClick({ preventDefault: jest.fn() });
    ```

### Diagnosing SSR Issues

When you encounter issues:

1. **Check error messages** for DOM-related errors in Node.js context
2. **Verify onMount usage** in components with DOM operations
3. **Use browser console** to identify hydration mismatches
4. **Inspect Astro client directives** to ensure proper component hydration

### Real-world Example: Form Components

The `ItemForm` and `QuestForm` components in this project demonstrate the SSR-compatible pattern:

1. They use `onMount` to track when they're executing in the browser
2. They wrap DOM-dependent content in `{#if mounted}` blocks
3. Their tests focus on behavior rather than DOM rendering
4. They export handler methods for direct testing

By following these patterns, you'll avoid common SSR-related errors and ensure components work consistently across both server and client environments.

## Best Practices

-   Run all tests before submitting pull requests
-   Write tests for new features and bug fixes
-   Test both success and error scenarios
-   Keep tests focused and maintainable
-   Use meaningful test descriptions
-   Maintain good test coverage (aim for >80%)
-   Isolate external dependencies with mocks

## Troubleshooting

### Common Issues

1. **DOM-related errors in Jest tests**:

    - These are expected when testing Svelte components in Node.js
    - Focus on functional assertions rather than DOM rendering in unit tests

2. **ESLint configuration errors**:

    - If you encounter ESM-related errors with svelte parsers, use `eslint-plugin-svelte3` instead of `svelte-eslint-parser`
    - The project is configured to use the CommonJS-compatible `eslint-plugin-svelte3`
    - TypeScript project settings are only applied to `.ts` files, not all JavaScript files

3. **Pre-commit hooks not running**:
    - Run `npx husky install` to reinstall hooks
    - Check permissions on hook files

For more help, reach out on the [Discord](https://discord.gg/A3UAfYvnxM).
