# Windows PowerShell frontend install/dev regression

## Impact
- `npm install` in `frontend/` failed locally on Windows PowerShell with `ERESOLVE`.
- `npm run dev` then failed because `prism-svelte` was not installed and `frontend/astro.config.mjs`
  imports it directly.

## Detection
- Reproduced from a local Windows 11 shell by running `npm install` and `npm run dev` inside
  `frontend/`.

## Root cause
- The repository root had `legacy-peer-deps=true`, but frontend-scoped npm execution did not
  reliably pick up that config in this local setup.
- With stale legacy modules in `frontend/node_modules` (notably `@astrojs/svelte@2.1.0`), npm peer
  resolution failed before dependency repair, which left `prism-svelte` absent.

## Resolution
- Added `frontend/.npmrc` with `legacy-peer-deps=true` so npm behavior is explicit when commands are
  run from `frontend/`.
- Added a regression test in `tests/packageManager.test.ts` that requires `frontend/.npmrc` to
  include this setting.

## Prevention
- Keep npm behavior declared at each command entrypoint (`repo root` and `frontend/`) to avoid
  shell/path-specific config drift on local development machines.
