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

**Fail-closed invariant (non-optional completion gate):** any PR that edits one or more
`frontend/src/pages/quests/json/<tree>/<quest>.json` files MUST also modify
`docs/design/v3-quest-quality-review.md` in the same PR with per-quest checklist traceability for
all touched quest IDs. Non-compliant PRs must not be opened.

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
- **Bookkeeping-first workflow (required):** after selecting quests and before deep JSON edits,
  open each selected quest's checklist block in `docs/design/v3-quest-quality-review.md` and plan
  which line(s) this PR intends to satisfy; finish the PR with those line updates and canonical PR
  tags present.
- For EACH touched quest ID, perform checklist bookkeeping in
  `docs/design/v3-quest-quality-review.md`:
  - find that quest ID's block;
  - update at least one relevant checklist line item in that block;
  - append PR tags using canonical format only: `(PR #<number>)` or
    `(PR #<number1>, #<number2>)` (single `PR` prefix);
  - if a line already has canonical tags, append the new PR as `, #<number>` inside the same
    parenthetical;
  - flip `[ ]` -> `[x]` only when this PR's diff clearly proves that line item is satisfied;
  - when evidence is not conclusive, keep `[ ]` and add/append canonical PR tags for traceability.
- Placeholder or non-canonical tags are forbidden (for example `PR #0000`, `PR TBD`, `#1234`
  without `PR`, or multiple parentheticals for PR tags on one line).
- **Mandatory completion gate for this prompt:** any Codex task run from this prompt that modifies
  one or more `frontend/src/pages/quests/json/<tree>/<quest>.json` files must also include
  matching checklist updates in `docs/design/v3-quest-quality-review.md` for those quest IDs in
  the same PR. Non-compliant PRs must not be opened.
- **Retroactive bookkeeping (allowed, focused):** if older hardening PR(s) are missing checklist
  PR tags, you may add missing canonical PR tag(s) in the same PR, but keep edits laser-focused to
  relevant quest blocks only and do not flip checkbox states unless conclusively evidenced.
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
7. Bookkeeping validation (required): after applying changes and knowing current PR number `<pr>`,
   verify each selected quest block exists and has at least one relevant checklist line containing
   canonical reference to this PR number (either `(PR #<pr>)` or `, #<pr>` inside canonical
   parenthetical), for example:
   `for q in <tree/quest1> <tree/quest2>; do rg -n "$q" docs/design/v3-quest-quality-review.md >/dev/null || { echo "Missing quest block: $q"; exit 1; }; done && rg -n "^\s*- \[[ x]\].*\(PR #[0-9]+(, #[0-9]+)*\)" docs/design/v3-quest-quality-review.md | rg "(#<pr>\)|, #<pr>\))"`

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
     canonical PR tag(s).
   - For every touched quest ID, include at least one quoted changed checklist line from that
     quest's block, verbatim, showing final checkbox state plus canonical PR tag(s).
   - If any touched quest ID is missing from this section, the PR is non-compliant.
   - If no checklist lines were changed, or if not all touched quest IDs are represented, output
     `BLOCKED (non-compliant with prompt)` and do not open the PR.
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
  `docs/design/v3-quest-quality-review.md` with fail-closed behavior: any PR that edits
  `frontend/src/pages/quests/json/<tree>/<quest>.json` must also update checklist bookkeeping for
  every touched quest ID in the same PR, and non-compliant PRs must not be opened.
- Preserve explicit per-quest bookkeeping steps: find each touched quest block, update at least
  one relevant line, use canonical tags `(PR #<number>)` or `(PR #<number1>, #<number2>)`, append
  additional PRs as `, #<number>` in the same parenthetical, and only flip `[ ]` to `[x]` when the
  same PR conclusively proves completion.
- Keep placeholder/non-canonical tags forbidden (`PR #0000`, `PR TBD`, etc.).
- Keep bookkeeping-first workflow requirement (plan checklist lines before deep JSON edits).
- Keep retroactive bookkeeping guidance: allow focused PR-tag backfills for older missing
  traceability, but avoid checkbox flips without conclusive evidence and avoid unrelated churn.
- Preserve required validation commands, including an explicit bookkeeping validation check that
  confirms selected quest blocks exist and include the current PR number in canonical PR tags.
- Preserve required 8-section PR summary format and strengthen section 8 so each touched quest ID
  is represented with at least one verbatim changed checklist line containing final checkbox state
  and canonical PR tags, with fail-closed `BLOCKED (non-compliant with prompt)` behavior when
  missing.
- Optimize for clearing still-unchecked quest-quality boxes in `docs/qa/v3.md` after manual human
  verification.
- Preserve guidance to keep quest IDs stable and preserve Codex binary-asset limitations guidance
  (reuse image references; no new binary assets).

Constraints:

- Keep one `Main prompt` codeblock and one `Upgrade prompt` codeblock; do not add any other
  fenced code blocks.
- Move non-reusable commentary into short notes outside those codeblocks.

Return the fully updated markdown document.
```

## Notes

- The backlog's exemplar anchors are the only allowed source for exemplar IDs.
- Keep these prompts synchronized with current script names and file paths.
