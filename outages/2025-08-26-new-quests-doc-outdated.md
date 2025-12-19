# 2025-08-26-new-quests-doc-outdated

- **Date:** 2025-08-26
- **Component:** docs
- **Root cause:** new quests were added but docs/new-quests.md and its frontend copy weren't regenerated
- **Resolution:** ran npm run new-quests:update and committed the refreshed docs
- **References:**
  - docs/prompts/codex/ci-fix.md#lessons-learned
