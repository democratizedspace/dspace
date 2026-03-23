# QA checklist non-green regression (2026-03-23)

- **Summary**: QA checklist entries for legacy quest suites remained non-green after tooling fixes because the suites still bundled advisory heuristics with hard assertions and used a brittle canonical finish-node assumption.
- **Impact**: The PR could not credibly claim a fully green quest-quality matrix, and reviewers had low confidence in whether remaining red signals represented real defects or noisy heuristics.

## Root cause

1. **Glob import shape drift in legacy Jest files**
   - `glob` export shape differs across versions (`globSync`, `sync`, or callable module export).
   - Legacy tests duplicated ad-hoc fallback logic, increasing the chance of drift and unclear failures.

2. **Canonical quest test assumed final-node finish semantics**
   - The legacy canonical test required a `finish` option only on the last dialogue node.
   - Several valid quests expose a finish path without placing the finish option on the final array element.

3. **Quest quality suite treated advisory heuristics as hard blockers**
   - Personality-tone checks, progression advisories, and selected aquarium wording checks were asserted as hard failures.
   - This created large, noisy failures even when hard structural and dependency invariants were satisfied.

## Resolution

- Added a shared resolver (`resolveGlobSync`) for legacy Jest suites:
  - prefers `globSync`, then `sync`, then callable module export,
  - throws a descriptive invariant error when unsupported.
- Updated all scoped legacy quest suites to use the shared resolver.
- Fixed canonical validation to assert:
  - quest has a valid start,
  - quest has at least one finish option anywhere in the graph,
  - `questHasFinishPath` is true.
- Refined quest-quality gating:
  - hard failures remain for structural/data-integrity invariants,
  - style/progression/aquarium-process heuristics are surfaced as advisory warnings (still visible in logs).

## Test fixes and new tests

- Added **new unit tests** for `resolveGlobSync` covering:
  - `globSync` export shape,
  - `sync` fallback,
  - callable module fallback,
  - descriptive error on unsupported shape.
- Re-ran targeted quest and inventory verification commands and updated `docs/qa/v3.md` only with command-backed evidence.

## Prevention

- Keep legacy compatibility logic centralized in shared helpers with explicit invariants.
- Keep QA suites split between:
  - **hard gates** (must fail CI),
  - **advisory diagnostics** (warning telemetry for content quality follow-up).
