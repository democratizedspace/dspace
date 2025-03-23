# DSPACE Frontend

DSPACE is a free and open source web-based space exploration idle game where players can acquire resources, build cool things, and ultimately reach the cosmos. The game combines elements of resource management, exploration, and community interaction in an engaging virtual environment.

## Tech Stack

-   **Framework**: [Astro](https://astro.build/) with [Svelte](https://svelte.dev/) components
-   **Styling**: PostCSS with SCSS
-   **Testing**: Jest with Testing Library
-   **Documentation**: Markdown with Remarkable
-   **API Integration**: OpenAI
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

## Getting Started

### Prerequisites

-   Node.js 16.x or higher
-   npm 7.x or higher
-   Git

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

DSPACE has a robust testing strategy to ensure code quality. For a full explanation of our testing approach, see the [Developer Guide](../DEVELOPER_GUIDE.md#testing-strategy).

### Test Infrastructure

Our testing infrastructure consists of:

-   **Unit Tests** - Using Jest and Testing Library for component and utility testing
-   **End-to-End Tests** - Using Playwright for full application workflow testing
-   **Test Groups** - Optimized test execution through logical grouping and parallelization

The test files are organized as follows:

```
frontend/
├── __tests__/          # Unit tests with Jest
│   ├── components/     # Component tests
│   ├── gameState/      # Game state logic tests
│   └── utils/          # Utility function tests
├── e2e/               # End-to-end tests with Playwright
│   ├── custom-content.spec.ts    # Custom content creation tests
│   ├── page-structure.spec.ts    # Page structure validation
│   ├── process-creation.spec.ts  # Process creation workflows
│   ├── test-quest-chat.spec.ts   # Quest and chat functionality
│   └── tutorial-quest.spec.ts    # Tutorial quest completion
└── scripts/
    └── run-test-groups.mjs       # Test grouping and optimization script
```

### Running All Tests

To run the complete test suite (recommended before submitting a PR):

```bash
# Start the development server first (required for end-to-end tests)
npm run dev

# In a new terminal, run all tests
npm run test:all
```

> **Important:** End-to-end (E2E) tests require the development server to be running at http://localhost:3002. Always start the server with `npm run dev` before running any E2E tests.

### Quick Testing During Development

For faster development cycles:

```bash
# Start the development server first
npm run dev

# In a new terminal, run quick tests
npm run test:quick
```

### Individual Test Commands

```bash
# Only linting
npm run lint

# Only formatting check
npm run format:check

# Only unit tests
npm test

# End-to-end tests (requires dev server running)
# Run optimized test groups (recommended)
npm run test:e2e:groups

# Run specific test categories
npm run test:e2e:custom     # Custom content
npm run test:e2e:quests     # Quests
npm run test:e2e:process    # Processes
npm run test:e2e:structure  # Page structure
npm run test:e2e:integration # Integration tests

# Debug tests visually
npm run test:e2e:ui
```

### Performance Optimization

Our test suite is optimized for performance:

-   **Parallelization** - Tests run in parallel where possible using multiple CPU cores
-   **Logical Grouping** - Tests are grouped by functionality for efficient execution
-   **Dynamic Worker Allocation** - Worker count is automatically adjusted based on system capabilities
-   **Dependency Management** - Groups are ordered to respect dependencies between tests

For detailed information on test performance optimization, see the [Developer Guide](../DEVELOPER_GUIDE.md#playwright-test-performance-optimization).

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

## Contributing

Please see the [Contribution Guide](https://github.com/democratizedspace/dspace/blob/v2.1/CONTRIBUTORS.md) and our [Developer Guide](../DEVELOPER_GUIDE.md) for detailed information on contributing to DSPACE.

## Community

-   Join our [Discord](https://discord.gg/A3UAfYvnxM) for discussions
-   Visit [democratized.space](https://democratized.space) to play the game
-   Check out the [documentation](https://democratized.space/docs) for detailed guides

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
