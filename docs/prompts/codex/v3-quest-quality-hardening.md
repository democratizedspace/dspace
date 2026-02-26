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

**Fail-closed invariant (non-optional completion gate):** if this PR edits one or more
`frontend/src/pages/quests/json/<tree>/<quest>.json` files, it MUST also modify
`docs/design/v3-quest-quality-review.md` in the same PR with per-quest checklist traceability.
Non-compliant PRs must not be opened.

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

## Bookkeeping-first workflow (required)

1. After selecting quest IDs and before deep JSON edits, open each selected quest block in
   `docs/design/v3-quest-quality-review.md` and identify which checklist line(s) you intend to
   satisfy or tag in this PR.
2. Keep that per-quest bookkeeping plan in lockstep with implementation so checklist edits are not
   deferred to the end.
3. Before opening the PR, ensure each touched quest ID ends with updated checklist line(s) and
   canonical PR tag(s) in the same file.

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
- **Fail-closed bookkeeping invariant:** any PR that edits one or more
  `frontend/src/pages/quests/json/<tree>/<quest>.json` files MUST also modify
  `docs/design/v3-quest-quality-review.md` in the same PR. If not, do not open the PR.
- For EACH touched quest ID, perform explicit bookkeeping in
  `docs/design/v3-quest-quality-review.md`:
  1. Find that quest ID block.
  2. Update at least one relevant checklist line item.
  3. Append canonical PR tag(s) in exactly one parenthetical using either `(PR #<number>)` or
     `(PR #<number1>, #<number2>)` format (single `PR` prefix only).
  4. If a PR parenthetical already exists, append the current PR as `, #<number>` inside the same
     parenthetical.
  5. Flip `[ ]` -> `[x]` only when this PR's diff clearly proves that line item is satisfied.
  6. If evidence is ambiguous, keep checkbox state unchanged and still add canonical PR tag(s).
- Placeholder/non-canonical tags are forbidden (for example `PR #0000`, `PR TBD`, `PR #????`).
- **Retroactive bookkeeping (allowed, tightly scoped):** if older hardening PRs are discovered as
  missing checklist PR tags, you may add those missing canonical PR tags in this same PR, but keep
  edits laser-focused to the relevant quest blocks and do not flip checkbox states unless
  conclusively evidenced.
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
7. Bookkeeping validation for selected quest IDs (replace `PRNUM` and IDs): `PRNUM=<current_pr_number>; for q in <tree>/<quest1> <tree>/<quest2>; do awk -v q="$q" -v p="$PRNUM" 'BEGIN{inblock=0;seen=0;tag=0} /^### /{inblock = index($0,q)>0} {if(inblock){seen=1; if($0 ~ /\(PR #[0-9]+(, #[0-9]+)*\)/ && ($0 ~ "\\(PR #" p "\\)" || $0 ~ ", #" p "\\)")) tag=1}} END{if(!seen){print "Missing quest block for " q; exit 1} if(!tag){print "Missing canonical PR tag for " q " with PR #" p; exit 1}}' docs/design/v3-quest-quality-review.md || exit 1; done`

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
     canonical appended PR tag(s).
   - Include at least one changed checklist line bullet for each touched quest ID. If any touched
     quest ID is missing from section 8, the PR is non-compliant.
   - If no checklist lines were changed **or** not all touched quests are represented, explicitly
     output `BLOCKED (non-compliant with prompt)` and do not open the PR until fixed.
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
  - Any PR that edits one or more `frontend/src/pages/quests/json/<tree>/<quest>.json` files MUST
    also modify `docs/design/v3-quest-quality-review.md` in the same PR.
  - Non-compliant PRs must not be opened.
  - For EACH touched quest ID, require explicit bookkeeping: find quest block, update at least one
    relevant checklist line, add canonical PR tag(s) in one parenthetical using single `PR`
    prefix (`(PR #1234)` or `(PR #1234, #5678)`), append new tags as `, #<number>` within the
    same parenthetical, and only flip `[ ]` to `[x]` when clearly evidenced by the same PR diff.
  - Forbid placeholder tags (for example `PR #0000`, `PR TBD`).
- Require a bookkeeping-first workflow: after quest selection and before deep JSON edits, open the
  checklist blocks for selected quests and plan intended checklist updates.
- Require concrete bookkeeping validation in Validation commands so each selected quest block is
  present and contains the current PR number in canonical tag format on at least one relevant
  checklist line.
- Strengthen PR summary section `Checklist box updates` so it must quote at least one changed
  checklist line per touched quest ID; mark `BLOCKED (non-compliant with prompt)` if no checklist
  lines changed or if not all touched quests are represented.
- Preserve retroactive bookkeeping guidance without churn: allow backfilling missing PR tags for
  older hardening PRs in relevant quest blocks only, without flipping checkboxes unless
  conclusively evidenced.
- Optimize for clearing still-unchecked quest-quality boxes in `docs/qa/v3.md` after manual human
  verification.
- Preserve guidance to keep quest IDs stable and preserve Codex binary-asset limitations guidance
  (reuse image references; no new binary assets).

Constraints:

- Keep one `Main prompt` codeblock and one `Upgrade prompt` codeblock; do not add any other
  fenced code blocks.
- Move non-reusable commentary into short notes outside those codeblocks.
- Keep the required 8-section PR summary format with the same headings and order.

Return the fully updated markdown document.
```

## Notes

- The backlog's exemplar anchors are the only allowed source for exemplar IDs.
- Keep these prompts synchronized with current script names and file paths.
