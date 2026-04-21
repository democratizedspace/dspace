# Module typeless package warning for Svelte config

## title
Module typeless package warning for Svelte config

## symptom
Vitest emitted MODULE_TYPELESS_PACKAGE_JSON warning for root svelte.config.js.

## root cause
Root package.json is CommonJS while svelte config used ESM syntax in a .js extension.

## fix
Renamed root Svelte config to svelte.config.mjs and updated vitest config path to match.

## verification
- npx vitest run -c vitest.config.mts frontend/__tests__/Quests.test.js
