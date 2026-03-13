# dChat quest count nondeterminism from array counting (2026-03-13)

## Summary
- dChat returned variable quest-count answers even when game state was stable.

## Impact
- Players asking for completed/remaining quest totals saw inconsistent numbers across repeated asks.

## Root cause
- The app provided a raw `questsFinished` array and implicitly relied on the LLM to count it.
- Exact quest totals were not injected as deterministic numeric stats derived in code from game state and the official quest catalog.

## Resolution
- Added deterministic official quest stats helper and injected explicit completed/total/remaining values into PlayerState prompt context and debug metadata.

## Lessons / prevention
- Keep exact arithmetic in application code and pass models explicit numeric fields for user-visible totals.
