# Custom quests did not render QuestChat UI

## Summary
Custom quests created from `/quests/create` only displayed a quest details card on
`/quests/[id]`, omitting the QuestChat UI that powers dialogue traversal.

## Impact
- Custom quests were not completable because the NPC dialogue and player options
  were not rendered.
- Players could not advance or finish custom quests on `/quests/<uuid>`.

## Detection
- Manual QA: created a quest via `/quests/create` and visited `/quests/<uuid>`,
  observing only the quest details card without dialogue.

## Root cause
The `/quests/[id]` route rendered a bespoke details-only path when a quest was
identified as custom, bypassing the shared QuestChat rendering used by built-in
quests.

## Resolution
- Unified quest loading to normalize custom and built-in quests into a canonical
  Quest shape.
- Rendered QuestChat for any quest with dialogue data, regardless of origin.
- Added unit and end-to-end regression tests covering custom quest chat rendering
  and built-in quest chat coverage.

## Follow-ups
- Avoid UI forks for custom vs. built-in quests unless unavoidable.
- Keep normalization in the quest-loading layer to maintain a single QuestChat
  codepath.
