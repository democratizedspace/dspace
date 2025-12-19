# new-quests-path-windows

- **Date:** 2025-12-12
- **Component:** scripts/update-new-quests
- **Root cause:** Path resolution relied on __dirname joins and POSIX git paths, which failed on Windows during newQuestsList tests when writing frontend/src/pages/docs/md/new-quests.md.
- **Resolution:** Migrated update-new-quests to ESM with fileURLToPath-derived repo roots, normalized git commands, and updated tests to use the resolved repo paths before regenerating docs.
- **References:**
  - scripts/update-new-quests.mjs
  - tests/newQuestsList.test.ts
  - docs/new-quests.md
