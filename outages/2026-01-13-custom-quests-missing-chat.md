# Custom quests did not render QuestChat UI

## Impact
- Custom quests created via `/quests/create` were not completable because the QuestChat
  interface (NPC dialogue + options) never rendered on `/quests/<uuid>`.
- Users only saw a details card with title/description, blocking any dialogue navigation.

## Root cause
- The `/quests/[id]` route rendered a bespoke details-only view for custom quests instead of
  the shared QuestChat experience used by built-in quests.
- Custom quest data was not normalized into the canonical quest shape expected by QuestChat.

## Detection
- Manual QA reproduced the issue by creating a quest and visiting `/quests/<uuid>`, which
  surfaced the missing chat UI.

## Resolution
- Unified quest loading to normalize custom quests into the same shape as built-ins.
- Rendered QuestChat for any quest with dialogue on `/quests/[id]`.
- Added unit + Playwright coverage to prevent regressions for custom quests and built-ins.

## Follow-ups
- Avoid branching UI by “custom vs built-in” unless functionally required.
- Keep quest normalization in the data layer and reuse it for all quest routes.
