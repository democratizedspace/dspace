# docs-canvas-libexpat-missing

- **Date:** 2025-12-15
- **Component:** docs
- **Root cause:** Production runtime image omitted libexpat and other canvas runtime libraries, causing jsdom's optional canvas dependency to crash SSR for /docs routes.
- **Resolution:** Install the required canvas runtime libraries in the production image and add a container smoke test that requires canvas and verifies /docs/dCarbon renders successfully.
- **References:**
  - Dockerfile
  - .github/workflows/ci-image.yml
  - frontend/src/pages/docs/[slug].astro
