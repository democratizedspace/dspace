# 2025-10-17-docs-search-role-regression

- **Date:** 2025-10-17
- **Component:** frontend:e2e
- **Root cause:** Docs search E2E spec still queried the textbox role, but Playwright now exposes <input type=search> controls as the searchbox role, so the locator never found the field and the shard aborted early.
- **Resolution:** Update the docs search test to target the searchbox role and add a DocsIndex unit test that asserts the search input remains accessible, guarding against future regressions.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18605256329/job/53053162559
