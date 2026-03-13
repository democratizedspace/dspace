---
title: 'dChat quest-count nondeterminism from raw array counting (2026-03-13)'
slug: '2026-03-13-dchat-quest-count-nondeterminism'
summary: 'dChat returned variable completed/remaining quest counts because the model was asked to infer counts from a raw questsFinished array instead of using deterministic app-computed stats.'
---

# dChat quest-count nondeterminism from raw array counting (2026-03-13)

- **Summary**: dChat produced inconsistent answers to quest-count questions even when PlayerState had the correct finished quest IDs.
- **Impact**: Players could receive incorrect completed/remaining quest counts (for example fluctuating values across repeated asks), reducing trust in chat output.
- **Root cause**:
    - App-side game state already had correct quest completion data.
    - The system prompt injected a raw `questsFinished` array and implicitly delegated exact counting to the LLM.
    - LLM counting over long arrays was nondeterministic, so numeric answers drifted.
- **Resolution**:
    - Added deterministic quest stats computed in application code from validated game state plus the official in-build quest catalog.
    - Injected explicit stats (`completedOfficialQuests`, `totalOfficialQuests`, `remainingOfficialQuests`) into the PlayerState prompt block.
    - Exposed the same deterministic stats in prompt debug metadata so operators can verify exact injected values.
- **Lessons**:
    - Exact arithmetic should be performed in code and passed to the model as facts.
    - Arrays can remain useful context, but the model should not be asked to derive critical counts from them.
- **Prevention**:
    - Regression tests now cover full completion, partial completion, unknown/custom quest IDs, prompt injection of deterministic stats, and post-import stats correctness.
