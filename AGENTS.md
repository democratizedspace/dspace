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

## SSR Safety Patterns

DSPACE uses Astro SSR (Server-Side Rendering), which means JavaScript modules execute both on
the server (Node.js) and client (browser). Browser-only APIs like `localStorage`, `IndexedDB`,
`window`, `document`, and `navigator` will cause errors during SSR if accessed without guards.

### The `isBrowser` Utility

Use the centralized SSR utility at `frontend/src/utils/ssr.js`:

```javascript
import { isBrowser, onBrowser } from '../utils/ssr.js';

// Guard direct access
if (isBrowser) {
    const value = localStorage.getItem('key');
}

// Or use the helper for inline expressions
const value = onBrowser(() => localStorage.getItem('key'), null);
```

### Common SSR Pitfalls

1. **Default parameter values** are evaluated at module import time:
   ```javascript
   // BAD - crashes on server
   function greet(lang = navigator.language) { }
   
   // GOOD - check at runtime
   function greet(lang = undefined) {
       if (lang === undefined) {
           lang = typeof navigator !== 'undefined' ? navigator.language : 'en';
       }
   }
   ```

2. **Top-level code** runs during module import on both server and client:
   ```javascript
   // BAD - runs immediately during SSR
   const theme = localStorage.getItem('theme');
   
   // GOOD - guard with isBrowser
   import { isBrowser } from '../utils/ssr.js';
   const theme = isBrowser ? localStorage.getItem('theme') : 'dark';
   ```

3. **Browser-only functions** like `atob`, `btoa`, `FileReader`:
   ```javascript
   // Use Buffer fallback for server
   const decoded = typeof atob === 'function' 
       ? atob(encoded) 
       : Buffer.from(encoded, 'base64').toString('utf8');
   ```

### For Svelte Components

In Svelte, prefer `onMount()` which only runs in the browser:

```svelte
<script>
import { onMount } from 'svelte';

let data = null;

onMount(() => {
    // Safe - only runs in browser
    data = localStorage.getItem('data');
});
</script>
```

### SSR Safety Tests

The test suite at `frontend/tests/ssrSafety.test.ts` uses static analysis to verify:
- JS utilities import `isBrowser` when accessing browser APIs
- Svelte components guard `localStorage` with `isBrowser` or `onMount`
- No unguarded top-level `window`/`document` access

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

## CI/CD and Docker Builds

### GitHub Actions Workflows

The repository has several CI workflows in `.github/workflows/`:

- **ci.yml** - Main CI: runs lint, tests, E2E tests on every PR
- **ci-image.yml** - Docker image build and smoke test on every PR
- **deploy.yml** - Production deployment (on merge to main)

### Docker Image Build Process

The root `Dockerfile` builds the production image:

1. Installs dependencies with `pnpm install --frozen-lockfile`
2. Runs `pnpm run build` to compile the Astro SSR application
3. Creates a minimal runtime image with only production dependencies
4. Exposes port 8080 and starts with `node entrypoint.mjs`

**Important**: The Docker build uses the current PR code, so any SSR safety fixes
must be in the source before the image will work correctly.

### Smoke Test

The `ci-image.yml` workflow includes a smoke test that:

1. Builds the Docker image from the PR code
2. Starts the container with `NODE_OPTIONS="--unhandled-rejections=warn"`
3. Polls `/config.json` endpoint until it returns HTTP 200 (up to 60 seconds)
4. Verifies basic server functionality

**Why `/config.json` instead of `/`?**

The `/config.json` endpoint is a simple API route that doesn't depend on the game state
system or complex SSR. If this endpoint works but `/` returns 500, it indicates an SSR
issue in the page components rather than a fundamental server problem.

### Debugging CI Failures

When the smoke test fails with HTTP 500:

1. Check container logs for error messages (shown in CI output)
2. Look for SSR-related errors (IndexedDB, localStorage, window, navigator)
3. Ensure all browser API access is guarded with `isBrowser`
4. The error may be silently caught by Astro - add error handlers to `entrypoint.mjs`

Common SSR issues in CI:
- `IndexedDB not supported` - Storage code running on server
- `navigator is not defined` - Browser API in default parameter
- `window is not defined` - Unguarded window access
- `atob/btoa is not defined` - Use Buffer fallback for base64

### Configuration Consistency

The test at `tests/configConsistency.test.ts` validates that ports and health endpoints
are consistent across:
- `Dockerfile`
- `docker-compose.yml`
- `charts/dspace/values.yaml` (Helm)
- `infra/k8s/` manifests
- Documentation

Run `npm test` to verify configuration stays in sync.

## Historical changelog policy

- Treat published changelog markdown under `frontend/src/pages/docs/md/changelog/` as
  immutable narrative history.
- Only fix typos, spacing, or broken links in historical files — document those adjustments in
  `frontend/tests/fixtures/changelogCorrections.json` and refresh the associated snapshots.
- When you need to reference newer context from an older release, add an entry to
  `frontend/src/utils/changelogNotes.ts` so the UI appends a note at render time instead of
  editing the archived markdown body.

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
