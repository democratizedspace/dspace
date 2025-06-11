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
# Standard development server
npm run dev

# Development server with Playwright artifact error prevention
cd frontend && npm run dev:safe
```

The `dev:safe` command prevents common Playwright artifact errors that can occur after running tests.

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

The `test:pr` command handles everything automatically, including starting and stopping the development server for end-to-end tests.

### Testing Information

For detailed information about our testing approach, please refer to:

- [Testing Guide](./frontend/TESTING.md) - Comprehensive documentation on testing practices, common issues, and debugging techniques
- [Developer Guide](./DEVELOPER_GUIDE.md#testing-strategy) - Higher-level overview of our testing strategy and approach

For common test commands, see the section below.

### Individual Test Commands

```bash
# Only linting
npm run lint

# Only formatting check
npm run format:check

# Only unit tests
npm test

# Only end-to-end tests (with optimized grouping)
# Note: Server starts automatically!
npm run test:e2e:groups
```

> **Important:** End-to-end (E2E) tests use Playwright, which automatically starts and stops the development server when needed. You should not manually start a server when running these tests, as this could lead to port conflicts or unexpected behavior.

## Code Quality

Check code quality before committing:

```bash
npm run check
```
## Docker Deployment

Run the game in Docker (works on Raspberry Pi) using:
```bash
docker compose up --build -d
```
The app will be available on port 3002. Point your Cloudflare Tunnel at `http://localhost:3002` to serve traffic.


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