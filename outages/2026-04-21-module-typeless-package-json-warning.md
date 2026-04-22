# Module typeless package.json warning

## Symptom
Vitest emitted `[MODULE_TYPELESS_PACKAGE_JSON]` for root `svelte.config.js`.

## Root cause
Root package is CommonJS, while `svelte.config.js` used ESM syntax.

## Fix
Renamed root config to `svelte.config.mjs` and updated Vitest config path.

## Verification
`npm test` no longer emits the module typeless warning.
