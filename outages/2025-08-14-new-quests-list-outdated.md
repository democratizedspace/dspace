# 2025-08-14-new-quests-list-outdated

- **Date:** 2025-08-14
- **Component:** docs
- **Root cause:** new quests were added but frontend/src/pages/docs/md/new-quests.md was not regenerated
- **Resolution:** ran npm run new-quests:update and committed the updated new-quests.md
- **References:**
  - docs/prompts/codex/ci-fix.md#lessons-learned
