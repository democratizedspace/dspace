# 2025-08-16-frontend-new-quests-outdated

- **Date:** 2025-08-16
- **Component:** docs
- **Root cause:** frontend/src/pages/docs/md/new-quests.md was not regenerated after quest updates, leading to stale counts and failing tests.
- **Resolution:** ran scripts/update-new-quests.js to regenerate both docs/new-quests.md and frontend/src/pages/docs/md/new-quests.md
- **References:**
  - tests/newQuestsList.test.ts
