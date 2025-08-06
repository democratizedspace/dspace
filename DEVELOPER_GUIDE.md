# DSPACE Developer Guide

This guide provides comprehensive information for developers working on the DSPACE project, covering everything from setup to architecture, testing, and best practices.

## Table of Contents

1. [Introduction](#introduction)
2. [Project Setup](#project-setup)
3. [Architecture Overview](#architecture-overview)
4. [Development Workflow](#development-workflow)
5. [Testing Strategy](#testing-strategy)
6. [Code Standards](#code-standards)
7. [Component Development](#component-development)
8. [Game Systems](#game-systems)
9. [Performance Considerations](#performance-considerations)
10. [Debugging and Test Insights](#debugging-and-test-insights)
11. [Troubleshooting](#troubleshooting)

## Introduction

DSPACE is a free and open-source web-based space exploration idle game. The project uses a modern web development stack with Astro as the framework and Svelte for UI components. The game combines resource management, exploration, and community interaction.

## Project Setup

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/democratizedspace/dspace.git
cd dspace

# Install dependencies
npm install
cd frontend
npm install
```

### Development Environment

Start the development server:

```bash
# From root directory
npm run dev

# Or from frontend directory
cd frontend
npm run dev
```

The site will be available at `http://localhost:3002`.

## Architecture Overview

DSPACE uses Astro's Server-Side Rendering (SSR) with partial hydration of Svelte components on the client side.

### Key Architectural Components

1. **Astro Framework**: Handles routing, SSR, and overall application structure
2. **Svelte Components**: Provides interactive UI elements with minimal JS
3. **Game State Management**: Custom state management for game data
4. **Persistence Layer**: LocalStorage and IndexedDB for saving progress

### Hydration Pattern

Due to the SSR + client hydration architecture, components must follow a specific pattern:

For a concise overview and debugging tips, see [UI Lifecycle Overview](./frontend/src/pages/docs/md/ui-lifecycle.md).

```svelte
<script>
  import { onMount } from 'svelte';

  // Define state variables
  let isClientSide = false;

  // Use onMount to ensure client-side code only runs in browser
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

This pattern ensures:

- No hydration mismatches between server and client
- Tests can detect when components are ready for interaction
- Better user experience during initial load

## Development Workflow

### Branching Strategy

We follow a feature branch workflow:

1. Create a branch for your feature/fix: `git checkout -b feature/my-feature`
2. Make your changes and commit them
3. Push to your branch and create a PR
4. Ensure tests pass before requesting review

### Pull Request Process

1. Update documentation for any new features
2. Add or update tests as necessary
3. Ensure all tests pass with `npm test`
4. Get approval from at least one maintainer
5. Squash and merge into the main branch

## Testing Strategy

DSPACE employs a comprehensive testing strategy with multiple layers:

### Pre-PR Testing

Before submitting a pull request, run the comprehensive cross-platform test suite:

```bash
# From project root
npm test
```

This command:

- Works on both Windows and Unix-like systems
- Runs linting and formatting checks
- Executes all unit tests
- Runs end-to-end tests in optimized groups
- Provides detailed feedback on test failures

### Unit Tests

Unit tests focus on testing individual components and utilities in isolation:

```bash
# Run unit tests
npm test

# Generate coverage report
npm run coverage
```

### End-to-End Tests

E2E tests verify the application behaves correctly from a user's perspective:

```bash
# Start the development server manually only when invoking Playwright directly
npm run dev

# In a new terminal, run all E2E tests (takes longer)
npm run test:e2e

# Run optimized test groups (recommended for development)
npm run test:e2e:groups
```

> **Important:** When using `npm test` or `npm run test:e2e:groups`, the
> development server is started automatically. Start the server yourself only if
> you run Playwright commands directly.

### Test Categories

Specialized test commands for different areas:

```bash
# If running Playwright directly, start the dev server first
npm run dev

# In a new terminal, run specific test categories:
# Test custom content functionality
npm run test:e2e:custom

# Test quest functionality
npm run test:e2e:quests

# Test process functionality
npm run test:e2e:process

# Test page structure (fastest)
npm run test:e2e:structure

# Test integration features
npm run test:e2e:integration
```

To quickly populate your browser's IndexedDB with sample custom items, processes,
and quests, run:

```bash
npm run seed:custom
```

### Quick Testing During Development

For faster development cycles:

```bash
# Optional: start the dev server if you plan to run Playwright directly
npm run dev

# In a new terminal, run quick tests
npm run test:quick
```

This runs unit tests and a subset of critical E2E tests.

### Pre-Commit Hooks

The repository includes a pre-commit hook that automatically runs:

- Code formatting and linting checks
- Quick test suite (unit tests + critical E2E tests)

This ensures that committed code maintains quality standards.

### Writing Tests

When writing tests, keep in mind:

1. **Hydration Awareness**: Wait for components to be hydrated before testing interactions

   ```typescript
   await page.waitForSelector('[data-hydrated="true"]');
   ```

2. **Test Helpers**: Use helper functions for common operations:

   ```typescript
   import { waitForHydration } from './test-helpers';

   await waitForHydration(page, 'ProcessForm');
   ```

3. **Flaky Test Prevention**: Add appropriate waiting and retry logic

### Playwright Test Performance Optimization

The project uses a custom test runner for optimizing Playwright test execution. The optimizations include:

1. **Test Grouping**: Tests are organized into logical groups that run in a specific sequence:

   - Structure Tests: Basic page structure and navigation
   - Item Tests: Creation and management of items
   - Process Tests: Process creation and execution
   - Quest Tests: Quest-related functionality
   - Integration Tests: End-to-end workflows combining multiple features

2. **Parallel Execution**: Most test groups run in parallel with multiple workers:

   ```javascript
   // Example from run-test-groups.mjs
   const TEST_GROUPS = [
     {
       name: 'Structure Tests',
       files: ['page-structure.spec.ts'],
       parallel: true,
       workers: MAX_WORKERS, // Dynamically set based on CPU cores
     },
     // ...other groups
   ];
   ```

3. **Dynamic Worker Allocation**: The number of workers is determined based on the system's available CPU cores:

   ```javascript
   // Determine optimal number of workers based on CPU cores
   const CPU_CORES = os.cpus().length;
   const MAX_WORKERS = Math.max(2, Math.floor(CPU_CORES / 2));
   ```

4. **Execution Strategy**:

   - Fast, independent tests use maximum parallelism
   - Tests with potential interactions use controlled parallelism
   - Integration tests run sequentially to prevent state conflicts

5. **Performance Reporting**: Each test group reports its execution time, helping identify bottlenecks.

To run the optimized test suite:

```bash
npm run test:e2e:groups
```

For development purposes, you can run a faster subset of tests:

```bash
npm run test:e2e:fast
```

Each test group can also be run individually:

```bash
npm run test:e2e:structure  # Page structure tests only
npm run test:e2e:custom     # Custom content tests only
```

#### Troubleshooting Test Performance

If tests are running slowly or failing intermittently:

1. **Check system resources**: Ensure adequate RAM and CPU are available
2. **Reduce parallelism**: Edit the `MAX_WORKERS` value in `run-test-groups.mjs`
3. **Isolate failing tests**: Run specific test groups individually
4. **Visual debugging**: Use `npm run test:e2e:ui` to observe test execution
5. **Check for timeouts**: Look for slow operations that might need longer timeouts

## Code Standards

### Formatting and Linting

```bash
# Check formatting
npm run format:check

# Fix formatting issues
npm run format

# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### ES Modules Configuration

DSPACE uses ES Modules for the codebase, which has important implications for development and testing:

1. **Package.json Configuration**: The project includes `"type": "module"` in the package.json, which means:

   - All .js files are treated as ES modules by default
   - Import/export syntax is required instead of CommonJS require/module.exports
   - Node.js environment variables like `__dirname` and `__filename` are not available directly

2. **Working with ES Modules in Node.js Scripts**:

   ```javascript
   // Instead of:
   const path = require('path');
   const __dirname = process.cwd();

   // Use:
   import path from 'path';
   import { fileURLToPath } from 'url';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   ```

3. **Script Extensions**:

   - `.js` files are treated as ES modules
   - Use `.cjs` extension to force CommonJS mode
   - Use `.mjs` extension to explicitly mark as ES modules

4. **Testing Implications**:

   - Jest requires additional configuration to work with ES modules
   - Test scripts need to use import syntax instead of require
   - Use dynamic imports for conditional loading

5. **Configuration Files**:

   - Jest configuration files need to use ES module export syntax:

     ```javascript
     const config = {
       // Jest configuration
     };

     export default config;
     ```

   - Babel configuration should also use ES module syntax:

     ```javascript
     const config = {
       presets: [
         /* ... */
       ],
       plugins: [
         /* ... */
       ],
     };

     export default config;
     ```

6. **Compatibility Warnings**:
   - You may see warnings about ES modules loading in CommonJS contexts
   - These warnings are generally safe to ignore as long as tests pass
   - For full compatibility, Node.js v16+ is recommended

### Prettier and ESLint Integration

Our project uses both Prettier and ESLint to maintain code quality:

1. **Configuration Files**:

   - `.prettierrc.js` - Controls code formatting rules
   - `.eslintrc.json` - Controls linting rules and code quality checks

2. **Avoiding Conflicts**:

   - Prettier handles formatting concerns (indentation, quotes, etc.)
   - ESLint handles code quality concerns (unused variables, potential bugs)
   - The configurations are designed to work together without conflicts

3. **Fixing Issues**:

   ```bash
   # Fix only linting issues
   npm run lint:fix

   # Fix only formatting issues
   npm run format

   # Fix both (prefer this)
   npm run lint:fix && npm run format
   ```

4. **Pre-Commit Integration**:
   - Husky and lint-staged automatically check formatting and linting
   - Files with issues will be blocked from being committed until fixed
   - Run fix commands before committing if you encounter errors

### Resolving ESLint and Prettier Conflicts

If you encounter conflicts between ESLint and Prettier rules (common with indentation, quotes, spacing, etc.), follow these steps:

1. **Configuration Setup**:

   - Ensure `eslint-config-prettier` is installed in the project
   - Make sure `.eslintrc.json` includes `"prettier"` in the `extends` array to disable ESLint rules that conflict with Prettier
   - Remove any formatting-related rules from ESLint (quotes, semi, indent) as these are handled by Prettier

2. **Configuration Files**:

   - `.eslintrc.json` should have Prettier in the extends array and no formatting rules:
     ```json
     {
       "extends": [
         "eslint:recommended",
         "plugin:@typescript-eslint/recommended",
         "prettier"
       ],
       "rules": {
         // Only include code quality rules, not formatting rules
         "@typescript-eslint/no-explicit-any": "warn"
         // No quotes, semi, or indent rules here
       }
     }
     ```
   - `.prettierrc.json` controls all formatting:
     ```json
     {
       "singleQuote": true,
       "semi": true,
       "tabWidth": 4
     }
     ```

3. **Fixing Issues**:

   ```bash
   npm run format              # Let Prettier format the files first
   npm run lint:fix            # Then let ESLint fix remaining issues
   ```

4. **Best Practices**:
   - Check that `.prettierrc.json` settings align with your team's preferences
   - When in doubt, Prettier's formatting takes precedence for visual style
   - ESLint should focus only on code quality concerns

By properly separating formatting (Prettier) from code quality (ESLint), you'll avoid conflicts between these tools and ensure consistent code style across the project.

### Coding Style Guidelines

- Use TypeScript for type safety
- Follow Svelte conventions for component structure
- Document public functions and complex logic
- Use async/await for asynchronous operations
- Prefer functional programming patterns
- Keep components small and focused

## Component Development

For an overview of the server-to-client lifecycle and hydration guidelines,
see [UI Lifecycle Overview](./frontend/src/pages/docs/md/ui-lifecycle.md).

### Component Structure

Components should follow this organization:

```
ComponentName/
├── ComponentName.svelte   # Main component
├── ComponentName.test.js  # Component tests
└── utils/                 # Component-specific utilities
```

### State Management

For component state:

- Use local state with Svelte's reactive variables where possible
- Use stores for shared state across components
- Leverage the game state system for persistent game data
- During development you can quickly wipe progress by calling
  `resetGameState()` from `frontend/src/utils/gameState/common.js`.
- If something goes wrong, use `rollbackGameState()` to restore the last
  saved state. The helper `validateGameState()` runs on load to keep the
  structure intact.

#### Rollback Use Cases

Game state rollbacks provide a safety net during development and early
access testing. Automatic backups are written before each save so you
can undo the most recent change when things go sideways. Typical
scenarios include:

- **Buggy updates** that corrupt local saves
- **Failed imports** of custom content or manually edited game state
- **Early custom content** that doesn't pass validation yet

Invoking `rollbackGameState()` restores the previous snapshot,
preventing data loss while you debug the issue.

### Creating New Components

1. Follow the hydration pattern described above
2. Ensure responsive design for all screen sizes
3. Add appropriate tests
4. Document props and events

## Game Systems

DSPACE features several core game systems that work together to create the gameplay experience:

### Core Game Mechanics

#### Items

Items are the fundamental resources and objects in the game that players can acquire, use, and transform.

- **Built-in Items**: Pre-defined items that come with the game (metals, components, tools, etc.)
- **Custom Items**: User-created items that extend the game's item catalog
- **Item Properties**:
  - Name and description
  - Image/icon
  - Category
  - Value
  - Tags for filtering and sorting

All items are displayed in the inventory system (under the `/inventory` route) and can be integrated into processes and quests.

#### Processes

Processes represent manufacturing, transformation, or creation activities that convert input items into output items over time.

- **Built-in Processes**: Pre-defined manufacturing processes included with the game
- **Custom Processes**: User-created processes that extend the game's capabilities
- **Process Properties**:
  - Title and description
  - Duration (time to complete)
  - Required items (for the process to run)
  - Consumed items (items used up during the process)
  - Created items (items produced by the process)

Processes appear in the processes list and can be initiated from anywhere in the game that displays the process component.

#### Quests

Quests are missions or objectives that guide the player's progression through the game.

- **Built-in Quests**: Pre-defined storylines and objectives included with the game
- **Custom Quests**: User-created quests that extend the game's narrative
- **Quest Properties**:
  - Title and description
  - Objectives and steps
  - Dialogue and narrative elements
  - Rewards (items granted upon completion)
  - Requirements (items needed to start)
  - Optional process integration

Quests are displayed in the quests page (under the `/quests` route) and can link to processes and items.

### Custom Content Integration

A key feature of DSPACE is the ability for users to create custom content that integrates seamlessly with built-in content:

1. **Unified Display**: Custom and built-in content appear together in the same UI lists and are indistinguishable to players
2. **Cross-referencing**: Custom quests can require or reward custom items, custom processes can create custom items, etc.
3. **Filtering and Sorting**: All UI pages that display game elements support filtering and sorting of both built-in and custom content

The design of the application ensures that custom content has the same capabilities as built-in content, allowing players to extend the game in meaningful ways.

### Content Storage

- **Built-in Content**: Stored as JSON files in the repository under `frontend/src/pages/[content-type]/json/`
- **Custom Content**: Stored in the browser's IndexedDB database and managed through the customcontent.js utility
- **Archiving**: Move deprecated quests to `frontend/src/pages/quests/archive` instead of deleting them.

### UI Integration

All game elements are rendered through Svelte components that can handle both built-in and custom content:

- `/inventory` - Displays all items (built-in and custom)
- `/quests` - Displays all quests (built-in and custom)
- Process list - Displays all processes (built-in and custom)

These lists are sortable and filterable according to the specific capabilities of each page.

## Performance Considerations

### Optimization Tips

1. Minimize client-side JavaScript
2. Use partial hydration whenever possible
3. Lazy load components that aren't immediately visible
4. Optimize images and assets
5. Consider code splitting for larger features

### Measuring Performance

- Use Lighthouse for overall performance metrics
- Use the browser's Performance tab for detailed analysis
- Monitor bundle size with the build output

## Debugging and Test Insights

Through real-world testing and debugging sessions, we've gathered valuable insights that can help new developers avoid common pitfalls.

### Testing Environment Limitations

#### Browser Capabilities in Test Environments

Different test environments (local, CI, headless browsers) have different capabilities:

1. **Missing localStorage**:

   - Game save tests will fail if localStorage isn't available
   - Chat history tests may fail without persistence
   - Use detection patterns to gracefully handle missing capabilities

2. **Cookie Restrictions**:

   - Session management tests can fail in environments with cookie restrictions
   - Profile tests may be affected

3. **Network Limitations**:
   - API fetch tests may fail with certain network restrictions
   - Useful to mock network calls in sensitive tests

#### Resilient Test Patterns

Make your tests resilient against environment differences:

```typescript
// Example: Check if localStorage is available
let hasLocalStorage = false;
try {
  await page.evaluate(() => window.localStorage.setItem('test', 'test'));
  hasLocalStorage = true;
} catch (e) {
  console.log('localStorage not available in this environment');
}

// Only run localStorage-dependent tests if it's available
if (hasLocalStorage) {
  // Test localStorage functionality
} else {
  console.log('Skipping localStorage tests due to environment limitations');
}
```

### Server Dependencies

The E2E test suite requires a development server running on port 3002.
When using the provided test scripts this is handled automatically.
Start the server manually only if you execute Playwright directly.
Connection errors (`ERR_CONNECTION_REFUSED`) indicate a missing server.

```bash
# Optional: run server in one terminal when invoking Playwright directly
npm run dev

# Then run tests in another terminal
npm run test:e2e
```

### Orphaned Test Detection

Our `test-coverage.spec.ts` file ensures no tests are left out of the test workflow:

1. It scans all test files in the `e2e/` directory
2. It compares them to files referenced in the test groups configuration
3. It reports any orphaned tests that aren't included in test groups

When adding new test files:

1. Add the file to an appropriate test group in `scripts/run-test-groups.mjs`
2. Run `npx playwright test e2e/test-coverage.spec.ts` to verify no orphaned tests
3. Tests left out of groups won't run during CI and may cause undetected regressions

### Playwright Strict Mode

Playwright runs in strict mode, which has specific requirements:

1. **Multiple Element Matches**:

   - Using `page.locator('button').click()` will fail if multiple buttons exist
   - Always use `.first()` or more specific selectors

2. **Visibility Checks**:

   - Always check visibility before interaction
   - Use `await expect(element).toBeVisible()` before clicking

3. **Best Practice Pattern**:

```typescript
// Complete pattern for reliable element interaction
const button = page.locator('button').filter({ hasText: 'Submit' }).first();
await expect(button).toBeVisible();
await button.click();
```

### Test Artifacts for Debugging

When tests fail, valuable artifacts are created to help diagnose issues:

1. **Screenshots**: Captured at the point of failure in `test-videos/` directory
2. **Videos**: Full test run recordings in `test-videos/` directory
3. **Trace Files**: Detailed interaction logs viewable with `npx playwright show-trace [path]`

These artifacts are especially useful for diagnosing:

- Element visibility issues
- Timing problems
- Hydration failures
- Selector mismatches

### Common E2E Test Failures

Some tests may fail due to known limitations:

1. **Chat System Tests**: May fail if:

   - Chat interface elements can't be found
   - localStorage isn't available for message persistence
   - Network calls for chat API are restricted

2. **Game Save Tests**: May fail if:
   - localStorage isn't available in the test environment
   - IndexedDB access is restricted
   - Game save interface doesn't load properly

These failures are expected in certain environments and don't necessarily indicate code issues.

### ES Module Warnings

During testing, you may see warnings about ES Modules:

```
ExperimentalWarning: CommonJS module is loading ES Module using require()
```

These warnings are generally safe to ignore as long as the tests themselves pass. They're caused by the hybrid module system used in Node.js when loading ES modules from CommonJS contexts.

## Troubleshooting

### Common Issues

#### Hydration Mismatches

Symptoms: Console warnings about hydration mismatches, UI flickering
Solution: Ensure proper use of `isClientSide` flag and conditional rendering

#### Test Failures

Symptoms: E2E tests fail intermittently
Solution: Add appropriate waiting for hydration, increase timeouts for async operations

#### Build Errors

Symptoms: Failed builds, TypeScript errors
Solution: Check type definitions, resolve linting issues

### Debugging Tools

- Browser DevTools for runtime issues
- Playwright inspector for E2E test debugging
- Jest debug mode for unit test issues

## Additional Resources

- [Astro Documentation](https://docs.astro.build)
- [Svelte Documentation](https://svelte.dev/docs)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [DSPACE Discord](https://discord.gg/A3UAfYvnxM)

---

This guide is a living document that evolves with the project. If you find something missing or incorrect, please submit a PR to improve it.
