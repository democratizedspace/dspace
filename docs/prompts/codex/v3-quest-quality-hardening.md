# v3 quest quality hardening prompts

Use these copy/paste prompts to harden v3 quest quality and clear remaining unchecked quest-quality
items in `docs/qa/v3.md` through deterministic, auditable updates.

## Main prompt

```markdown
# DSPACE v3 quest quality hardening (unchecked QA boxes -> deterministic parity)

You are Codex working in `democratizedspace/dspace`.

## Objective

Select 3-8 quests from `docs/design/v3-quest-quality-review.md` under
**Problematic quests to prioritize (with improvement checklist)** and harden them to parity with
verified checked exemplars in `docs/qa/v3.md` §4.5.

Prioritize quests that most directly map to still-unchecked quest-quality boxes in
`docs/qa/v3.md` §4.5 and are ready to be manually verified by a human after your PR lands.

## Deterministic selection and anchoring rules (required)

1. Build the candidate set only from unchecked per-quest boxes in `docs/qa/v3.md` §4.5 (not
   tree-level headers).
2. Work within one quest tree when possible; if one tree cannot provide 3 quests, add the minimum
   number of additional trees required.
3. For each selected tree, read `Exemplar anchors (checked in docs/qa/v3.md §4.5)` from
   `docs/design/v3-quest-quality-review.md`.
4. Extract only anchor ID tokens matching `<tree>/<quest>`; ignore trailing commentary and any
   fallback text.
5. Verify each anchor quest is actually checked in `docs/qa/v3.md` §4.5 before using it.
   Unchecked anchors are forbidden.
6. Determine each selected quest's checklist-rubric type by keyword; **first match wins** and only
   that rubric structure may be applied.
7. When selecting multiple quests, prefer a mixed rubric set (for example install + measure +
   log/monitor) to maximize unchecked-box clearance coverage.

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
- For each selected quest in `docs/design/v3-quest-quality-review.md`, update checklist boxes only
  when corresponding work is verifiably complete **and** quest JSON hardening for that quest is in
  the same PR:
  - switch `[ ]` to `[x]` only for completed items;
  - append PR tags at end-of-line;
  - canonical multi-PR format must stay a single parenthetical with one `PR` prefix:
    `(PR #<number1>, #<number2>, #<number3>)`;
  - if PR tags already exist, append the new PR as `, #<number>` inside that same parenthetical;
  - leave boxes unchecked when evidence is ambiguous;
  - bookkeeping-only follow-up PRs (no quest JSON hardening changes) may edit PR tags but **must
    not** change any `[ ]`/`[x]` checkbox state.
- If quest flow changes materially, update paired docs in `frontend/src/pages/docs/md/<tree>.md`.
- Codex cannot create/edit binary images. If hardening needs new imagery, reuse an existing
  in-repo image reference, record human follow-up for dedup/replacement, and do not add new binary
  assets.
- Ensure requirements, rewards, and process references resolve to valid IDs.

## Validation commands (required)

1. `npm run lint`
2. `npm run type-check`
3. `npm run build`
4. `npm run test:ci`
5. `npm run link-check` (required when docs/markdown changed)
6. `for f in frontend/src/pages/quests/json/<tree>/*.json; do node scripts/validate-quest.js "$f" || exit 1; done`

## REQUIRED output format for your PR summary

Output exactly these sections in order:

1. `Selected quests`
   - Bullet list of selected quest IDs.
2. `Unchecked QA boxes targeted`
   - Bullet list mapping each selected quest to the still-unchecked per-quest checkbox row(s) in
     `docs/qa/v3.md` §4.5, using exact checkbox label text copied verbatim.
   - For each mapped checkbox, include a nearest breadcrumb (for example
     `§4.5 > Quest quality > <tree>`).
3. `Exemplar anchors used`
   - Bullet list mapping each selected quest to verified anchor ID(s).
4. `Before/after structural summary`
   - Per quest: branches, evidence gates, and troubleshooting/safety paths added.
5. `Tests and checks run`
   - Bullet list of commands and pass/fail status.
6. `Asset follow-ups`
   - Any image reuse plus required human dedup/replacement steps, or explicit `None`.
7. `Follow-ups`
   - Deferred work or explicit `None`.
8. `Checklist box updates`
   - Bullet list of every changed line item in `docs/design/v3-quest-quality-review.md`, quoted
     verbatim with final checkbox state and final PR tag parenthetical.
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
- Optimize for clearing still-unchecked quest-quality boxes in `docs/qa/v3.md` after manual human
  verification.
- Preserve Codex binary-asset limitations guidance (reuse image references; no new binary assets).

Constraints:

- Keep one `Main prompt` codeblock and one `Upgrade prompt` codeblock.
- Move non-reusable commentary into short notes outside those codeblocks.

Return the fully updated markdown document.
```

## Notes

- Exemplar IDs are allowed only from each tree's `Exemplar anchors` line in
  `docs/design/v3-quest-quality-review.md`, and only after checked-state verification in
  `docs/qa/v3.md` §4.5.
- Keep this file synchronized with live repository commands/scripts whenever automation changes.
- If image references are reused, call out required human dedup/replacement follow-up in the PR
  summary.
