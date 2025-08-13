# DSPACE - Democratized Space

[![Lint & Format](https://img.shields.io/github/actions/workflow/status/democratizedspace/dspace/ci.yml?label=lint%20%26%20format)](https://github.com/democratizedspace/dspace/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/democratizedspace/dspace/tests.yml?label=tests)](https://github.com/democratizedspace/dspace/actions/workflows/tests.yml)
[![Coverage](https://codecov.io/gh/democratizedspace/dspace/branch/v3/graph/badge.svg)](https://codecov.io/gh/democratizedspace/dspace)
[![Docs](https://img.shields.io/github/actions/workflow/status/democratizedspace/dspace/quest-chart.yml?label=docs)](https://github.com/democratizedspace/dspace/actions/workflows/quest-chart.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

You can find the game at [democratized.space](https://democratized.space).
The production instance is now self-hosted; see
[Netlify Migration](docs/netlify-migration.md) for background.

Check out the [docs](https://democratized.space/docs)!

## Local Development

Clone and set up the project:

Make sure you have **Node.js 18 or 20 LTS** installed. The CI runs on Node.js 20.

```bash
git clone https://github.com/democratizedspace/dspace.git
cd dspace
node --version # ensure Node.js 18 or 20 is in use
# pnpm 9.0.0 is configured via packageManager
pnpm install
```

The repo includes a `pnpmfile.cjs` that pre-approves native builds for `canvas`,
`esbuild`, and `@swc/core`, so `pnpm install` runs without interactive prompts.

Start the development server:

```bash
# Standard development server
npm run dev

# Development server with Playwright artifact error prevention
cd frontend && npm run dev:safe
```

The `dev:safe` command prevents common Playwright artifact errors that can occur after running tests.

### Utility Functions

The backend exposes `approximateIrlPrice(id)` to estimate real-world item costs. The lookup
normalizes case, spaces, and hyphens for resilient calls.
Prices are approximate USD values.

```ts
import { approximateIrlPrice } from "./backend/approximateIrlPrice";

console.log(approximateIrlPrice("3D-Printer")); // 350
console.log(approximateIrlPrice("unknown")); // null
```


## Testing

DSPACE uses a comprehensive testing suite to ensure code quality and prevent regressions.

### Pre-PR Testing

Before submitting a pull request, run the comprehensive test suite:

```bash
npm test
```

If Playwright browsers aren't installed, you may skip E2E tests:

```bash
SKIP_E2E=1 npm test
```

GitHub Actions runs the E2E tests and fails pull requests when they do not pass.
If you encounter an error like `browserType.launch: Executable doesn't exist`,
download the browsers with:

```bash
npx playwright install chromium
```

This cross-platform script will:

- Check code formatting and linting
- Run all unit tests
- Run all end-to-end tests in optimized groups
- Provide helpful error messages if any tests fail

The `npm test` command (alias `npm run test:pr`) handles everything automatically, including starting and stopping the development server for end-to-end tests.

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

# Collect Playwright coverage
npm run test:e2e:coverage

# Generate unit test coverage
npm run coverage
# Verify 100% coverage for changed files
node scripts/checkPatchCoverage.cjs
# View the HTML report at
frontend/coverage/lcov-report/index.html

# Run IndexedDB performance benchmark
npm run benchmark:db

# Run custom content load test
npm run loadtest:custom-content
```

> **Important:** End-to-end (E2E) tests use Playwright, which automatically starts and stops the development server when needed. You should not manually start a server when running these tests, as this could lead to port conflicts or unexpected behavior.

### Continuous Integration

GitHub Actions automatically run `npm test` on every pull request and push to `v3`.
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

The server exposes two monitoring endpoints:

- `GET /health` returns `{ "status": "ok" }` for basic liveness checks.
- `GET /metrics` serves Prometheus-formatted metrics using `prom-client`. Set a
  `METRICS_TOKEN` environment variable to require
  `Authorization: Bearer <token>` for this endpoint.

For a full Raspberry Pi setup, including k3s instructions, see [docs/RPI_DEPLOYMENT_GUIDE.md](./docs/RPI_DEPLOYMENT_GUIDE.md).
To add Prometheus and Grafana monitoring, follow the steps in [docs/monitoring_setup.md](./docs/monitoring_setup.md).
For high availability, configure Cloudflare Load Balancing as described in [docs/cloudflare_load_balancing.md](./docs/cloudflare_load_balancing.md).
See [docs/failover_procedures.md](./docs/failover_procedures.md) for handling outages and restoring nodes.
Nightly backups use the script documented in [docs/backup_system.md](./docs/backup_system.md).

### Automated Raspberry Pi Deployment

The workflow `.github/workflows/rpi-deploy.yml` builds an ARM64 Docker image and optionally deploys it to a Raspberry Pi over SSH.
Create a classic PAT with the [`write:packages` scope](https://github.com/settings/tokens/new?scopes=write:packages) (fine-grained tokens don’t work with Packages yet) and add it as the `GHCR_TOKEN` secret.
Set `RPI_HOST`, `RPI_USER`, and `RPI_SSH_KEY` to enable SSH deployment. When these secrets aren't defined, the job is skipped instead of failing. Add the values under **Settings → Secrets and variables → Actions** when you're ready to deploy.
Trigger the workflow manually or on pushes to `v3` to update the Pi and restart the `app` service.

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
- [UI Lifecycle Overview](./frontend/src/pages/docs/md/ui-lifecycle.md) for understanding Astro SSR and Svelte hydration
- Testing strategies
- Performance considerations
- Troubleshooting tips

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
See [Quest Trees](docs/quest-trees) for an overview of the different categories and their progression.
The repository includes a script that summarizes how many quests and lines of dialogue exist in each tree. Categories are sorted by quest count for readability.
Run `node scripts/generate-quest-chart.js` to recreate `quest-tree-stats.txt` and a PNG image saved locally. The PNG is ignored in Git. Check the "Quest Chart" workflow artifacts for the latest generated image. You can see how the quest catalog has grown by comparing the current count against v2.1 with `npm run quest:count`. Generate a map of which quests require or reward each item with `npm run generate:item-map`.

Looking for a concrete walkthrough? The Playwright test `constellations-quest.spec.ts` demonstrates creating the "Map the Constellations" quest end to end and validating it using our quest checks.

Aquarium quests progress through a gentle learning curve: set up a Walstad tank, test the water, install a sponge filter, ask Atlas to position the tank, add dwarf shrimp, introduce guppies, perform regular water changes, practice breeding, and finally keep a goldfish in a large tank.
Electronics quests now begin with a simple LED circuit to teach basic wiring before moving on to sensors and automation. Each tree has been extended with follow-up tasks, such as tuning 3D printer retraction and refreshing hydroponic nutrients.
The DevOps chain now covers deploying DSPACE on a Raspberry Pi cluster with Docker and k3s, setting up monitoring with Prometheus and Grafana, and scheduling nightly backups. Recent updates shortened several prerequisite chains so energy and DevOps milestones align more closely with other categories.

To validate that quests use a canonical structure with clear start and finish
steps, run the dedicated test:

```bash
[Quest Development Guidelines](docs/quest-guidelines), the [Quest Template Example](docs/quest-template), and the [Quest Submission Guide](docs/quest-submission) to streamline content creation and sharing.
Use `npm run generate-quest [--template <name>]` to scaffold a new quest with placeholder dialogue.
```

Custom quests often rely on new items or processes. Use [`scripts/create-content-bundle.js`](./scripts/create-content-bundle.js) to package these together. See the [Custom Content Bundles](docs/custom-bundles) guide for details.

Additional quality checks are available:

```bash
npm test -- questQuality        # heuristics for dialogue quality via token.place
npm test -- itemQuality         # validates item registry for realism and completeness
npm test -- processQuality      # validates generated process data for realistic durations
npm test -- imageReferences     # verifies quest and NPC image files
```

## Built-in Items

Item definitions live in `frontend/src/pages/inventory/json/items`. Assign new sequential `id` numbers and include an image path when adding items. See `frontend/src/pages/docs/md/item-guidelines.md` for detailed guidance.
All item files must satisfy `frontend/src/pages/inventory/jsonSchemas/item.json`. Run `npm test -- itemValidation` to check the schema.

## Built-in Processes

Process definitions live in `frontend/src/pages/processes/base.json` with
hardening metadata under `frontend/src/pages/processes/hardening`. These
compile into `frontend/src/generated/processes.json`.
Durations should mirror real-world expectations when possible. See
`frontend/src/pages/docs/md/process-guidelines.md` for more tips on designing
and balancing new processes.

### Data Migration

DSPACE stores custom content in IndexedDB. A migration system automatically
updates old records when the database schema changes. On first run after an
update, migrations add missing fields and bump the saved schema version to keep
everything consistent.

> **Tip:** We use the open-source LLM inference from
> [`token.place`](https://github.com/futuroptimist/token.place) when generating quest
> dialogue. Token.place itself doesn't host quests, but you can reuse the same
> prompts to create content across your projects.

### AI-Assisted Content Creation

For faster content development, consult our prompt guides for
[quests](docs/prompts-quests), [items](docs/prompts-items), and
[processes](docs/prompts-processes). Each includes ready-made templates for
tools like GPT-4 or Claude. Combine these with the [Quest Development
Guidelines](docs/quest-guidelines), the [Quest Template Example](docs/quest-template),
the [Item Development Guidelines](docs/item-guidelines), the [Process Development
Guidelines](docs/process-guidelines), and the [Quest Submission
Guide](docs/quest-submission) to streamline content creation and sharing.

## Authentication

Quest submissions require a GitHub personal access token. The token is stored locally so you don't need to re-enter it. See [Authentication Flow](docs/AUTHENTICATION.md) for details and how to revoke the token when you're done.

### Staying Updated

We frequently merge improvements from the `v3` branch. Keep your fork current:

```bash
git fetch origin
git merge origin/v3
pnpm install
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

## License

DSPACE is licensed under the MIT License. See [LICENSE](LICENSE) for details.
