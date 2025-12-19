# quests-custom-visibility

- **Date:** 2025-10-19
- **Component:** frontend quests
- **Root cause:** The quests landing page only rendered the statically bundled quest list and never fetched custom quests from IndexedDB, so newly created quests were missing from the listing and the e2e quest creation flow timed out while waiting for the link.
- **Resolution:** Normalize and merge stored custom quests into the quests grid during hydration, dedupe them with built-in entries, and add tests that mock IndexedDB backed quests to ensure the list includes custom data.
- **References:**
  - frontend/src/pages/quests/svelte/Quests.svelte
  - frontend/__tests__/Quests.test.js
  - frontend/e2e/quests.spec.ts
