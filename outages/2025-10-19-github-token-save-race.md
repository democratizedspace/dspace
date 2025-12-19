# 2025-10-19-github-token-save-race

- **Date:** 2025-10-19
- **Component:** cloud sync
- **Root cause:** Saving GitHub credentials only enqueued asynchronous IndexedDB writes, so reloading the page immediately after clicking Save left the token missing and cleared the field on the next visit.
- **Resolution:** Game state persistence now records timestamps, mirrors writes to localStorage before IndexedDB, and prefers the newest snapshot on load; added regression tests covering the fallback path.
- **References:**
  - frontend/src/utils/gameState/common.js
  - frontend/__tests__/githubToken.test.js
  - frontend/__tests__/gameState/common.test.js
