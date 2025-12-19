# 2025-10-17-local-storage-helpers-orphaned

- **Date:** 2025-10-17
- **Component:** tests
- **Root cause:** local-storage-helpers.spec.ts was added but never registered in frontend/scripts/run-test-groups.mjs, so the split e2e workflow skipped the spec and the coverage guard failed the job.
- **Resolution:** frontend/scripts/run-test-groups.mjs now includes local-storage-helpers.spec.ts in the UI Interaction batch and tests/run-test-groups.test.ts asserts every e2e spec is enumerated, preventing future omissions.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18603193494/job/53046387287
  - frontend/scripts/run-test-groups.mjs
  - tests/run-test-groups.test.ts
