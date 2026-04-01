# Shared Packages

Utility libraries shared by multiple applications belong under this directory. Start each package
with a dedicated folder (for example, `packages/content-schemas`) that exports TypeScript entry
points and declares its build artifacts. Package manifests should be configured for pnpm workspaces
and compatible with Node 18+ runtime.

## Migration Notes

- When extracting code from `frontend/` or `backend/`, include fixtures or mocks that keep existing
  Jest/Vitest suites green.
- Document breaking changes in `docs/contrib/architecture-notes.md` and increment package versions in
  lockstep with the consuming apps.
- Add contract tests whenever schemas or shared types evolve to catch regressions early.

A `.gitkeep` placeholder keeps the directory under version control until the first package lands.
