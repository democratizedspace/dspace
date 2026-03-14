---
title: 'dChat quest-count determinism regression (2026-03-13)'
slug: '2026-03-13-dchat-quest-count-determinism'
summary: 'dChat received raw questsFinished arrays and produced variable wrong counts; fixed by injecting deterministic official quest stats computed in code.'
---

# dChat quest-count determinism regression (2026-03-13)

- **Summary**: dChat returned variable incorrect quest totals despite accurate underlying game state.
- **Impact**: "Completed" and "remaining" quest answers were unreliable for players, especially with long finished-quest arrays.
- **Root cause**:
    - The app passed `questsFinished` and expected the LLM to count it.
    - Exact `completed/total/remaining` official counts were not computed in app code.
- **Resolution**:
    - Added deterministic quest stat computation from validated game state and the built-in official quest catalog.
    - Injected `PlayerStateStats` into the prompt and exposed the same values in prompt debug metadata.
    - Added regression coverage including `/gamesaves` envelope restore.
- **Lessons**:
    - LLMs should consume exact machine-computed totals for arithmetic-style state questions.
    - Keep prompt debug metadata aligned with authoritative computed values.
- **Prevention**:
    - Regression tests now assert deterministic prompt stats and official quest-count behavior for full, partial, and unknown quest IDs.
