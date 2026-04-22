# Quests custom locked visibility regression in launch-gate run

## Symptom
`frontend/__tests__/Quests.test.js > Quests Component > hides locked custom quests until prerequisites are complete`
failed with:
`AssertionError: expected null not to be null`.

## Root cause
The assertion waited for `custom-quests-section` directly instead of first waiting for the custom merge
status markers, creating timing sensitivity in asynchronous mount/merge sequencing.

## Fix
The test now waits for `data-merge-complete="true"` and `data-custom-count="1"` on
`custom-quests-merge-status` before asserting section visibility/content.

## Verification
`npm run test:root -- frontend/__tests__/Quests.test.js`
