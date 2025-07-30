# DSPACE Agents Guide

> Instructions for automation, Codex agents and other LLMs interacting with this repository.

## Project Structure for OpenAI Codex Navigation

- `frontend/` – Svelte components and quests
- `backend/` – server code
- `frontend/src/pages/quests/` – canonical quest JSON
- `scripts/` – utilities for data and tests

## Development Workflow

Run checks locally before opening a pull request:

```bash
# Full test suite including lint and unit tests
SKIP_E2E=1 npm run test:pr
```

- Install Playwright browsers with `npx playwright install chromium` when E2E tests require it.
- Use `npm run check` to verify formatting and linting.
- If dependencies are missing, run `npm ci` in the repo root and `npm ci --prefix frontend`.
- Fix formatting issues with `npx prettier`.
- Set `ESLINT_USE_FLAT_CONFIG=false` if running ESLint manually.

## Quest Creation Guidelines

- Quest JSON lives in `frontend/src/pages/quests/json` and must follow the schema in `frontend/src/pages/quests/jsonSchemas`.
- Each quest needs start, middle and completion nodes with at least one option per node and a final `finish` option.
- Reference at least one inventory item or process in every quest or the `questQuality` test will fail.
- Consult `frontend/src/pages/docs/md/npcs.md` for character voice and keep it updated.
- Use `npm run generate-quest` to scaffold dialogue quickly.
- Archive deprecated quests under `frontend/src/pages/quests/archive`.

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

- [Quest Submission Guide](frontend/src/pages/docs/md/quest-submission.md)
- [UI Lifecycle Overview](frontend/src/pages/docs/md/ui-lifecycle.md)
- [Codex Implementation Prompt](frontend/src/pages/docs/md/prompts-codex.md#implementation-prompt)
- [Codex Upgrade Prompt](frontend/src/pages/docs/md/prompts-codex.md#upgrade-prompt)
- [AGENTS.md Spec](https://gist.github.com/dpaluy/cc42d59243b0999c1b3f9cf60dfd3be6)
- [Agents.md Guide](https://agentsmd.net/)
