# DSPACE - Democratized Space

You can find the game at [democratized.space](https://democratized.space).

Check out the [docs](https://democratized.space/docs)!

## Local Development

Clone and set up the project:

```bash
git clone https://github.com/democratizedspace/dspace.git
cd dspace
npm install
```

Start the development server:

```bash
npm run dev
```

## Testing

DSPACE uses a comprehensive testing suite to ensure code quality and prevent regressions.

### Pre-PR Testing

Before submitting a pull request, run the comprehensive test suite with:

```bash
npm run test:pr
```

This cross-platform script will:
- Check code formatting and linting
- Run all unit tests
- Run all end-to-end tests in optimized groups
- Provide helpful error messages if any tests fail

### Running All Tests

To run the full test suite manually:

```bash
# Start the development server first (required for end-to-end tests)
npm run dev

# In a new terminal, run all tests
npm run test:all
```

This command runs:
- Linting and formatting checks
- Unit tests
- End-to-end tests (in optimized groups)

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

# Only end-to-end tests (with optimized grouping)
# Note: Development server must be running!
npm run test:e2e:groups
```

> **Important:** End-to-end (E2E) tests require the development server to be running at http://localhost:3002. Always start the server with `npm run dev` before running any E2E tests.

For more details on our testing strategy, see the [Developer Guide](./DEVELOPER_GUIDE.md).

## Code Quality

Check code quality before committing:

```bash
npm run check
```

## Project Architecture

DSPACE uses a modern JavaScript architecture:

- **ES Modules**: Native JavaScript modules with import/export syntax
- **Astro SSR**: Server-side rendering with hydration of Svelte components
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Continuous Testing**: Unit and e2e tests ensure consistent quality

For detailed information on the architecture, see our [Developer Guide](./DEVELOPER_GUIDE.md).

## Developer Guide

For comprehensive information about developing DSPACE, see our [Developer Guide](./DEVELOPER_GUIDE.md). This guide includes:

- Detailed architecture overview
- Component development guidelines
- Testing strategies
- Performance considerations
- Troubleshooting tips

## Want to contribute?

Check out the [Contribution Guide](https://github.com/democratizedspace/dspace/blob/v2.1/CONTRIBUTORS.md) to get started.

If you have any questions, feel free to join the [Discord](https://discord.gg/A3UAfYvnxM) and say hello!