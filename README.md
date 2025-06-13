# DSPACE - Democratized Space

![CI](https://github.com/democratizedspace/dspace/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-unknown-lightgrey)

You can find the game at [democratized.space](https://democratized.space).

Check out the [docs](https://democratized.space/docs)!

## Local Development

Clone and set up the project:

```bash
git clone https://github.com/democratizedspace/dspace.git
cd dspace
npm ci
# Install frontend dependencies
cd frontend && npm ci
cd ..
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
# Skip Playwright tests if browsers aren't installed
SKIP_E2E=1 npm run test:pr
```

If Playwright browsers are available, omit `SKIP_E2E=1` to run the full suite:

```bash
npm run test:pr
```

If you encounter an error like `browserType.launch: Executable doesn't exist`,
download the browsers with:

```bash
npx playwright install
```
If that command fails (for example, due to network restrictions), run the tests
with `SKIP_E2E=1` and mention the skipped browser install in your PR summary.

This cross-platform script will:

-   Check code formatting and linting
-   Run all unit tests
-   Run all end-to-end tests in optimized groups
-   Provide helpful error messages if any tests fail

The `test:pr` command handles everything automatically, including starting and stopping the development server for end-to-end tests.

### Testing Information

For detailed information about our testing approach, please refer to:

-   [Testing Guide](./frontend/TESTING.md) - Comprehensive documentation on testing practices, common issues, and debugging techniques
-   [Developer Guide](./DEVELOPER_GUIDE.md#testing-strategy) - Higher-level overview of our testing strategy and approach

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

Test groups are defined in `frontend/scripts/run-test-groups.mjs`. If you add or remove E2E specs, update this file so the grouped tests stay in sync.

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

### Automated Raspberry Pi Deployment

The workflow `.github/workflows/rpi-deploy.yml` builds an ARM64 Docker image and optionally deploys it to a Raspberry Pi over SSH.
Add registry credentials in `GHCR_TOKEN` (or another registry) and set `RPI_HOST`, `RPI_USER`, and `RPI_SSH_KEY` secrets.
Trigger the workflow manually or on pushes to `main` to update the Pi and restart the `app` service.

## Project Architecture

DSPACE uses a modern JavaScript architecture:

-   **ES Modules**: Native JavaScript modules with import/export syntax
-   **Astro SSR**: Server-side rendering with hydration of Svelte components
-   **Progressive Enhancement**: Core functionality works without JavaScript
-   **Continuous Testing**: Unit and e2e tests ensure consistent quality

For detailed information on the architecture, see our [Developer Guide](./DEVELOPER_GUIDE.md).

## Developer Guide

For comprehensive information about developing DSPACE, see our [Developer Guide](./DEVELOPER_GUIDE.md). This guide includes:

-   Detailed architecture overview
-   Component development guidelines
-   Testing strategies
-   Performance considerations
-   Troubleshooting tips

## Built-in Quests

Starter quest JSON files live in `frontend/src/pages/quests/json`. They follow the schema
defined at `frontend/src/pages/quests/jsonSchemas/quest.json` and can reference NPC
profiles in `frontend/src/pages/docs/md/npcs.md`. The schema now supports advanced
fields such as `start`, `rewards` and item requirements, so older quests from
the v2 era remain valid. Keep the NPC file updated when adding new characters.
Quest files are organized by category in subfolders, so feel free to expand any
area—electronics, hydroponics, rocketry and more—with additional quests.

Aquarium quests progress through a gentle learning curve: first set up a Walstad tank, then add dwarf shrimp and guppies, practice breeding, and finally keep a goldfish in a large tank.
Electronics quests now begin with a simple LED circuit to teach basic wiring before moving on to sensors and automation.

To validate that quests use a canonical structure with clear start and finish
steps, run the dedicated test:

```bash
npm test -- questCanonical
```

Additional quality checks are available:

```bash
npm test -- questQuality        # heuristics for dialogue quality (TODO: integrate OpenAI)
npm test -- imageReferences     # verifies quest and NPC image files
```

## Built-in Items

Item definitions live in `frontend/src/pages/inventory/json/items.json`. Assign new sequential `id` numbers and include an image path when adding items. See `frontend/src/pages/docs/md/item-guidelines.md` for detailed guidance.

> **Tip:** We use the open-source LLM inference from
> [`token.place`](https://github.com/futuroptimist/token.place) when generating quest
> dialogue. Token.place itself doesn't host quests, but you can reuse the same
> prompts to create content across your projects.
> You can also leverage [`f2clipboard`](https://github.com/futuroptimist/f2clipboard)
> to copy quest templates or code snippets between repositories.

### AI-Assisted Quest Creation

For faster quest development, consult our [Quest Prompts](/docs/prompts-quests)
guide. It includes ready-made prompt templates for tools like GPT-4 or Claude to
help you generate dialogue and structure quickly. Combine these with the
[Quest Development Guidelines](/docs/quest-guidelines) to streamline content
creation.

### Staying Updated

We frequently merge improvements from the `v3` branch. Keep your fork current:

```bash
git fetch origin
git merge origin/v3
npm ci
(cd frontend && npm ci)
```

## Want to contribute?

Check out the [Contribution Guide](https://github.com/democratizedspace/dspace/blob/v2.1/CONTRIBUTORS.md) to get started.

If you have any questions, feel free to join the [Discord](https://discord.gg/A3UAfYvnxM) and say hello!

### Asset Guidelines

Avoid committing large binary files such as Photoshop documents. Convert images
to efficient formats (SVG, PNG, JPG) before adding them to the repository.

### Archiving Built-in Content

If a quest, item, or process needs to be retired, move its JSON file to the
`frontend/src/pages/quests/archive` directory instead of deleting it. The
`contentIntegrity` test tracks the total count of built-in assets, so archived
files help prevent accidental removals.
