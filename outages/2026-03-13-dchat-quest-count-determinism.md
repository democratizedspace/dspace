# dChat quest-count determinism regression (2026-03-13)

- **Summary**: dChat answered quest-count questions with variable incorrect numbers even when the app already had the correct completed quests in state.
- **Impact**: Players asking "how many quests have I completed/remaining" could receive unstable and wrong numeric answers across repeated asks.
- **Root cause**:
  - App-side state was correct, including `questsFinished` and current quest progress.
  - Prompt construction passed a raw `questsFinished` array and implicitly relied on the LLM to count it.
  - No deterministic `completed/total/remaining` official quest stats were injected from code.
- **Resolution**:
  - Added deterministic quest stats derivation from validated `gameState.quests` plus the current built-in quest catalog.
  - Injected explicit `PlayerStateStats` numeric values into the system prompt payload.
  - Surfaced the same stats in chat prompt-debug metadata.
  - Added regression tests for full completion, partial completion, unknown quest IDs, prompt injection, and `/gamesaves` envelope restore behavior.
- **Lessons / prevention**:
  - Never delegate exact arithmetic over large state arrays to the model when the app can compute authoritative numbers.
  - Prompt-debug metadata should include deterministic machine-computed values for high-trust answers.
