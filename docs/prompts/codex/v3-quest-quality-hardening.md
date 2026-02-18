# v3 quest quality hardening prompts

This file provides copy/paste prompts for hardening v3 quests using the backlog in
`docs/design/v3-quest-quality-review.md`.

## Main prompt

```markdown
# DSPACE v3 quest quality hardening (problematic backlog → parity)

You are Codex working in `democratizedspace/dspace`.

## Objective

Select 3–8 quests from `docs/design/v3-quest-quality-review.md` under
**Problematic quests to prioritize (with improvement checklist)** and harden them to parity with
checked quests in `docs/qa/v3.md` §4.5.

## How to use the backlog (required)

1. Work within a single tree when possible.
2. Read that tree's `Exemplar anchors (checked in docs/qa/v3.md §4.5)` line and use only those
   quest IDs as parity exemplars.
3. Determine each selected quest's checklist-rubric type by keyword (**first match wins**) and
   apply that type's structure (do not use generic boilerplate).
4. Prefer a mixed set of types when selecting multiple quests (for example install + measure +
   log/monitor) so rubric coverage is explicit.

## Quality bar (must satisfy for each selected quest)

- Remove thin-shell flow (`start -> one step -> finish`) unless explicitly justified.
- Add at least one mechanics-backed evidence gate (`requiresItems`, `launchesProcess`,
  measurement/log artifact, or equivalent).
- Add at least one troubleshooting/recovery branch.
- Add safety/operational checks where domain-relevant.
- Keep lore voice aligned with `frontend/src/pages/docs/md/npcs.md`.

## Implementation requirements

- Edit quest JSON under `frontend/src/pages/quests/json/<tree>/<quest>.json`.
- Keep quest IDs stable unless correcting a proven canonical mismatch.
- If quest flow changes materially, update paired docs in `frontend/src/pages/docs/md/<tree>.md`.
- Do not add new binary image assets.
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
   - Bullet list mapping each quest to anchor ID(s) copied from the tree's anchor line.
3. `Before/after structural summary`
   - Per quest: what branches, evidence gates, and troubleshooting/safety paths were added.
4. `Tests and checks run`
   - Bullet list of commands and pass/fail status.
5. `Follow-ups`
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

- The backlog's exemplar anchors are the only allowed source for exemplar IDs.
- If commands or scripts change, update this file to keep automation deterministic.
