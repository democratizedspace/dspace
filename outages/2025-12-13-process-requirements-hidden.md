# 2025-12-13-process-requirements-hidden

- **Date:** 2025-12-13
- **Component:** process page UI
- **Root cause:** Two issues: (1) Process item lists hid whenever inventory counts were zero, so requirements and outputs vanished for empty inventories. (2) Required items displayed as inventory/required instead of required/inventory, making it unclear what was needed vs available.
- **Resolution:** CompactItemList now renders whenever a process defines items (even when inventory counts are zero) and renders requireItems as required/inventory (e.g., 5/10 means need 5, have 10). The regression test covers both the zero-count visibility bug and the corrected require formatting.
- **References:**
  - https://staging.democratized.space/processes/solar-200Wh
  - frontend/src/components/__tests__/Process.spec.ts
