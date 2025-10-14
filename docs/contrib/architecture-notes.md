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
4. **Offline-first rigor**: Define a service worker that precaches core routes (`/`, `/play`,
   `/quests/*`), runtime caches quest JSON and media, and versions cache keys via a `CACHE_VERSION`
   constant exported from a shared package. Add fixtures for legacy save data so migrations are
   reversible.
5. **Accessibility workflows**: Expand linting to enforce `aria-*`, focus visibility, and contrast
   rules. Maintain a manual keyboard walkthrough checklist in `docs/ops/a11y-checklist.md`.
6. **Testing & telemetry**: Establish contract tests between the frontend and backend via shared
   JSON schemas, snapshot quest/NPC bios, and gate telemetry via explicit opt-in toggles.

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

