# Custom quests did not render QuestChat UI

## Impact
- Custom quests created via `/quests/create` were not completable because the QuestChat dialogue
  UI (NPC bubble + player options) did not render on `/quests/<uuid>`.
- Built-in quests continued to work, but custom quests were effectively read-only.

## Root cause
- The `/quests/[id]` route rendered a bespoke "Quest details" card for custom quests and only
  used QuestChat for built-in quests, so custom dialogue graphs were never presented.

## Detection
- Manual QA flow: create a quest at `/quests/create`, then navigate to `/quests/<uuid>` and
  observe the missing chat interface.

## Resolution
- Unified quest loading so both custom and built-in quests normalize into the same quest shape.
- The quest detail route now always renders QuestChat when a quest with dialogue is loaded.
- Added unit and end-to-end tests to cover custom quest chat rendering and navigation.

## Follow-ups
- Avoid UI forks based solely on "custom vs built-in" unless absolutely required.
- Keep custom quest normalization in the data layer, not the UI layer.
