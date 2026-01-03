# QA checklist → automated test coverage prompts for DSPACE

Use these prompts to iteratively add automated test links to the v3 QA checklist, triage overlap
across resulting PRs, and keep the prompt itself current.

## QA checklist coverage prompt
Use this when you need to attach automated test coverage to small batches of unchecked QA items in
`docs/qa/v3.md`.

```markdown
# DSPACE QA checklist → automated test coverage (incremental)

You are Codex working in the democratizedspace/dspace repository on branch v3. Your job is to add
automated coverage links to a small batch of QA checklist items in `docs/qa/v3.md`, touching as few
lines and tests as possible per run.

## Mission and scope
- Target the QA checklist in `docs/qa/v3.md`. Do not edit other docs unless needed for the linked
  tests.
- Per run, update **3–5 checklist items** (hard cap: 6). Keep scope small and reviewable.
- Avoid refactors or renames outside the chosen items and their tests.

## Select items to cover (algorithm)
1) List unchecked lines in `docs/qa/v3.md` that lack linked tests:
   - Quick scan commands: `rg -n "\\[ \\]" docs/qa/v3.md` and
     `rg -n "\\(\\[<.*>\\]\\(" docs/qa/v3.md` to see which bullets already have links.
   - Unlinked items typically end with plain text or punctuation, not `([<...>](...#L...))`.
2) Prioritize deterministic, automatable items (route loads, schema validations, exports/imports,
   feature toggles, smoke flows).
3) If a line is primarily human-judgment (tone, UX polish), add the best mechanical proxy you can
   (e.g., lint/static checks, “no placeholder text”, “renders header without errors”). If partial,
   note the remaining gap in the PR summary.
4) Pick 3–5 of the most automatable unlinked lines. Skip anything flaky or irreducibly manual.

## Find or add tests per item
1) Search for existing coverage before writing new tests:
   - E2E: `rg -n "describe\\(|test\\(" frontend/e2e/*.spec.ts`
   - Unit/integration: `rg -n "<keyword>" tests frontend/src frontend/__tests__`
   - Route/component code: `rg -n "<route or keyword>" frontend/src/pages frontend/src/components`
2) If an existing test fully covers the claim, append a link to that test (see linking rules below).
3) If no test exists, add the smallest stable test:
   - Prefer unit/integration tests for logic; use Playwright only for UI/route behavior.
   - Keep selectors stable (data-testid, headings, obvious text), avoid timing races, and seed data
     deterministically.
   - Mirror existing test patterns, fixtures, and helper imports in the target directory.
   - One test per claim; do not broaden scope beyond the checklist text.

## Update the checklist with links (required)
- Append links at the **end of the checklist line**, matching existing style:
  `([<file:short description>](../../path/to/test#Lx))`. Use paths relative to `docs/qa/v3.md`.
- Multiple links live in the same parentheses, comma-separated.
- Keep the checkbox text intact; only add links and, if needed, minimal clarifying words.

## Verification and commands
- Inspect `package.json`, `frontend/package.json`, and `.github/workflows` to choose the right
  commands for the tests you touched (unit/integration vs Playwright).
- Run the smallest relevant subset locally (examples: `npm run test -- <path>`,
  `npx playwright test frontend/e2e/<file>.spec.ts`, `npm run lint` if Svelte/TS touched).
- Record every command and result for the PR summary.

## Output (commit + PR)
- Summarize which checklist items you covered (quote the lines) and which tests link to each, with
  file paths.
- Note any partial automation and remaining manual checks.
- List all commands you ran with results.
- Keep the diff minimal: only the selected checklist lines and the new/updated tests.
```

## Merge compatibility prompt
Use this when multiple QA coverage PRs land at once and you need to surface overlaps before merging.

```markdown
I have multiple candidate PRs produced from `docs/prompts/codex/qa-test-coverage.md`, and I want to
know which ones can be merged together safely (minimal merge conflicts, no duplicated edits).

Here are the PRs:
- <PR URL 1>
- <PR URL 2>
- <PR URL 3>
- <PR URL 4>

Please use your GitHub connector to inspect each PR.

What I need:
- For each PR, summarize what it changes at a high level (QA checklist lines touched, tests added or
  updated, any helper/fixture churn).
- List the files changed in each PR.
- Compute overlaps between PRs:
  - Exact file-path overlaps (same file touched by multiple PRs), especially `docs/qa/v3.md`,
    `frontend/e2e/*`, `tests/*`, shared fixtures, and helpers.
  - Obvious content overlaps (e.g., two PRs linking tests to the same checklist bullet or editing
    the same spec file).
- Recommend which PRs can merge together with minimal conflict risk and which should be sequenced or
  rebased first. Call out the specific files likely to conflict.

Output format:
- A short “safe to merge together” list (pairs or groups).
- A short “needs sequencing/manual reconciliation” list with the conflicting file paths.
- A compact overlap matrix or pairwise summary (file paths are enough).
```

## Upgrade prompt
Use this when the QA coverage prompt or merge guidance drifts and needs a refresh.

```markdown
# Upgrade the QA test coverage prompt

You are Codex reviewing `docs/prompts/codex/qa-test-coverage.md`. Improve the QA coverage prompt and
its merge-compatibility guidance so they stay copy-paste ready, evergreen, and precise.

## Instructions
- Re-audit the current `docs/qa/v3.md` structure and the repo’s test locations to ensure commands
  and paths stay accurate.
- Tighten language, remove duplication, and align batch size and linking rules with current
  practice.
- Ensure commands reflect current scripts/CI expectations for the test types we touch.
- Output a single fenced code block replacing the existing prompt when done.
```
