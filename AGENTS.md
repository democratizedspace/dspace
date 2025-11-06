# DSPACE Agents Guide

> Instructions for automation, Codex agents and other LLMs interacting with this repository.

## Project Structure for OpenAI Codex Navigation

- `frontend/` – Svelte components and quests
- `backend/` – server code
- `frontend/src/pages/quests/` – canonical quest JSON
- `frontend/src/pages/` – Astro SSR routes (see [Routes Documentation](docs/ROUTES.md))
- `scripts/` – utilities for data and tests

## Astro Routes & Link Checking

DSPACE uses Astro for SSR with file-based routing. All routes served by the application are documented in [docs/ROUTES.md](docs/ROUTES.md).

**Key concepts:**
- Routes are defined by `.astro` files in `frontend/src/pages/`
- Dynamic routes use bracket syntax: `[slug].astro`, `[id].astro`, `[pathId]/[questId].astro`
- Internal links (starting with `/`) are validated by `scripts/link-check.mjs`
- External links are validated by lychee in CI
- The link checker resolves dynamic routes without requiring server startup

**Common route patterns:**
- `/docs/[slug]` → documentation pages (e.g., `/docs/about`, `/docs/solar`)
- `/inventory/item/[itemId]` → item details (e.g., `/inventory/item/37`)
- `/processes/[processId]` → process pages (e.g., `/processes/launch-rocket`)
- `/quests/[pathId]/[questId]` → quest pages (e.g., `/quests/play/2`)

**Testing links:**
```bash
# Validate all internal links in markdown files
node scripts/link-check.mjs
```

See [docs/ROUTES.md](docs/ROUTES.md) for the complete route catalog and resolution logic.

## Development Workflow

Run checks locally before opening a pull request:

```bash
# Full test suite including lint, unit, and E2E tests
npm test

# Skip E2E tests only if browsers are unavailable
SKIP_E2E=1 npm test
```

- The CI workflow always runs E2E tests and will fail pull requests when they fail.
- Install Playwright browsers with `npx playwright install chromium` when E2E tests require it.
- Use `npm run check` to verify formatting and linting.
- Use `npm run audit:ci` to fail on high-severity dependency vulnerabilities.
- Quest JSON files are validated via a pre-commit hook (`scripts/validate-staged-quests.js`).
- Install dependencies with `pnpm install` in the repo root; this covers the `frontend` workspace.
  In CI environments, run `pnpm install --frozen-lockfile --reporter=append-only` or use
  `npm run ci:install` to skip Husky hooks.
- Fix formatting issues with `npx prettier`.
- Set `ESLINT_USE_FLAT_CONFIG=false` if running ESLint manually.
- If a proxy is required, set `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY` environment variables
  instead of using `.npmrc` proxy settings.
- Use `nvm use` to match the Node.js version specified in `.nvmrc` (Node 20 LTS).

## Dependency Management

- GitHub Dependabot automatically opens weekly PRs for npm updates (see `.github/dependabot.yml`).

## Quest Creation Guidelines

- Quest JSON lives in `frontend/src/pages/quests/json` and must follow the schema in `frontend/src/pages/quests/jsonSchemas`.
- Each quest needs start, middle and completion nodes with at least one option per node and a final `finish` option.
- Reference at least one inventory item or process in every quest or the `questQuality` test will fail.
- Consult `frontend/src/pages/docs/md/npcs.md` for character voice and keep it updated.
- Use `npm run generate-quest [--template <name>]` to scaffold dialogue quickly; templates live in `frontend/src/pages/quests/templates`.
- Archive deprecated quests under `frontend/src/pages/quests/archive`.
- After adding or removing quests, run `npm run new-quests:update` and commit the
  generated `docs/new-quests.md` and its frontend copy to keep quest counts in sync.

## UI Guidelines

- Astro renders pages on the server and hydrates Svelte components in the client.
- Place interactive code in `onMount` and mark hydrated components with `data-hydrated="true"`.
- Add Jest tests for new components in `frontend/__tests__`.
- Avoid committing large binary assets.

## Pull Request Guidelines

1. Summarize your changes and whether tests passed.
2. Keep PRs focused on a single concern.
3. Ensure `npm run coverage` and `node scripts/checkPatchCoverage.cjs` succeed before merging.

## Programmatic Checks

```bash
npm run lint
npm run type-check
npm run build
```

All checks must pass before an agent-created PR is merged.

## Additional Resources

- [Routes Documentation](docs/ROUTES.md) - Complete catalog of Astro SSR routes
- [Quest Submission Guide](frontend/src/pages/docs/md/quest-submission.md)
- [UI Lifecycle Overview](frontend/src/pages/docs/md/ui-lifecycle.md)
- [Codex Implementation Prompt](https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/baseline.md#implementation-prompt)
- [Codex Upgrade Prompt](https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/baseline.md#upgrade-prompt)
- [Codex Structural Polish Playbook](https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/polish.md)
- [Codex Prompt Upgrader](https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/upgrader.md)
- [AGENTS.md Spec](https://gist.github.com/dpaluy/cc42d59243b0999c1b3f9cf60dfd3be6)
- [Agents.md Guide](https://agentsmd.net/)
