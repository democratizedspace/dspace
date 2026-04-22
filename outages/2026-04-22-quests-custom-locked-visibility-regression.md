# Outage: locked custom quest visibility regression in Quests test

- **Date:** 2026-04-22
- **Component:** frontend quests list rendering
- **Symptom:** `frontend/__tests__/Quests.test.js` failed on
  `hides locked custom quests until prerequisites are complete` with
  `expected null not to be null` while waiting for the custom quests section.

## Root cause

A regression in custom-quest merge timing made the custom section visibility check flaky, so
assertions could execute before the merged custom quest state was reflected in the DOM.

## Resolution

Adjusted the merge/render path and test synchronization so custom quest DOM sections are created
consistently, while keeping locked custom quests hidden until their prerequisites are complete.

## References

- `frontend/__tests__/Quests.test.js`
- `frontend/src/pages/quests/svelte/Quests.svelte`
