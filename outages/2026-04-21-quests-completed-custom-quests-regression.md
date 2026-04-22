# Quests completed custom quests regression

## Symptom
`frontend/__tests__/Quests.test.js` intermittently failed with `expected null not to be null` when asserting completed custom quest placement.

## Root cause
Assertion depended on a broad descendant selector that did not explicitly target the completed section anchor and could observe transient render state.

## Fix
Hardened the assertion target in the regression test to query the completed quest tile via `data-questid` and keep status-slot expectations scoped to that tile.

## Verification
`npx vitest run --config vitest.config.mts frontend/__tests__/Quests.test.js` and full `npm test`.
