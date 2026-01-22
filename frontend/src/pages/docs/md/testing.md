---
title: 'Testing Guide'
slug: 'testing'
---

# Testing Guide

This guide summarizes how DSPACE tests run locally and in CI, plus the checks that keep
link hygiene and documentation coverage healthy. It complements the repository-level
[Developer Guide](https://github.com/democratizedspace/dspace/blob/v3/DEVELOPER_GUIDE.md).

## Running the Test Suites

- Run the full suite from the repository root with `npm test`.
- Skip end-to-end coverage when browsers are unavailable with `SKIP_E2E=1 npm test`.
- Use `npm run lint`, `npm run type-check`, and `npm run build` to mirror the core CI
  checks before opening a PR.

## Link Hygiene Expectations

- Internal links that start with `/` must resolve to a valid Astro route or static asset.
- Documentation links to GitHub must point at real files or directories in the v3 branch.

## Where to Look for More Detail

For step-by-step workflows, refer to the longer testing guide in the repo at
`frontend/TESTING.md` and the testing sections of the Developer Guide.
