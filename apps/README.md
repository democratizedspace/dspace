# Apps Directory

This folder will eventually house the production application entry points under
`apps/frontend` and `apps/backend`. During the transition period, the canonical sources remain in
`frontend/` and `backend/`. Tooling should continue to reference those legacy directories until the
matching `apps/*` packages are promoted to primary.

## Migration Guidelines

- New experiments can live under `apps/` if they export pnpm-ready `package.json` manifests and
  reuse shared tooling from the repository root.
- Do not delete or move the existing `frontend/` or `backend/` directories until the migration plan
  in `docs/contrib/architecture-notes.md` marks them as complete.
- Keep CI scripts compatible with both layouts. Prefer path aliases or wrapper scripts instead of
  hard-coding directory names.

A `.gitkeep` file anchors the directory in git until the first application package is migrated.
