---
title: 'dChat quest count nondeterminism from array counting (2026-03-13)'
slug: '2026-03-13-chat-quest-count-nondeterministic'
summary: 'dChat returned unstable completed/remaining quest counts because counts were delegated to model-side array counting instead of deterministic app-computed stats.'
---

# dChat quest count nondeterminism from array counting (2026-03-13)

- **Window**: 2026-03-13 UTC
- **Summary**: dChat returned variable quest totals for the same save despite correct app state.
- **Impact**: Players asking "how many quests have I completed / remaining" saw inconsistent answers across repeated asks.

## Root cause

- Player state already contained the correct finished quest set, but prompt construction passed the
  full `questsFinished` array and implicitly delegated exact counting to the LLM.
- Remaining official quests were not provided as deterministic numeric values from the official
  runtime quest catalog.

## Resolution

- Added `computeOfficialQuestStats(gameState)` to compute:
    - completed official quests
    - total official quests from the built-in quest catalog
    - remaining official quests (`max(total - completed, 0)`)
- Kept `questsFinished` in PlayerState for context, and appended explicit `PlayerStateStats`
  numbers to the prompt.
- Surfaced deterministic quest stats in chat prompt debug metadata.
- Added regression tests for all-complete, partial, unknown/custom quest IDs, prompt inclusion,
  and `/gamesaves` envelope import/restore behavior.

## Lessons / prevention

- Do not delegate exact arithmetic over large state arrays to the model when deterministic app data
  exists.
- Include machine-computed numeric stats in prompt payloads for any user-visible totals.
- Keep debug metadata aligned with the exact deterministic values injected into prompts.
