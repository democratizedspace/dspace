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

**Fail-closed bookkeeping invariant**: any PR that edits one or more
`frontend/src/pages/quests/json/<tree>/<quest>.json` files MUST also modify
`docs/design/v3-quest-quality-review.md` in the same PR for every touched quest ID. Non-compliant
PRs must not be review-ready/opened for review.

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
- **Bookkeeping-first workflow is mandatory**: after selecting quests and before deep JSON edits,
  open each selected quest block in `docs/design/v3-quest-quality-review.md`, choose which
  checklist lines this PR intends to satisfy, and carry that plan through to final checklist-line
  updates with canonical PR tags.
- For EACH touched quest ID in this PR, perform all bookkeeping steps in
  `docs/design/v3-quest-quality-review.md`:
  - find that quest's checklist block;
  - update at least one relevant checklist line item;
  - append canonical PR tags using exact format `(PR #<number>)` or
    `(PR #<number1>, #<number2>)` with a single `PR` prefix;
  - if a line already has PR tags, append the new PR as `, #<number>` inside that same
    parenthetical;
  - only flip `[ ]` to `[x]` when this PR's diff clearly proves the line item is satisfied;
  - keep `[ ]` when evidence is ambiguous, but still add canonical PR tag(s) for traceability;
  - do not use placeholder tags (for example `PR #0000`, `PR TBD`, `PR ???`).
- If the final PR number is not yet available while drafting changes, it is acceptable to open a
  draft PR only to obtain the number, then immediately update bookkeeping lines to use canonical
  real PR tag(s) before requesting review.
- **Mandatory completion gate for this prompt**: any Codex task run from this prompt that modifies
  one or more `frontend/src/pages/quests/json/<tree>/<quest>.json` files must include matching
  checklist updates in `docs/design/v3-quest-quality-review.md` for those quest IDs in the same
  PR. A PR is non-compliant if it hardens quests but does not update at least one corresponding
  checklist line with canonical PR tag(s) for every touched quest ID.
- Retroactive bookkeeping is allowed in the same PR when older hardening PRs are missing checklist
  PR tags, but keep these edits laser-focused to the relevant quest blocks and do not flip
  checkbox states unless conclusively evidenced.
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
7. Bookkeeping validation (required, fail-closed): for each selected quest ID, confirm its block
   exists in `docs/design/v3-quest-quality-review.md` and at least one relevant checklist line in
   that block contains the current PR number in canonical form. Example shell pattern (adapt quest
   IDs and PR number): `PR_NUM=<current_pr_number>; for q in <tree>/<quest1> <tree>/<quest2>; do rg -n "^- ${q}\\b" docs/design/v3-quest-quality-review.md >/dev/null || { echo "Missing quest block: $q"; exit 1; }; rg -n "^- ${q}\\b" -A 40 docs/design/v3-quest-quality-review.md | rg -q "\\(PR (#[0-9]+, )*#${PR_NUM}(, #[0-9]+)*\\)" || { echo "Missing PR tag for $q"; exit 1; }; done`

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
     appended canonical PR tag(s).
   - For each touched quest ID, quote at least one changed checklist line verbatim that includes
     the final checkbox state and canonical PR tag.
   - If any touched quest ID is missing from this section, the PR is non-compliant.
   - If no line items were changed, or if not all touched quest IDs are represented in these
     checklist update bullets, explicitly output `BLOCKED (non-compliant with prompt)` and do not
     open the PR until checklist updates are complete.
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
- Preserve and strengthen fail-closed bookkeeping invariants for
  `docs/design/v3-quest-quality-review.md`: any PR that edits one or more
  `frontend/src/pages/quests/json/<tree>/<quest>.json` files must also update checklist lines in
  the same PR for every touched quest ID, or the PR is non-compliant and must not be marked
  review-ready/opened for review.
- Make per-quest bookkeeping explicit and non-ambiguous: for EACH touched quest ID, find the quest
  block, update at least one relevant checklist line, append canonical PR tag(s) using
  `(PR #<number>)` or `(PR #<number1>, #<number2>)` (single `PR` prefix), append additional tags
  as `, #<number>` inside the same parenthetical, and only flip `[ ]` to `[x]` when evidence in
  the same PR clearly proves completion.
- Explicitly forbid placeholder PR tags (for example `PR #0000`, `PR TBD`).
- Clarify allowed PR-number timing: if needed, a draft PR may be opened only to obtain the PR
  number, but canonical real PR tags must be applied before requesting review.
- Require a bookkeeping-first workflow: after selecting quests and before deep JSON edits, open
  the relevant checklist blocks and plan intended checklist outcomes.
- Require bookkeeping validation commands that verify each selected quest block exists and includes
  the current PR number in canonical tag form on at least one relevant checklist line.
- Preserve and tighten required PR summary section `Checklist box updates`: quote at least one
  changed checklist line per touched quest ID, and require `BLOCKED (non-compliant with prompt)`
  when either no checklist lines changed or not all touched quests are represented.
- Preserve retroactive-bookkeeping guidance: allow adding missing historical PR tags in the same
  PR, keep edits laser-focused to relevant quest blocks, and do not flip checkbox states unless
  conclusively evidenced.
- Optimize for clearing still-unchecked quest-quality boxes in `docs/qa/v3.md` after manual human
  verification.
- Preserve Codex binary-asset limitations guidance (reuse image references; no new binary assets).
- Preserve guidance to keep quest IDs stable unless correcting a proven canonical mismatch.

Constraints:

- Keep one `Main prompt` codeblock and one `Upgrade prompt` codeblock; do not add any other
  fenced code blocks.
- Move non-reusable commentary into short notes outside those codeblocks.
- Preserve the required eight-section PR summary headings and order.

Return the fully updated markdown document.
```

## Notes

- The backlog's exemplar anchors are the only allowed source for exemplar IDs.
- Keep these prompts synchronized with current script names and file paths.
