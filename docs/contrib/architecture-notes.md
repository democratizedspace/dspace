# Structural Migration Notes

## Overview

The repo is being restructured to support a long-term `apps/` + `packages/` monorepo layout while
keeping CI jobs, quests, and deployment workflows stable. This document tracks planned and completed
moves so contributors can stage their work accordingly.

## Planned Actions

1. **Application folders**: Graduate existing `frontend/` and `backend/` projects into
   `apps/frontend` and `apps/backend`. Preserve developer muscle memory by leaving shims or
   alias scripts until downstream documentation and tooling finish updating.
2. **Shared code packages**: Introduce `packages/*` for reusable utilities (types, content schemas,
   telemetry hooks). Existing shared modules under `scripts/`, `tests/`, or `backend/` will migrate
   gradually.
3. **Infrastructure overlays**: Layer environment-specific configuration inside `infra/` (e.g.,
   `infra/k8s/environments/production`) and document entry points under `docs/ops/deploy/`. Secrets
   stay out of the repo, but variable names and expected files belong in docs.
4. **Offline-first rigor**: Iterate on the offline UX now that a service worker precaches core
   routes (`/`, `/play`, `/quests/*`) and versioned cache keys come from the shared
   `@dspace/cache-version` package. Offline toasts now announce when connectivity returns before
   auto-hiding; keep fixtures for legacy save data under `tests/fixtures/save-data/` so migrations
   stay reversible while upcoming work focuses on staged asset cleanup.
5. **Testing & telemetry**: Establish contract tests between the frontend and backend via shared
   JSON schemas, snapshot quest/NPC bios, and gate telemetry via explicit opt-in toggles.

### Current Iteration Focus (2025-09)

- **Apps scaffolding**: Add an `apps/` directory with a placeholder README that maps existing
  application roots and captures the migration contract (e.g., `frontend` remains the source of
  truth until parity is confirmed). Update `pnpm-workspace.yaml` to recognise `apps/*` so early
  adopters can experiment without breaking the legacy workspace.

## Sequencing Strategy

- Draft documentation and update README navigation before moving code so contributors know where
  assets are headed.
- Relocate infrastructure directories first; they have fewer Node-based dependencies and make the
  root cleaner for future `apps/*` moves.
- Update pnpm workspaces, tsconfig path aliases, and Jest/Vitest configs immediately after moving a
  project directory. Provide compatibility scripts (e.g., `npm run dev:legacy`) until downstream
  guides are refreshed.
- After each move, run `pnpm run lint`, `pnpm run type-check`, `pnpm run build`, and
  `pnpm run test:ci`. Re-run `pnpm run link-check` when docs relocate.
- Use the `scripts/scan-secrets.py` check on staged diffs before committing.

## Completed Actions

- Consolidated infrastructure into `infra/` (`infra/ansible`, `infra/k8s`, `infra/monitoring`) and
  refreshed references in docs, quests, and guides.
- Added a dedicated accessibility lint (`npm run lint:a11y`) that fails on missing ARIA semantics,
  focus outline removal, and low-contrast colour combinations. The keyboard walkthrough lives in
  `docs/ops/a11y-checklist.md`.
- Extended the accessibility lint script to fail when Svelte buttons omit an explicit `type`
  attribute, preventing unintended form submissions for keyboard users.
- Extended the accessibility lint script to validate `aria-label` attributes, flagging elements with
  empty or whitespace-only labels that provide no meaningful context for screen readers.
- Expanded the accessibility lint to require SVG icons to expose an accessible name via
  `aria-label`, `aria-labelledby`, or a `<title>` element, unless they are explicitly marked as
  decorative. Updated the accompanying tests to lock the behaviour in place.
- Promoted the keyboard-only walkthrough to a permanent release checklist in
  `docs/ops/a11y-checklist.md`, including focus-state verification guidance and Playwright
  accessibility snapshot capture instructions.
- Versioned the offline cache layer with a shared `CACHE_VERSION` constant, stored the resolved
  value in `localStorage` (`dspace-cache-version`) for mismatch detection, and registered a service
  worker that precaches navigation routes plus runtime assets so offline play matches the
  architecture plan.
- Captured the service-worker cache strategy, save-data versioning, rollback flow, and
  `offlineWorker.enabled` flag expectations in `docs/ops/offline-first.md` so operators can follow
  the runbook that shipped with the live worker.
