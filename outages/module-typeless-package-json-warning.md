# title
Node typeless package warning for Svelte config

## symptom
Root tests emitted `[MODULE_TYPELESS_PACKAGE_JSON]` for `svelte.config.js`.

## root cause
The root package is CommonJS by default while the Svelte config used ESM syntax in a `.js` file.

## fix
Renamed `svelte.config.js` to `svelte.config.mjs` and updated config references.

## verification
- `npm run test:root`
