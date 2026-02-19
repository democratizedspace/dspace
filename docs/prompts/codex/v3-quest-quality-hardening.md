# v3 quest quality hardening prompts

Use these copy/paste prompts to harden v3 quest quality and clear remaining unchecked
quest-quality items in `docs/qa/v3.md` via deterministic, auditable changes.

## Main prompt

```markdown
# DSPACE v3 quest quality hardening (unchecked QA boxes -> deterministic parity)

You are Codex working in `democratizedspace/dspace`.

## Objective

Select 3-8 quests from `docs/design/v3-quest-quality-review.md` under
**Problematic quests to prioritize (with improvement checklist)** and harden them to parity with
verified checked exemplars in `docs/qa/v3.md` §4.5.

Prioritize quests that map directly to still-unchecked per-quest boxes in `docs/qa/v3.md` §4.5,
and optimize for clearing those boxes after manual human verification.

## Deterministic selection and anchoring rules (required)

1. Build a target list from still-unchecked **per-quest** rows in `docs/qa/v3.md` §4.5
   (not tree-level header checkboxes).
2. Work within a single tree when possible.
3. For that tree, read `Exemplar anchors (checked in docs/qa/v3.md §4.5)` from
   `docs/design/v3-quest-quality-review.md`.
4. Extract only anchor quest ID tokens (`<tree>/<quest>`) and ignore trailing commentary
   (for example fallback parentheticals); only IDs on that line are allowed exemplar IDs.
5. Verify each candidate anchor is actually checked in `docs/qa/v3.md` §4.5 before using it;
   unchecked anchors must not be used.
6. Determine each selected quest's checklist-rubric type by keyword (**first match wins**) and
   apply only that type's structure.
7. Prefer a mixed set of rubric types when selecting multiple quests (for example install +
   measure + log/monitor) so coverage is explicit.

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
- For each selected quest in `docs/design/v3-quest-quality-review.md`, update checklist boxes only
  when the corresponding work is verifiably complete **and** the quest JSON changes are included
  in the same PR:
  - switch `[ ]` to `[x]` for each completed line item in PRs that also modify the corresponding
    quest JSON;
  - append the current PR number at end-of-line as `(PR #<number>)`;
  - canonical PR-tag format is a single parenthetical with one `PR` prefix:
    `(PR #<number1>, #<number2>, #<number3>)`;
  - if a line already has PR tags, append the new PR as `, #<number>` inside that same
    parenthetical so the line still follows the canonical format above;
  - leave boxes unchecked when evidence is ambiguous;
  - bookkeeping-only follow-up PRs that do not touch quest JSON may adjust PR tags inside the
    existing parenthetical but must not change any `[ ]`/`[x]` checkbox state.
- **Mandatory completion gate for this prompt**: any Codex task run from this prompt that modifies
  one or more `frontend/src/pages/quests/json/<tree>/<quest>.json` files must also include
  matching checklist updates in `docs/design/v3-quest-quality-review.md` for those quest IDs in
  the same PR. A PR is non-compliant if it hardens quests but does not check/update at least one
  corresponding checklist line with PR tag(s).
- **Retroactive bookkeeping requirement**: if you discover older hardening PR(s) that changed
  quest JSON but failed to record the corresponding checklist updates in
  `docs/design/v3-quest-quality-review.md`, add a focused bookkeeping commit in the current PR to
  backfill the missing PR tag(s) and (only when clearly evidenced) checkbox state.
- If quest flow changes materially, update paired docs in
  `frontend/src/pages/docs/md/<tree>.md`.
- Codex cannot create/edit binary images. If quality hardening needs new item imagery,
  reuse an existing in-repo image reference, note human follow-up for image dedup/replacement,
  and do not add new binary assets.
- Ensure requirements, rewards, and process references resolve to valid IDs.

## Validation commands (required)

1. `npm run lint`
2. `npm run type-check`
3. `npm run build`
4. `npm run test:ci`
5. `npm run link-check` (run when docs/markdown changed)
6. `for f in frontend/src/pages/quests/json/<tree>/*.json; do node scripts/validate-quest.js "$f" || exit 1; done`

## REQUIRED output format for your PR summary

Output exactly these eight sections in order (no extra sections):

1. `Selected quests`
   - Bullet list of selected quest IDs.
2. `Unchecked QA boxes targeted`
   - Bullet list mapping each selected quest to still-unchecked per-quest checkbox row(s) in
     `docs/qa/v3.md` §4.5 it is intended to unlock, using the exact checkbox label text copied
     verbatim from §4.5 (not paraphrased and not tree-level header boxes).
   - For each mapped checkbox, include a nearest subsection header or anchor-like breadcrumb so a
     human can find it quickly (for example `§4.5 > Quest quality > <tree>`).
3. `Exemplar anchors used`
   - Bullet list mapping each selected quest to verified anchor ID(s).
4. `Before/after structural summary`
   - Per quest: what branches, evidence gates, and troubleshooting/safety paths were added.
5. `Tests and checks run`
   - Bullet list of commands and pass/fail status.
6. `Asset follow-ups`
   - Any image reuse performed and required human dedup/replacement steps, or explicit `None`.
7. `Follow-ups`
   - Deferred work or explicit `None`.
8. `Checklist box updates`
   - Bullet list of every line item changed in
     `docs/design/v3-quest-quality-review.md`, quoted verbatim with its final checkbox state and
     appended PR tag(s).
   - If no line items were changed, explicitly output `BLOCKED (non-compliant with prompt)` and do
     not open the PR until checklist updates are included.
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
- Preserve checklist bookkeeping rules for
  `docs/design/v3-quest-quality-review.md` (check only verified items when the same PR includes
  quest JSON hardening, keep PR tags in canonical single-parenthetical format `(PR #1234, #5678)`
  when multiple PRs apply, append new PR tags as `, #<number>` within that parenthetical, and
  keep checkbox state unchanged in bookkeeping-only follow-up PRs).
- Make it unambiguous that checklist updates are required (not optional) for any Codex task using
  this prompt that edits quest JSON; PRs without corresponding checklist updates are non-compliant.
- Require retroactive bookkeeping in the same PR when prior hardening PRs are found to be missing
  required checklist traceability.
- Optimize for clearing still-unchecked quest-quality boxes in `docs/qa/v3.md` after manual human
  verification.
- Preserve Codex binary-asset limitations guidance (reuse image references; no new binary assets).

Constraints:

- Keep one `Main prompt` codeblock and one `Upgrade prompt` codeblock; do not add any other
  fenced code blocks.
- Move non-reusable commentary into short notes outside those codeblocks.

Return the fully updated markdown document.
```

## Notes

- The backlog's exemplar anchors are the only allowed source for exemplar IDs.
- Keep these prompts synchronized with current script names and file paths.
