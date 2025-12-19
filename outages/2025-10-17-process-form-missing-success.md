# process-form-missing-success-handler

- **Date:** 2025-10-17
- **Component:** frontend ProcessForm
- **Root cause:** ProcessForm.svelte only dispatched a submit event and never persisted custom processes or surfaced a success indicator, leaving the Playwright suite unable to confirm creation and causing e2e shards to fail.
- **Resolution:** Persist the process via the custom content database inside ProcessForm.svelte, render a success state for the UI, and cover the behaviour with tests.
- **References:**
  - frontend/src/components/svelte/ProcessForm.svelte
  - frontend/__tests__/ProcessForm.test.js
