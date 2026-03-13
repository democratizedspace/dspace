---
title: 'dChat quest-count nondeterminism in PlayerState prompt (2026-03-13)'
slug: '2026-03-13-dchat-quest-count-nondeterminism'
summary: 'dChat answered completed/remaining quest counts inconsistently because it was asked to infer counts from a raw finished-quests array instead of using machine-computed official quest stats.'
---

# dChat quest-count nondeterminism in PlayerState prompt (2026-03-13)

- **Window**: 2026-03-13 (v3)
- **Symptoms**:
    - Prompt debug showed `PlayerState questsFinished = 247` for completionist saves.
    - dChat still returned inconsistent counts (for example, 192 or 237) across repeated asks.
- **Impact**: Players received incorrect progress totals from chat despite correct saved state.

## Root cause

App-side game state was valid, but the prompt included a long `questsFinished` array and relied on
LLM counting. Exact completed/remaining values were delegated to model inference rather than
injected as deterministic numeric stats computed from official quest IDs in the build.

## Resolution

- Added deterministic quest progress stats derived from game state finished quests intersected with
  the official built-in quest catalog.
- Injected `PlayerStateStats` with exact machine-computed values into the chat system prompt,
  alongside the existing `PlayerState` snapshot.
- Exposed these exact stats in prompt debug metadata so the UI clearly shows what numeric values
  were injected.
- Added regression tests for all-official completion, partial completion, unknown/custom quest IDs,
  prompt injection behavior, debug metadata display, and `/gamesaves` envelope import restore.

## Lessons / prevention

- Never ask the model to count large arrays when exact values can be computed in app code.
- For player progress metrics, inject explicit machine-computed numeric fields into prompts.
- Keep prompt debug aligned with injected values to simplify future incident diagnosis.
