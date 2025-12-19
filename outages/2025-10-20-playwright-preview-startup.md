# 2025-10-20-playwright-preview-startup

- **Date:** 2025-10-20
- **Component:** frontend/e2e
- **Root cause:** Playwright's navigateWithRetry helper only waited ~3.75s before failing, so CI runs hit net::ERR_CONNECTION_REFUSED while the Astro preview server was still booting on slower runners.
- **Resolution:** Extended the default retry attempts and delay in navigateWithRetry to cover slow preview startups and added unit tests exercising the longer backoff.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18642736123/job/53144470360
