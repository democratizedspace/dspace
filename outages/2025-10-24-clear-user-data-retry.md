# OUT-2025-10-24-clear-user-data-retry

- **Date:** 2025-10-24
- **Component:** frontend Playwright helpers
- **Root cause:** The clearUserData Playwright helper called page.goto('/') without retry logic, so transient preview server startup delays triggered net::ERR_CONNECTION_REFUSED and caused the process-creation E2E suite to fail before tests even executed.
- **Resolution:** Added connection-refused retry handling to purgeClientState so clearUserData waits for the preview server before clearing storage, and introduced unit tests that simulate the refusal to ensure the helper keeps retrying.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18611896671/job/53071209401
