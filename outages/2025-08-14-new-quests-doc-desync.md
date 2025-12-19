# 2025-08-14-new-quests-doc-desync

- **Date:** 2025-08-14
- **Component:** docs
- **Root cause:** New quest files were added but new-quests markdown wasn't regenerated, causing stale counts.
- **Resolution:** Updated update-new-quests.js to refresh docs/new-quests.md and added a test to keep copies in sync.
- **References:**
  - tests/newQuestsList.test.ts
