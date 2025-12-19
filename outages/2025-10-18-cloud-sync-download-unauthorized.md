# 2025-10-18-cloud-sync-download-unauthorized

- **Date:** 2025-10-18
- **Component:** frontend cloud sync
- **Root cause:** Playwright route matcher only mocked requests to https://api.github.com/gists without handling gist detail URLs, so the download step attempted a real GitHub request with a fake token and received HTTP 401, leaving the last success message in place.
- **Resolution:** Updated the e2e cloud sync spec to mock both POST/PATCH and GET calls to gist detail endpoints and added assertions ensuring the mocked routes are exercised; adjusted game state import logic to accept plain JSON payloads so decoded gist content no longer triggers atob failures.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18610825343/job/53068671174
  - https://github.com/democratizedspace/dspace/actions/runs/18610825343/job/53068671177
