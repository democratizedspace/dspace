# quest-form-duplicate-validation

- **Date:** 2025-10-25
- **Component:** frontend:quest-form
- **Root cause:** QuestForm only consulted the IndexedDB-backed quest list when validating titles. During initial load the list was empty while existing quests were still syncing, so duplicate titles matching built-in quests were accepted and the Playwright check for the "Title must be unique" message failed.
- **Resolution:** QuestForm now falls back to the server-provided existingQuests data when the IndexedDB list is empty, ensuring duplicate titles are rejected immediately. Added a regression unit test exercising the fallback and reran the e2e flow.
- **References:**
  - frontend/src/components/svelte/QuestForm.svelte
  - frontend/__tests__/QuestFormDuplicateTitleFallback.test.js
  - frontend/e2e/constellations-quest.spec.ts
