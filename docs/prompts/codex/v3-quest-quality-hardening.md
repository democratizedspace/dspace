# v3 quest quality hardening prompts

Use this when you want Codex to do the heavy lifting for quest-quality hardening work that supports
manual checkbox verification in `docs/qa/v3.md` §4.5.

## Main prompt

```markdown
# DSPACE v3 quest quality hardening (problematic backlog → §4.5 checkbox-ready)

You are Codex working in `democratizedspace/dspace`.

## Objective

Select 3–8 quests from `docs/design/v3-quest-quality-review.md` under
**Problematic quests to prioritize (with improvement checklist)** and harden them so they can be
manually reviewed and then checked off in `docs/qa/v3.md` §4.5.

Prioritize quests whose boxes are still unchecked in `docs/qa/v3.md` §4.5.

## Deterministic backlog rules (required)

1. Work within a single tree when possible.
2. For the chosen tree, read its `Exemplar anchors (checked in docs/qa/v3.md §4.5)` line and use
   only those listed quest IDs as parity exemplars.
3. Determine each selected quest's checklist-rubric type by keyword (**first keyword match wins**)
   and apply only that type's structure.
4. Prefer a mixed set of rubric types when selecting multiple quests (for example install + measure
   + log/monitor) so coverage is explicit.

## Quality bar (must satisfy for each selected quest)

- Remove thin-shell flow (`start -> one step -> finish`) unless explicitly justified.
- Add at least one mechanics-backed evidence gate (`requiresItems`, `launchesProcess`,
  measurement/log artifact, or equivalent).
- Add at least one troubleshooting or recovery branch.
- Add safety or operational checks where domain-relevant.
- Keep lore voice aligned with `frontend/src/pages/docs/md/npcs.md`.

## Implementation requirements

- Edit quest JSON under `frontend/src/pages/quests/json/<tree>/<quest>.json`.
- Keep quest IDs stable unless correcting a proven canonical mismatch.
- If quest flow changes materially, update paired docs in `frontend/src/pages/docs/md/<tree>.md`.
- Codex cannot create or edit binary image assets. If quality hardening requires adding a new item
  or quest that needs an image, reuse an existing in-repo image reference from a similar item/quest
  and note this in follow-ups for human image dedup/replacement.
- Ensure requirements, rewards, and process references resolve to valid IDs.

## Validation commands (required)

1. `npm run lint`
2. `npm run type-check`
3. `npm run build`
4. `npm run test:ci`
5. `npm run link-check` (run when docs/markdown changed)
6. `for f in frontend/src/pages/quests/json/<tree>/*.json; do node scripts/validate-quest.js "$f" || exit 1; done`

## REQUIRED output format for your PR summary

Output exactly these sections in order:

1. `Selected quests`
   - Bullet list of selected quest IDs.
2. `Exemplar anchors used`
   - Bullet list mapping each selected quest to anchor ID(s) copied from the tree's anchor line.
3. `Before/after structural summary`
   - Per quest: what branches, evidence gates, and troubleshooting/safety paths were added.
4. `Tests and checks run`
   - Bullet list of commands and pass/fail status.
5. `§4.5 checkbox candidates`
   - Bullet list of quest IDs that are now ready for manual verification in `docs/qa/v3.md` §4.5.
6. `Follow-ups`
   - Deferred work or explicit `None`.
```

## Upgrade prompt

```markdown
# Upgrade the v3 quest quality hardening prompt

You are updating `docs/prompts/codex/v3-quest-quality-hardening.md`.

Goals:

- Keep the prompt copy/paste-ready.
- Keep all referenced paths and commands valid for this repository.
- Preserve deterministic rules: verified exemplar anchors, rubric type first-match behavior, and
  required output format.

Constraints:

- Keep one `Main prompt` codeblock and one `Upgrade prompt` codeblock.
- Move non-reusable commentary into short notes outside those codeblocks.

Return the fully updated markdown document.
```

## Notes (non-copy)

- Exemplar anchors listed in `docs/design/v3-quest-quality-review.md` are the only allowed source
  for exemplar IDs.
- Keep this file current if any referenced script path or validation command changes.
