# QA checklist → automated test coverage prompts for DSPACE

Use these prompts to iteratively link every v3 QA checklist item to concrete automated tests,
triage overlapping PRs, and keep the playbook current as commands or paths change.

## QA test coverage prompt
Use this to add linked automated tests to a small batch of unchecked QA items in `docs/qa/v3.md`
without churning the rest of the checklist.

```markdown
# DSPACE QA checklist → automated test coverage (small batch)

You are Codex working in the democratizedspace/dspace repository on branch v3. Your job is to pick a
small batch of unlinked QA checklist items and link each to real automated tests (existing or newly
added), keeping the diff minimal and stable.

## Item selection (default 3–5, hard cap 6)
- Open `docs/qa/v3.md` and find checklist bullets lacking linked tests at the end of the line.
  Heuristic: linked lines include patterns like `([<...>](...#L...))`; unlinked lines do not.
- Use `rg "\\([^[)]*\\]\\(" docs/qa/v3.md` to see linked styles; use `rg "\\[ \\]" docs/qa/v3.md`
  or `rg "^- \\[ \\]" docs/qa/v3.md` to scan unchecked items, then visually pick ones missing links.
- Choose deterministic, automatable items first (route loads, visible UI states, schema/consistency
  checks, import/export flows). Avoid flaky/subjective checks unless you can add a mechanical proxy.
- If an item is mostly human judgment, add the best partial automation you can (lint-like checks,
  placeholder guards, schema assertions) and note any remaining manual gap in the PR summary.

## For each chosen item: find or create coverage
1) Search for existing tests that already validate the behavior.
   - Use `rg "<keyword>" frontend/e2e tests` and `rg "<keyword>" tests` as quick entry points.
   - Likely homes: `frontend/e2e/*.spec.ts` (Playwright), `tests/*.test.ts` (root),
     any nearby `__tests__` or `*.test.ts` you discover. Prefer colocated suites that already
     cover the feature.
   - If a match exists and is sufficient, just link it—no code changes needed.
2) If coverage is missing, add a minimal, deterministic test in the most appropriate layer:
   - Prefer unit/integration where possible; only use Playwright when verifying routed UI behavior.
   - Reuse existing fixtures/utilities; avoid refactors and file renames.
   - Keep selectors stable (data-testid where available), avoid arbitrary sleeps, and keep the scope
     tight to the checklist claim.
   - Keep churn small: only touch the tests needed for the chosen items and the checklist links.

## Append links to `docs/qa/v3.md` (required)
- For every newly covered checklist bullet, append test link(s) at the end of the same line using
  the existing style: `([<file:short description>](../<relative/path>#Lx))`. Multiple links are
  comma-separated inside one set of parentheses.
- Paths must be relative from `docs/qa/` (where `v3.md` lives) and match the existing linked entries
  in that file.
- Keep the checklist text intact; only add links and, if needed, clarify the item minimally so the
  link aligns with the assertion.

## Commands to inspect and run
- Inspect `package.json`, `frontend/package.json`, and `.github/workflows/ci.yml` to confirm the
  expected commands for the touched test types.
- Run the relevant subset locally (e.g., the specific unit/integration suite or Playwright shard
  you changed). Record every command and result in the PR summary. Examples (adjust to what you
  touched):
  - Unit/integration: `npm test -- tests/<name>.test.ts`
  - Root integration: `npm run test:ci -- --runInBand` or narrower if allowed by scripts
  - Playwright (from `frontend/`): `npm run test:e2e -- <file-pattern>` or
    `npx playwright test <file>`
- If formatting or lint rules apply to touched areas, run the narrowest required formatter/linter.

## Diff boundaries
- Default batch size 3–5 items; never exceed 6 per run. Do not refactor unrelated code.
- Do not rename files unless absolutely necessary for the new test; prefer additive edits.
- Touch only the selected checklist lines plus the minimal tests and any required helpers/fixtures.

## PR-ready output
- Summarize exactly which checklist items you covered (quote the checklist text) and the tests
  linked or added (with file paths).
- List all commands you ran with their outcomes.
- Note any partial automation gaps for judgment-heavy items.
```

## Merge compatibility prompt
Use this when multiple QA test coverage PRs land at once and you need to surface overlaps or likely
conflicts before merging.

```markdown
I have multiple candidate PRs that came out of a Codex task
(`docs/prompts/codex/qa-test-coverage.md`), and I want to know which ones can be merged together
safely (minimal merge conflicts, no duplicated edits).

Here are the PRs:
- <PR URL 1>
- <PR URL 2>
- <PR URL 3>
- <PR URL 4>

Please use your GitHub connector to inspect each PR.

What I need:
- For each PR, summarize what it changes at a high level.
- List the files changed in each PR.
- Compute overlaps between PRs:
  - exact file-path overlaps (same file touched by multiple PRs)
  - obvious content overlaps even if file paths differ (e.g., same checklist line or test file
    sections being edited)
- Call out overlaps likely to cause merge conflicts or redundant work (especially shared suites like
  `frontend/e2e/*.spec.ts`, root `tests/*.test.ts`, and `docs/qa/v3.md`).
- Recommend the set(s) of PRs that can be merged together with minimal to no conflicts. If any
  conflicts are likely, say which file(s) they’ll be in.
- For PR pairs that are not safe to merge as-is, briefly explain why.

Output format:
- A short “safe to merge together” list (pairs or groups)
- A short “not safe without manual reconciliation” list, with the overlap called out
- A compact overlap matrix or pairwise overlap summary (file paths are enough)
```

## Upgrade prompt
Use this when the QA test coverage prompt drifts, new guardrails land, or the merge-compatibility
guidance needs refreshing.

```markdown
# Upgrade the QA test coverage prompt

You are Codex reviewing `docs/prompts/codex/qa-test-coverage.md`. Improve the QA coverage prompt and
its companion merge-compatibility guidance so they stay copy-paste ready, evergreen, and precise.

## Instructions
- Re-audit each section for clarity, duplication, and alignment with current repository realities
  (commands, paths, test suites).
- Tighten language while preserving the mission: add linked tests to small batches of unlinked QA
  checklist items with minimal churn.
- Update guardrails based on recent CI expectations or test layout changes; ensure command examples
  and paths are accurate.
- Keep the output as a single fenced code block replacing the existing prompt when done.
```
