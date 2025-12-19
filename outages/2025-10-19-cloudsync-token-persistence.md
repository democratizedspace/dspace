# 2025-10-19-cloudsync-token-persistence

- **Date:** 2025-10-19
- **Component:** frontend:cloudsync
- **Root cause:** The cloud sync Save button relied on async game state writes to finish before a reload. The write queue deferred localStorage updates until after IndexedDB flushing, so immediately refreshing the page discarded the GitHub token and left the field blank on load.
- **Resolution:** Updated saveGameState to persist the latest snapshot to localStorage synchronously before queuing IndexedDB work, and added a regression test that verifies saveGitHubToken stores tokens before awaiting async flushes.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18627057663/job/53106534684
  - frontend/src/utils/gameState/common.js
  - tests/githubTokenPersistence.test.ts
