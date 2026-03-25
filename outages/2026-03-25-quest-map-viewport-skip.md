# Quest graph viewport Playwright test skipped when unreachable toggle is unavailable

## Summary
The Playwright coverage for quest map viewport persistence used `test.skip()` whenever the
**Show unreachable** checkbox was disabled. In datasets with no unreachable nodes, this caused the
primary viewport regression test to be reported as skipped in CI/local automation.

## User-visible impact
- QA checklist item "Quest dependency map renders and preserves viewport interactions" could remain
  unresolved even though the map UI itself worked.
- Regression risk increased because viewport preservation behavior was not asserted in those runs.

## Regression window
- **Introduced:** historical behavior in `quest-graph-map-viewport.spec.ts` fallback branch.
- **Detected:** 2026-03-25 while re-running v3 QA checklist section 2.1/2.2 locally.
- **Fixed:** 2026-03-25.

## Root cause
The test relied on a feature-gated control (`Show unreachable`) that is intentionally disabled when
there are no unreachable nodes. The spec treated this valid UI state as a reason to skip entirely,
instead of exercising an alternate viewport-preservation interaction.

## Resolution
- Removed the unconditional `test.skip()` path.
- Added a deterministic fallback assertion:
  - set a known pan/zoom state,
  - switch from **Map** → **Diagnostics** → **Map**,
  - assert viewport state remains stable.
- Kept the existing unreachable-toggle assertions for environments where the control is enabled.
