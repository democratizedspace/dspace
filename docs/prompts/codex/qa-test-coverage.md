# QA checklist → automated test coverage prompts for DSPACE

Use these prompts to iteratively append automated test links to the v3 QA checklist while keeping
diffs small, tests stable, and outputs reviewable.

## QA test coverage prompt
Use this when you want to add automated test links to a small batch of unlinked QA checklist items
in `docs/qa/v3.md`.

```markdown
# DSPACE QA checklist → automated test coverage (small-batch)

You are Codex working in the democratizedspace/dspace repository (branch v3). Your goal is to take
3–5 unlinked QA checklist items (hard cap: 6) from `docs/qa/v3.md` and, for each, add reliable
automated test coverage and append test links to the checklist line in-place.

## Mission and scope
- Touch only the chosen batch of checklist lines plus the tests needed to cover them. Avoid
  refactors, renames, or broad churn.
- Prefer deterministic, automatable items (routes load, UI states, schema validations,
  import/export, config consistency). If an item needs human judgment, add the best mechanical
  proxy test you can and call out any remaining manual gap in the PR summary.

## How to select items (algorithm)
1) Open `docs/qa/v3.md` and list checklist bullets lacking linked tests. Heuristic: linked entries
   end with `([<...>](...#L...))`; unlinked lines lack that pattern.
   - Quick scan helpers:
     - `rg -n "\(\[" docs/qa/v3.md` to see linked lines.
     - `rg -n "\[ \]" docs/qa/v3.md` to see all checkboxes, then visually spot ones missing
       trailing links.
2) Choose 3–5 items (max 6) that are deterministic and automatable. Prefer items you can prove via
   existing routes, schema checks, or stable UI states.
3) If multiple candidates look similar, prefer ones near existing linked items so new links group
   sensibly. Skip items that would require large refactors.

## For each selected item
1) Locate existing coverage first:
   - Search likely homes with `rg -n "<keyword>" frontend/e2e tests`, `rg -n "<keyword>" tests`,
     and other discovered test dirs (e.g., `frontend/tests`, `frontend/__tests__`).
   - Check route/page code to anchor expectations: `rg -n "<slug or text>" frontend/src/pages` and
     related components.
   - If a test already covers the behavior, link to it (no new test needed unless coverage is
     insufficient).
2) If missing, add the smallest stable test:
   - Favor unit/integration (`tests/*.test.ts`, `frontend/tests/*.test.ts`) for logic or SSR
     invariants. Use Playwright (`frontend/e2e/*.spec.ts`) only for real UI/route behavior that
     cannot be validated headless.
   - Keep tests deterministic: use fixed data, avoid time-based waits, prefer role/data-testid
     selectors, and reuse existing helpers/fixtures.
   - Add only what’s required for the checklist claim; avoid broad rewrites.
3) Append test link(s) to the checklist line in `docs/qa/v3.md`:
   - Pattern: `([<file:short description>](relative/path#Lx))`; multiple links comma-separated in
     one set of parentheses.
   - Paths are relative to `docs/qa/v3.md` (live under `docs/qa/`). Match the existing style and
     keep descriptions concise and specific.

## Verification and commands
- Inspect `package.json`, `frontend/package.json`, and `.github/workflows` to confirm which commands
  cover the tests you touched (e.g., Playwright vs. unit vs. lint). Prefer the narrowest relevant
  subset; if unsure, run the broader suite for the changed area.
- Run the required commands locally (at least the runners that cover new/changed tests) and record
  each command and result in the PR summary. Example discovery commands:
  - `cat package.json | jq '.scripts'`
  - `cat frontend/package.json | jq '.scripts'`

## PR-ready output
- In the PR summary, list the exact checklist items updated (copy the text) and the tests linked or
  added for each (with file paths).
- List every command you ran and its result.
- Note any partial automation gaps if human judgment remains.

## Guardrails
- Do not edit unrelated checklist items. Do not add binaries. Keep diffs focused and reviewable.
- Use existing formatting (Prettier/ESLint) appropriate to the touched area; do not reformat other
  files.
- Keep line width ≤100 chars and avoid changing markdown outside the targeted lines.
```

## Merge compatibility prompt
Use this when multiple QA test coverage PRs land at once and you need to surface overlaps or likely
conflicts before merging.

```markdown
I have multiple candidate PRs that came out of a Codex task
(`docs/prompts/codex/qa-test-coverage.md`), and I want to know which ones can be merged together
without conflicts or redundant edits.

Here are the PRs:
- <PR URL 1>
- <PR URL 2>
- <PR URL 3>
- <PR URL 4>

Please use your GitHub connector to inspect each PR.

What I need:
- For each PR, summarize what it changes at a high level (QA checklist lines, tests added/updated,
  docs adjustments).
- List the files changed in each PR.
- Compute overlaps:
  - Exact file-path overlaps (same file touched by multiple PRs).
  - Obvious content overlaps even if file paths differ (e.g., same checklist line updated by two
    PRs, or the same test file edited in different suites).
- Recommend which PRs can merge together safely versus which need manual reconciliation, with a
  brief reason for risky pairs.

Output format:
- A short “safe to merge together” list (pairs or groups).
- A short “not safe without manual reconciliation” list with the overlap called out.
- A compact overlap matrix or pairwise summary (file paths are enough).
```

## Upgrade prompt
Use this when the QA test coverage prompt drifts or repository commands/tests change.

```markdown
# Upgrade the QA test coverage prompt

You are Codex reviewing `docs/prompts/codex/qa-test-coverage.md`. Improve the QA test coverage
prompt and its companion merge-compatibility guidance so they stay copy-paste ready, evergreen, and
aligned with the current repository.

## Instructions
- Re-audit the prompt for clarity, duplication, and correctness. Tighten language where possible.
- Verify all referenced paths, commands, and heuristics match the current repo (check
  `docs/qa/v3.md`, test locations, package scripts, and CI workflows).
- Keep the small-batch and deterministic-test emphasis. Update search/selection guidance if better
  heuristics emerge.
- Output a single fenced code block replacing the existing prompt when done.
```
