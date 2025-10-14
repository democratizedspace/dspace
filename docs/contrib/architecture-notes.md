# Structural polish roadmap

_Last updated: 2025-10-14_

## Context

We are beginning the multi-phase restructuring described in the DSPACE structural polish playbook. The
current workspace still uses the legacy `frontend/` and `backend/` layout with deployment artefacts
spread across `ansible/`, `k8s/`, and `monitoring/`. This document captures migration notes before we
touch application code so that contributors have a shared blueprint.

## Goals

1. Transition the monorepo to `apps/` + `packages/` groupings without breaking existing imports or CI
   pipelines.
2. Consolidate infrastructure assets under a new `infra/` tree with clear environment overlays.
3. Harden offline-first behaviour with a documented service worker strategy and schema versioning.
4. Improve accessibility guidance and automation while keeping current quests and gameplay intact.

## Upcoming migrations

### Workspace reshuffle

- Create `apps/frontend` and `apps/backend` directories and migrate the current `frontend/` and
  `backend/` projects in stages.
- Maintain compatibility by introducing TypeScript path aliases and Jest/Vitest module name maps
  that allow both the old and new locations during the transition.
- Update `pnpm-workspace.yaml`, `tsconfig.json`, `vitest.config.ts`, and any Jest configs as the
  directories move. Stage these edits so that every commit keeps lint, type-check, and tests green.

### Shared packages

- Stand up `packages/types` for cross-application TypeScript types and JSON schemas.
- Extract quest schema definitions into `packages/schemas` and export them for both client and server
  validators. Add contract tests to ensure the frontend and backend agree on payload structures.

### Infrastructure consolidation

- Introduce `infra/` with nested `ansible/`, `k8s/`, and `monitoring/` directories.
- Provide environment overlays (e.g., `infra/k8s/overlays/prod`) plus documentation describing how to
  deploy with the reorganised tree.
- Update any scripts or docs that refer to the old top-level directories; keep shims (symlinks or
  forwarding scripts) until downstream automation is updated.

### Offline-first improvements

- Document the caching strategy: pre-cache `/`, `/play`, `/quests/*`; runtime cache quest JSON,
  textures, and audio with versioned cache keys.
- Store save data with versioned schemas and add fixtures for historic saves to the test suite.
- Write regression tests covering offline quest launch and cached asset persistence.

### Accessibility enhancements

- Enforce lint rules for `aria-*`, focus visibility, and contrast; configure CI to fail on
  violations.
- Publish a keyboard-only walkthrough covering global navigation, quest selection, quest execution,
  and settings management.
- Capture baseline accessibility snapshots using Playwright to detect regressions.

### Documentation tasks

- Refresh the README with updated quick links for play, develop, test, and deploy flows.
- Split contributor, player, and operations documentation into `docs/contrib/`, `docs/`, and
  `docs/ops/` respectively. Update internal indexes and run the docs link checker after each move.

## Open questions

- How should we stage the service worker updates to avoid cache poisoning during deployment?
- Do we maintain backwards-compatible quest asset URLs during the move, or introduce a versioned
  asset host?
- Which telemetry events should be opt-in versus default? Need stakeholder alignment before
  implementing privacy toggles.

## Next steps

1. Draft documentation updates (including the accessibility walkthrough) before refactoring code.
2. Prepare scaffolding commits that introduce `apps/` and `infra/` directories while keeping aliases
   intact.
3. Schedule regression suites (`pnpm run lint`, `pnpm run type-check`, `pnpm run build`, `pnpm run
   test:ci`, `pnpm run link-check`) for every structural change.
4. Perform secret scans (`git diff --cached | ./scripts/scan-secrets.py`) before committing.

