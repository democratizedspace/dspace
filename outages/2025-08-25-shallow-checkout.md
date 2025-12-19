# 2025-08-25-shallow-checkout

- **Date:** 2025-08-25
- **Component:** ci
- **Root cause:** actions/checkout fetched depth 1, leaving origin/v3 unavailable for tests
- **Resolution:** set fetch-depth: 0 in ci.yml so scripts can access origin/v3
- **References:**
  - docs/prompts/codex/ci-fix.md#lessons-learned
