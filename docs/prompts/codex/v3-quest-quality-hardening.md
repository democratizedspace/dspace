# v3 quest quality hardening prompts

Use these copy/paste prompts to harden v3 quest quality and clear remaining unchecked quest-quality
items in `docs/qa/v3.md` via deterministic, auditable changes.

## Main prompt

```markdown
# DSPACE v3 quest quality hardening (unchecked QA boxes → deterministic parity)

You are Codex working in `democratizedspace/dspace`.

## Objective

Select 3–8 quests from `docs/design/v3-quest-quality-review.md` under
**Problematic quests to prioritize (with improvement checklist)** and harden them to parity with
verified checked exemplars in `docs/qa/v3.md` §4.5.

In the same PR, update `docs/design/v3-quest-quality-review.md` by checking only the line-item
boxes that are verifiably completed by your quest changes, and append the PR number at the end of
each checked line in the format `(#<PR_NUMBER>)`.

Prioritize quests that map to still-unchecked quest-quality boxes in `docs/qa/v3.md`.

## Deterministic selection and anchoring rules (required)

1. Work within a single tree when possible.
2. For that tree, read `Exemplar anchors (checked in docs/qa/v3.md §4.5)` from
   `docs/design/v3-quest-quality-review.md`.
3. Extract only anchor quest ID tokens (`<tree>/<quest>`) and ignore any trailing commentary
   (for example fallback parentheticals); **only** anchors listed on that tree's
   `Exemplar anchors (checked in docs/qa/v3.md §4.5)` line are allowed exemplar IDs.
4. Verify each candidate anchor is actually checked in `docs/qa/v3.md` §4.5 before using it;
   unchecked anchors must not be used.
5. Determine each selected quest's checklist-rubric type by keyword (**first match wins**) and
   apply only that type's structure.
6. Prefer a mixed set of rubric types when selecting multiple quests (for example install +
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
- If quest flow changes materially, update paired docs in
  `frontend/src/pages/docs/md/<tree>.md`.
- Codex cannot create/edit binary images. If quality hardening needs new item imagery,
  reuse an existing in-repo image reference, note human follow-up for image dedup/replacement,
  and do not add new binary assets.
- Ensure requirements, rewards, and process references resolve to valid IDs.
- After hardening each selected quest, update only the corresponding checklist lines in
  `docs/design/v3-quest-quality-review.md` that are demonstrably satisfied by the diff.
- Do not check speculative or partially-complete items.
- Every newly checked line in `docs/design/v3-quest-quality-review.md` must end with the current
  PR reference token `(#<PR_NUMBER>)`.

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
2. `Unchecked QA boxes targeted`
   - Bullet list mapping each selected quest to the still-unchecked per-quest checkbox row(s) in
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
- Optimize for clearing still-unchecked quest-quality boxes in `docs/qa/v3.md` after manual human
  verification.
- Preserve Codex binary-asset limitations guidance (reuse image references; no new binary assets).
- Require quest-quality checklist maintenance in
  `docs/design/v3-quest-quality-review.md`: check only verifiably completed line items and append
  `(#<PR_NUMBER>)` to each newly checked line.

Constraints:

- Keep one `Main prompt` codeblock and one `Upgrade prompt` codeblock.
- Move non-reusable commentary into short notes outside those codeblocks.

Return the fully updated markdown document.
```

## Notes

- The backlog's exemplar anchors are the only allowed source for exemplar IDs.
- If commands/scripts change, update this prompt immediately to keep automation deterministic.
- Human follow-up is expected for any reused image references that should later be deduplicated or
  replaced with final art.
