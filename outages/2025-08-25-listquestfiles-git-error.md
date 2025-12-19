# listquestfiles-git-error

- **Date:** 2025-08-25
- **Component:** scripts/update-new-quests
- **Root cause:** listQuestFiles invoked git on origin/v3 without verifying the branch existed, emitting fatal errors on clones without that remote.
- **Resolution:** listQuestFiles now suppresses git stderr and falls back to HEAD when the ref is missing.
- **References:**
  - docs/prompts/codex/ci-fix.md
