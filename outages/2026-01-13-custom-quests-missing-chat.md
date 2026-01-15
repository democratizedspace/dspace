# Custom quests did not render QuestChat UI

## Impact
Custom quests created via `/quests/create` could not be completed because the QuestChat UI
failed to render on `/quests/<uuid>`, leaving only the details card without dialogue or
options.

## Root cause
The `/quests/[id]` route rendered a bespoke details-only view for custom quests instead of
normalizing them into the canonical quest shape and passing them through the shared
QuestChat flow used by built-in quests.

## Detection
Manual QA while creating a quest on `/quests/create` and navigating to `/quests/<uuid>` showed
that NPC dialogue and option buttons were missing.

## Resolution
- Unified quest loading by normalizing custom quest records into the canonical quest shape.
- Rendered QuestChat for any quest with dialogue on the `/quests/[id]` route.
- Added unit and Playwright regression tests to cover custom quest chat rendering and built-in
  quest behavior.

## Follow-ups
- Avoid custom-vs-built-in UI forks unless there is a hard requirement.
- Keep quest normalization in the data-loading layer so UI components remain consistent.
