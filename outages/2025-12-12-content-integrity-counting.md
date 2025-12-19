# content-integrity-counting

- **Date:** 2025-12-12
- **Component:** tests:content-integrity
- **Root cause:** Content integrity counts used POSIX globbing, returning zero quests/items on Windows and causing false regressions while CI stayed green on Linux.
- **Resolution:** Replaced shell-dependent globbing with pure Node directory traversal for quests, items, NPC assets, and processes so counts are platform-agnostic.
- **References:**
  - scripts/tests/contentIntegrity.test.ts
  - frontend/src/pages/quests/json
  - frontend/src/pages/inventory/json/items
