# 2025-10-18-quest-builder-duplicate-title

- **Date:** 2025-10-18
- **Component:** frontend quest builder
- **Root cause:** Playwright test constellations-quest.spec.ts created a quest using the built-in title "Map the Constellations", which now collides with the quest builder's duplicate-title validation. The test never stored a record in IndexedDB and failed waiting for quest creation.
- **Resolution:** Generate unique quest titles during the constellations quest e2e flow, update IndexedDB helpers to support string identifiers, and add coverage asserting duplicate titles stay blocked.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18611896671/job/53071209401
