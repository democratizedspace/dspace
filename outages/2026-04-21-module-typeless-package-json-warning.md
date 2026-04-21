# Module typeless package warning

## title
Module typeless package warning

## symptom
Vitest emitted `[MODULE_TYPELESS_PACKAGE_JSON]` for `svelte.config.js`.

## root cause
Root config file used ESM syntax with `.js` extension in a non-`type: module` package.

## fix
Renamed `svelte.config.js` to `svelte.config.mjs` and updated config references.

## verification
`npm run test:root`
