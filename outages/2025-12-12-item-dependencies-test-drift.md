# item-dependencies-test-drift

- **Date:** 2025-12-12
- **Component:** scripts/generate-item-dependencies
- **Root cause:** The generate-item-dependencies tests drifted again, asserting on items/quests that no longer matched the live quest graph, which left map lookups undefined and triggered TypeErrors on Windows.
- **Resolution:** Switched the tests to guard against missing IDs and assert against stable aquaria relationships (aquarium heater requires quests; Fish Friend Award rewards goldfish), keeping expectations tied to current JSON data and reducing future drift risk.
- **References:**
  - tests/generateItemDependencies.test.ts
  - scripts/generate-item-dependencies.js
  - frontend/src/pages/quests/json
  - frontend/src/pages/inventory/json/items
