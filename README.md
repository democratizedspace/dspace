# DSPACE - Democratized Space

[![Lint & Format](https://img.shields.io/github/actions/workflow/status/democratizedspace/dspace/ci.yml?label=lint%20%26%20format)](https://github.com/democratizedspace/dspace/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/democratizedspace/dspace/tests.yml?label=tests)](https://github.com/democratizedspace/dspace/actions/workflows/tests.yml)
[![Coverage](https://codecov.io/gh/democratizedspace/dspace/branch/v3/graph/badge.svg)](https://codecov.io/gh/democratizedspace/dspace)
[![Docs](https://img.shields.io/github/actions/workflow/status/democratizedspace/dspace/quest-chart.yml?label=docs)](https://github.com/democratizedspace/dspace/actions/workflows/quest-chart.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A free and open-source web-based space exploration idle game combining resource management, exploration, and community interaction. Build things, complete quests, and reach for the cosmos.

**Play now**: [democratized.space](https://democratized.space)

## Quick Start

- **Play the Game**: [democratized.space](https://democratized.space/)
- **Documentation**: [democratized.space/docs](https://democratized.space/docs)
- **Join Community**: [Discord](https://discord.gg/A3UAfYvnxM)

## For Developers

### Getting Started

**Prerequisites**: Node.js 20 LTS or later (required for development dependencies)

```bash
git clone https://github.com/democratizedspace/dspace.git
cd dspace
nvm use  # Optional: sync to .nvmrc version
pnpm install
npm run dev  # Start development server on http://localhost:3002
```

For comprehensive setup instructions, see the [Developer Guide](./DEVELOPER_GUIDE.md).

If your environment cannot download prebuilt `canvas` binaries (used by quest-chart tooling via
`chartjs-node-canvas`), install native prerequisites before re-running `pnpm install`:

- macOS (Homebrew): `brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman`
- Debian/Ubuntu: `sudo apt-get install -y build-essential pkg-config libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev`

### Essential Commands

```bash
npm run dev          # Start dev server
npm test             # Run all tests (skip E2E with SKIP_E2E=1)
npm run check        # Lint and format check
npm run build        # Production build
```

Root-level tests validate the built frontend bundle; they will trigger `npm run build` if
`frontend/dist` is missing, so running the build first keeps test runs quicker. Cache the
`frontend/dist` directory between CI jobs to avoid rebuilding when the validation test runs.

E2E tests rely on Playwright. Install the browser binaries and system dependencies before running them locally:

```bash
npx playwright install chromium
npx playwright install-deps
```

See [Testing Guide](./frontend/TESTING.md) for detailed testing information.

## Releasing / QA

- [v3 QA checklist](./docs/qa/v3)
- [QA checklist index and template](./docs/qa/README.md)

## Documentation Index

All project documentation is organized below for easy discovery:

### Developer Resources

- [Developer Guide](./DEVELOPER_GUIDE.md) - Architecture, testing strategy, and development workflow
- [Testing Guide](./frontend/TESTING.md) - Comprehensive testing documentation
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute to DSPACE
- [Code of Conduct](./CODE_OF_CONDUCT.md) - Community guidelines
- [Agents Guide](./AGENTS.md) - Guidelines for automated contributors

### Content Creation

Create quests, items, and processes for the game:

- [Content Development Guide](https://democratized.space/docs/content-development) - Hub for all content creation
- [Quest Guidelines](https://democratized.space/docs/quest-guidelines) - Creating educational quests
- [Item Guidelines](https://democratized.space/docs/item-guidelines) - Defining game items
- [Process Guidelines](https://democratized.space/docs/process-guidelines) - Building game processes
- [Quest Submission](https://democratized.space/docs/quest-submission) - How to submit your content
- [Custom Content Bundles](https://democratized.space/docs/custom-content-bundles) - Packaging related content

### Operations & Deployment

- [Operations Runbooks](./docs/ops/README.md) - Deployment and maintenance procedures
  - [Raspberry Pi Deployment](./docs/ops/RPI_DEPLOYMENT_GUIDE.md) - Deploy on Raspberry Pi with k3s
  - [Docker Deployment](./docs/ops/deploy/docker.md) - Container-based deployment
  - [Monitoring Setup](./docs/ops/monitoring_setup.md) - Prometheus and Grafana
  - [Backup System](./docs/ops/backup_system.md) - Automated backups
- [Cloudflare Load Balancing](./docs/ops/cloudflare_load_balancing.md) - High availability
- [Failover Procedures](./docs/ops/failover_procedures.md) - Handling outages
- [Netlify Migration](./docs/ops/netlify-migration.md) - Self-hosting background
- [Offline-First Strategy](./docs/ops/offline-first.md) - PWA capabilities
- [Raspberry Pi 9-node topology](./docs/raspi_cluster_topology_9_nodes.md) - Inventory and role map
- [Power budget and load test](./docs/power_budget_load_test.md) - Verify PoE headroom
- [Kubernetes Deployment](./docs/charts.md) - Helm chart installation
- k3s + Sugarkube runbooks: [dev](./docs/k3s-sugarkube-dev.md) / [staging](./docs/k3s-sugarkube-staging.md) / [prod](./docs/k3s-sugarkube-prod.md)

### Verification (environment split)

Run these commands to verify the environment-specific runbooks, token alignment, and supporting docs
stay consistent:

```bash
rg -n "k3s-sugarkube-(dev|staging|prod)\\.md" -S docs README.md
rg -n "QA Cheats|DSPACE_ENV" -S docs/k3s-sugarkube-*.md
rg -n "(^|[^A-Z])INT([^A-Z]|$)" -S .
rg -n "env=.*int|sugar-int|SUGARKUBE_TOKEN_INT" -S .
rg -n "SUGARKUBE_TOKEN_DEV" -S docs
rg -n "env=dev" -S docs/k3s-sugarkube-staging.md
test -f docs/raspi_cluster_topology_9_nodes.md && test -f docs/power_budget_load_test.md
rg -n "raspi_cluster_topology_9_nodes|power_budget_load_test" -S README.md docs
rg -n "k3s-sugarkube-dev\\.md" -S docs README.md
```

### Service worker update strategy

The offline worker uses a coordinated update flow to avoid "CSS 404 until hard reload" issues:

- New workers stay in `waiting` until the page explicitly sends `SKIP_WAITING`, then a single
  `controllerchange` reload brings the new version online.
- Navigations prefer the network with cached fallbacks, while hashed assets use cache-first and keep
  the previous cache generation to bridge deploys.
- Service worker and HTML responses are served with `no-cache`/`no-store` so browsers always recheck
  for updates, while hashed assets are long-lived and immutable.

### Architecture & Technical Design

- [Contributor Guides](./docs/contrib/README.md) - Technical references for contributors
  - [Architecture Notes](./docs/contrib/architecture-notes.md) - Migration and design decisions
  - [Authentication Flow](./docs/contrib/authentication.md) - GitHub token authentication
  - [ADR-0001](./docs/contrib/ADR-0001.md) - Architecture decision records
- [Routes Documentation](./docs/ROUTES.md) - Astro SSR routing system
- [UI Lifecycle](https://democratized.space/docs/ui-lifecycle) - Astro SSR and Svelte hydration
- [Configuration](./docs/config.md) - Environment and configuration options

### AI & Automation

Prompts for AI-assisted development:

- [Codex Baseline Prompts](./docs/prompts/codex/baseline.md) - Implementation and upgrade prompts
- [Quest Prompts](./docs/prompts/codex/quests.md) - AI-assisted quest creation
- [Item Prompts](./docs/prompts/codex/items.md) - AI-assisted item creation
- [Process Prompts](./docs/prompts/codex/processes.md) - AI-assisted process creation
- [Other Codex Prompts](./docs/prompts/codex/) - Frontend, backend, testing, and more

### Game Documentation

- [Mission Statement](https://democratized.space/docs/mission) - Project goals and vision
- [Quest Trees](https://democratized.space/docs/quest-trees) - Quest progression paths
- [FAQ](https://democratized.space/docs/faq) - Frequently asked questions
- [Glossary](https://democratized.space/docs/glossary) - Game terminology
- [Changelog](https://democratized.space/docs/changelog) - Version history

## Contributing

We welcome contributions! See our [Contributing Guide](./CONTRIBUTING.md) to get started.

Key contribution areas:
- Create quests, items, and processes
- Improve documentation
- Fix bugs and add features
- Enhance accessibility

All contributors must follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

MIT License - see [LICENSE](LICENSE) for details.
