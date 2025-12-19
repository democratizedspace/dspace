# OUT-2025-10-18-astro-build-client-assets-missing

- **Date:** 2025-10-18
- **Component:** frontend-e2e
- **Root cause:** Playwright preview reused a stale Astro build because ensure-astro-build.mjs only checked for the server entrypoint and skipped rebuilding when the dist/client/_astro directory was missing, so the preview server returned 404s for client bundles.
- **Resolution:** Updated ensure-astro-build.mjs to verify both server and client assets exist before skipping a rebuild and added tests that fail when client bundles are absent.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18605256329
