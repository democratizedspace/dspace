# Quests locked custom visibility regression

## Symptom
`frontend/__tests__/Quests.test.js > Quests Component > hides locked custom quests until prerequisites are complete` failed with `expected null not to be null` while asserting custom quest section visibility.

## Root cause
Unmounted `Quests.svelte` instances could continue async custom-quest hydration and classification after teardown, introducing cross-test timing interference in fake-timer runs.

## Fix
Added a component-destroy guard in `Quests.svelte` so async reconciliation and custom quest merge exit early after unmount.

## Verification
`npm run test:root -- frontend/__tests__/Quests.test.js`
