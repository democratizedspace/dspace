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

Fail-closed bookkeeping invariant: if this PR edits one or more
`frontend/src/pages/quests/json/<tree>/<quest>.json` files, this same PR MUST also modify
`docs/design/v3-quest-quality-review.md` with per-quest checklist traceability updates for every
touched quest ID. Non-compliant PRs must not be opened.

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
- Bookkeeping-first workflow (required): after selecting quests and before deep JSON edits,
  open each selected quest block in `docs/design/v3-quest-quality-review.md` and pre-plan which
  checklist line(s) this PR intends to satisfy; then ensure the PR ends with updated checklist
  line(s) and canonical PR tag(s) for each touched quest ID.
- Per-quest bookkeeping requirement (required for EVERY touched quest ID):
  - locate that quest's block in `docs/design/v3-quest-quality-review.md`;
  - update at least one relevant checklist line item in that block;
  - append PR tags in canonical format exactly as `(PR #<number>)` or
    `(PR #<number1>, #<number2>)` with a single `PR` prefix;
  - if a line already has canonical PR tags, append the current PR as `, #<number>` inside the
    same parenthetical;
  - only flip `[ ]` to `[x]` when the PR's diff clearly proves the line item is satisfied;
  - leave `[ ]` unchanged when evidence is ambiguous;
  - placeholder/non-canonical tags are forbidden (for example `PR #0000`, `PR TBD`, `#TBD`).
- Mandatory completion gate (fail-closed): any Codex task run from this prompt that modifies one
  or more `frontend/src/pages/quests/json/<tree>/<quest>.json` files MUST include matching
  checklist updates in `docs/design/v3-quest-quality-review.md` for those quest IDs in the same
  PR. Non-compliant PRs must not be opened.
- Retroactive bookkeeping (no churn): if older hardening PR(s) are discovered missing checklist
  PR tags, add focused tag backfills in this PR only within relevant quest block(s); do not flip
  checkbox states unless conclusively evidenced by available diffs.
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
7. Bookkeeping validation (required): for each selected quest ID, verify that
   `docs/design/v3-quest-quality-review.md` contains that quest block and at least one checklist
   line in that block tagged with the current PR number. Inline shell snippet pattern (adapt the
   quest IDs/PR number): `PR_NUM=<current_pr_number>; for q in <tree>/<quest1> <tree>/<quest2>; do rg -n "$q" docs/design/v3-quest-quality-review.md >/dev/null || { echo "missing quest block: $q"; exit 1; }; rg -n "^\s*- \[[ x]\].*\(PR #[0-9]+(, #[0-9]+)*\)" docs/design/v3-quest-quality-review.md | rg -n "#${PR_NUM}(\)|,)" >/dev/null || { echo "missing PR tag for $q"; exit 1; }; done`

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
   - Quote at least one changed checklist line per touched quest ID. If any touched quest ID is
     missing from this section, the PR is non-compliant.
   - If either (a) no checklist lines were changed, or (b) not all touched quest IDs are
     represented in this section, explicitly output
     `BLOCKED (non-compliant with prompt)` and do not open the PR until fixed.
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
  `docs/design/v3-quest-quality-review.md`:
  - any PR editing one or more `frontend/src/pages/quests/json/<tree>/<quest>.json` files MUST
    also modify checklist lines for every touched quest ID in the same PR;
  - non-compliant PRs must not be opened;
  - per touched quest ID, require at least one relevant checklist line update with canonical PR
    tags `(PR #<number>)` or `(PR #<number1>, #<number2>)` (single `PR` prefix);
  - allow appending `, #<number>` inside an existing canonical parenthetical;
  - forbid placeholder tags (for example `PR #0000`, `PR TBD`);
  - only flip `[ ]` to `[x]` when clearly evidenced by the same PR diff.
- Require bookkeeping-first workflow: after quest selection and before deep JSON edits, open
  selected quest checklist blocks and plan intended line-item updates.
- Require concrete bookkeeping validation commands that confirm, for each selected quest ID,
  presence of the quest block and presence of the current PR number on at least one relevant
  checklist line in that block.
- Preserve and tighten section #8 `Checklist box updates` requirements in the 8-section PR summary:
  - quote at least one changed checklist line per touched quest ID, verbatim, including final
    checkbox state and canonical PR tag(s);
  - mark PR `BLOCKED (non-compliant with prompt)` if no checklist lines changed OR if not all
    touched quests are represented.
- Preserve retroactive bookkeeping guidance without churn: allow focused PR-tag backfills for
  older missing traceability, but do not flip checkbox states without conclusive evidence and do
  not edit unrelated quest blocks.
- Optimize for clearing still-unchecked quest-quality boxes in `docs/qa/v3.md` after manual human
  verification.
- Preserve guidance about avoiding new binary assets and keeping quest IDs stable.

Constraints:

- Keep one `Main prompt` codeblock and one `Upgrade prompt` codeblock; do not add any other
  fenced code blocks.
- Move non-reusable commentary into short notes outside those codeblocks.

Return the fully updated markdown document.
```

## Notes

- The backlog's exemplar anchors are the only allowed source for exemplar IDs.
- Keep these prompts synchronized with current script names and file paths.
