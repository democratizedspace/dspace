# Outage: build-related workflows stopped appearing on pull requests

- **Date:** 2026-04-02
- **Component:** GitHub Actions workflow triggers (`.github/workflows/*.yml`)
- **Status:** Resolved

## Impact

PRs targeting `main` were missing expected build-oriented checks because some workflows only
listened to `pull_request` events for `v3` or had drifted branch filters. This made it easy for
workflow regressions to go unnoticed and reduced confidence in CI coverage.

## Root cause

Workflow trigger configuration drift:

- `ci-image.yml` only triggered on PRs to `v3`.
- `ci.yml` only triggered on pushes/PRs to `v3`.
- `tests.yml` only triggered on pushes to `v3`.
- The build workflow display name changed from the expected `build`, which made the historical
  check name harder to locate in PR checks.
- Existing `ci-sentinel.yml` only checked for file presence and a few string patterns; it did not
  validate trigger parity across workflows.

## Resolution

1. Restored the build workflow name to `build` for consistent PR check visibility.
2. Expanded CI workflow branch coverage to include `main` where appropriate.
3. Added a repository-level workflow integrity script (`scripts/check-workflows.mjs`) that:
   - validates workflow YAML parses;
   - ensures required workflows exist;
   - ensures required workflows trigger on PRs;
   - enforces `main` pull_request coverage when a workflow pushes to `main`.
4. Wired the script into `ci-sentinel.yml` so one aggregate guardrail fails whenever workflow
   contracts regress.
5. Added a regression test that executes the integrity script.

## Broken tests found during investigation

No additional broken tests were discovered in the workflow guardrail check scope.
