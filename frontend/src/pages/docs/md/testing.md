---
title: 'Testing Guide'
slug: 'testing'
---

# Testing Guide

DSPACE uses a layered test suite to keep gameplay, infrastructure, and
front-end changes stable. This page summarizes the required checks and points
back to the full testing reference for deeper guidance.

## Core commands

Run the same checks that CI enforces before opening a pull request:

- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm run test:ci`
- `npm run audit:ci`

If Playwright browsers are unavailable locally, you may run `SKIP_E2E=1 npm
run test:ci`, but call that out in your PR.

## Test layers

- **Unit + integration**: `npm run test:ci` runs the root Vitest suite and the
  frontend test groups.
- **End-to-end**: `npm run test:e2e` or `npm run test:e2e:groups` exercises
  user flows with Playwright.
- **Docs link checking**: `npm run link-check` validates internal links against
  the Astro route map.

## Full reference

For detailed examples (debugging tips, test structure, Playwright guidance, and
naming conventions), see the
[repository Testing Guide](https://github.com/democratizedspace/dspace/blob/v3/frontend/TESTING.md).
