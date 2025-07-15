# DSPACE - Democratized Space

[![CI](https://github.com/democratizedspace/dspace/actions/workflows/ci.yml/badge.svg)](https://github.com/democratizedspace/dspace/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/democratizedspace/dspace/branch/v3/graph/badge.svg)](https://codecov.io/gh/democratizedspace/dspace)

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
npx playwright install chromium
```

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

# Collect Playwright coverage
npm run test:e2e:coverage

# Generate unit test coverage
npm run coverage
# View the HTML report at
frontend/coverage/lcov-report/index.html
```

> **Important:** End-to-end (E2E) tests use Playwright, which automatically starts and stops the development server when needed. You should not manually start a server when running these tests, as this could lead to port conflicts or unexpected behavior.

### Continuous Integration

GitHub Actions automatically run `npm run test:pr` on every pull request and push to `v3`.
If the `CODECOV_TOKEN` secret is configured, coverage reports upload to Codecov and update the badge at the top of this README.
You'll find the CI results under the **Checks** tab of your pull request.

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

The Dockerfile installs dependencies with `--ignore-scripts` so Husky and other
npm hooks don't run during the build.

The app will be available on port 3002. Point your Cloudflare Tunnel at `http://localhost:3002` to serve traffic.

For a full Raspberry Pi setup, including k3s instructions, see [docs/RPI_DEPLOYMENT_GUIDE.md](./docs/RPI_DEPLOYMENT_GUIDE.md).

### Automated Raspberry Pi Deployment

The workflow `.github/workflows/rpi-deploy.yml` builds an ARM64 Docker image and optionally deploys it to a Raspberry Pi over SSH.
Create a classic PAT with the [`write:packages` scope](https://github.com/settings/tokens/new?scopes=write:packages) (fine-grained tokens don’t work with Packages yet) and add it as the `GHCR_TOKEN` secret.
Set `RPI_HOST`, `RPI_USER`, and `RPI_SSH_KEY` to enable SSH deployment.
Trigger the workflow manually or on pushes to `v3` to update the Pi and restart the `app` service.

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
-   [UI Lifecycle Overview](./frontend/src/pages/docs/md/ui-lifecycle.md) for understanding Astro SSR and Svelte hydration
-   Testing strategies
-   Performance considerations
-   Troubleshooting tips

## Built-in Quests

Starter quest JSON files live in `frontend/src/pages/quests/json`. They follow the schema
defined at `frontend/src/pages/quests/jsonSchemas/quest.json` and can reference NPC
profiles in `frontend/src/pages/docs/md/npcs.md`. This file lists biography notes
and sample dialogue for each character to help keep their voice consistent. The
schema now supports advanced fields such as `start`, `rewards` and item requirements,
so older quests from the v2 era remain valid. Keep the NPC file updated when
adding new characters.
Quest files are organized by category in subfolders, so feel free to expand any
area—electronics, hydroponics, rocketry and more—with additional quests.
See [Quest Trees](/docs/quest-trees) for an overview of the different categories and their progression.
The repository includes a script that summarizes how many quests and lines of dialogue exist in each tree. Categories are sorted by quest count for readability.
Run `node scripts/generate-quest-chart.js` to recreate `quest-tree-stats.txt` and a PNG image saved locally. The PNG is ignored in Git, but CI artifacts attach the latest chart for reference.

![Quest tree stats chart](https://nightly.link/democratizedspace/dspace/workflows/quest-chart.yml/branch/v3/quest-tree-chart.zip?path=frontend%2Fsrc%2Fpages%2Fdocs%2Fimages%2Fquest-tree-stats.png)

Aquarium quests progress through a gentle learning curve: set up a Walstad tank, test the water, install a sponge filter, ask Atlas to position the tank, add dwarf shrimp, introduce guppies, perform regular water changes, practice breeding, and finally keep a goldfish in a large tank.
Electronics quests now begin with a simple LED circuit to teach basic wiring before moving on to sensors and automation.
The new DevOps chain explains how to deploy DSPACE on a small Raspberry Pi cluster using Docker and k3s.

To validate that quests use a canonical structure with clear start and finish
steps, run the dedicated test:

```bash
[Quest Development Guidelines](/docs/quest-guidelines), the [Quest Template Example](/docs/quest-template), and the [Quest Submission Guide](/docs/quest-submission) to streamline content creation and sharing.
```

Additional quality checks are available:

```bash
npm test -- questQuality        # heuristics for dialogue quality (TODO: integrate OpenAI)
npm test -- itemQuality         # validates items.json for realism and completeness
npm test -- processQuality      # validates processes.json for realistic durations
npm test -- imageReferences     # verifies quest and NPC image files
```

## Built-in Items

Item definitions live in `frontend/src/pages/inventory/json/items.json`. Assign new sequential `id` numbers and include an image path when adding items. See `frontend/src/pages/docs/md/item-guidelines.md` for detailed guidance.

## Built-in Processes

Process definitions are stored in `frontend/src/pages/processes/processes.json`.
Durations should mirror real-world expectations when possible. See
`frontend/src/pages/docs/md/process-guidelines.md` for more tips on designing
and balancing new processes.

> **Tip:** We use the open-source LLM inference from
> [`token.place`](https://github.com/futuroptimist/token.place) when generating quest
> dialogue. Token.place itself doesn't host quests, but you can reuse the same
> prompts to create content across your projects.

### AI-Assisted Quest Creation

For faster quest development, consult our [Quest Prompts](/docs/prompts-quests)
guide. It includes ready-made prompt templates for tools like GPT-4 or Claude to
help you generate dialogue and structure quickly. Combine these with the
[Quest Development Guidelines](/docs/quest-guidelines), the [Quest Template Example](/docs/quest-template), and the [Quest Submission Guide](/docs/quest-submission) to streamline content creation and sharing.

### Staying Updated

We frequently merge improvements from the `v3` branch. Keep your fork current:

```bash
git fetch origin
git merge origin/v3
npm ci
(cd frontend && npm ci)
```

## Want to contribute?

Check out the [Contributing Guide](./CONTRIBUTING.md) to get started. All community members are expected to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).
Automated contributors like the Codex agent follow the rules in [AGENTS.md](./AGENTS.md). Feel free to consult it when preparing your own pull requests.

If you have any questions, feel free to join the [Discord](https://discord.gg/A3UAfYvnxM) and say hello!

### Asset Guidelines

Avoid committing large binary files such as Photoshop documents. Convert images
to efficient formats (SVG, PNG, JPG) before adding them to the repository.

### Archiving Built-in Content

If a quest, item, or process needs to be retired, move its JSON file to the
`frontend/src/pages/quests/archive` directory instead of deleting it. The
`contentIntegrity` test tracks the total count of built-in assets, so archived
files help prevent accidental removals.
