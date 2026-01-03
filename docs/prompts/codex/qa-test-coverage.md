# QA checklist → automated test coverage prompts

Use these prompts to convert unchecked QA checklist lines into automated coverage without bloating a
PR.

## QA-test-coverage prompt
Use this when you want to link QA checklist items to existing or new automated tests.

```markdown
# DSPACE QA checklist → automated test coverage

You are Codex working in the democratizedspace/dspace repository. Your mission is to pick a small,
deterministic set of unchecked QA checklist items in `docs/qa/v3.md` (or `docs/qa/v3.1.md`), add or
locate tests for them, and append the links inline.

## Guardrails
- Read and obey any relevant AGENTS.md instructions before editing.
- CI enforces QA-doc test-link freshness via `tests/qaDocsLinkFreshness.test.ts`; keep anchors tight
  and include the referenced string (use `#LSTART-LEND` ranges if anchors drift).
- Keep scope tight: default to **3–5** checklist items, hard cap **6**.
- Only touch the chosen checklist lines and the tests you add/adjust; avoid unrelated refactors.
- Prefer deterministic, fast tests; avoid flakes and arbitrary timeouts.

## Selecting checklist items (small batches)
1) Open `docs/qa/v3.md` (or `docs/qa/v3.1.md`) and list unchecked lines without linked tests.
   - Linked lines contain the `[<...>](...#L...)` pattern.
   - Helper commands:
     - `rg "^- \\[ \\]" docs/qa/v3.md | rg -v "#L"` → unchecked + unlinked (heuristic).
     - `rg "\\[ \\] .*#L" docs/qa/v3.md` → already linked items.
     - `rg "\\[ \\] .*" docs/qa/v3.md | rg -v "#L"` → candidate unlinked items.
2) Prioritize automatable items: route loading, schema/validation checks, map/graph behaviors,
   import/export flows, deterministic data guards. If an item needs human judgment, design the best
   mechanical proxy and note any gaps in the PR summary.
3) Stick to 3–5 items; never exceed 6 per pass.

## Finding or creating tests for each selected item
For each chosen checklist line:
1) Search for existing coverage before writing new tests.
   - Likely locations: `tests/*.test.ts`, `frontend/tests`, `frontend/e2e/*.spec.ts`, and nearby
     test directories.
   - Use targeted searches:
     - `rg "<keyword>" frontend/e2e` for route/UI behaviors.
     - `rg "<keyword>" tests` for root/unit/integration coverage.
     - `rg "<route or selector>" frontend/src` to locate the page/component under test.
2) If a test already covers the checklist claim, link to it. Only adjust assertions when needed for
   alignment.
3) When adding coverage:
   - Prefer unit/integration when logic is pure; use Playwright only for routing/rendering or
     interactive flows.
   - Reuse existing fixtures and stable selectors (data-testid or durable text, not positional).
   - Avoid timing races: wait for specific locators or network-idle instead of sleeps.
   - Keep each test narrowly scoped to the checklist statement.

## Updating the checklist with links (required)
- Append test links at the end of the checklist line in `docs/qa/v3*.md` using this pattern:
  `([<FILE_LABEL:TEST_NAME_SUBSTRING>](relative/path/to/test#LSTART[-LEND]))`. Multiple links share
  one pair of parentheses, comma-separated.
  - `FILE_LABEL` must match the filename or trailing path segment (e.g. `questGraph.test.ts`).
  - `TEST_NAME_SUBSTRING` must appear inside the linked line range (often the `it(...)` title or a
    unique assertion).
  - Use `#LSTART-LEND` ranges for stability, but keep them tight.
- Paths are relative to `docs/qa/` (e.g. `../../tests/...` or `../../frontend/e2e/...`).
- If widening a range to keep anchors fresh, confirm the link still encloses the referenced string.

## Verification commands
- Run the QA-doc link freshness check whenever `docs/qa/v3*.md` changes:
  `npm run test:root -- qaDocsLinkFreshness.test.ts`.
- Run the right runner for any tests you touched:
  - Root/unit/integration: `npm run test:root -- <file-or-pattern>`.
  - Playwright E2E: `cd frontend && npm run test:e2e -- <args>` (or existing grouped scripts).
- For docs-only PRs, keep verification lightweight (`git diff --check` plus the freshness test).
- Record every command and result in the PR summary. If a required command cannot run locally, call
  it out with the reason.

## PR summary requirements
- Quote the checklist lines you covered and list the linked/added test files for each; state whether
  coverage was reused or newly added.
- Include every command you ran with results.
- Note any partial automation and what manual expectation remains.
```

## Merge compatibility prompt
Use this when multiple QA-test-coverage PRs land and you need to surface overlaps or conflicts
before merging.

```markdown
I have four candidate PRs that came out of `docs/prompts/codex/qa-test-coverage.md`, and I want to
know which ones can merge cleanly.

PRs:
- <PR URL 1>
- <PR URL 2>
- <PR URL 3>
- <PR URL 4>

Please use your GitHub connector to inspect each PR.

What I need:
- High-level summary of each PR (which checklist items were linked, new vs. existing tests used).
- List of files changed in each PR.
- Overlap analysis:
  - exact file-path overlaps (same file touched by multiple PRs)
  - obvious content overlaps (e.g., same checklist lines or same test files/fixtures updated)
- Recommendations on which PRs can merge together safely vs. which need sequencing or
  reconciliation.

Output format:
- “Safe to merge together” list (pairs/groups) with brief rationale.
- “Needs reconciliation” list with the overlapping file(s) or checklist lines called out.
- Compact overlap matrix or pairwise notes (file paths are enough).
```

## Upgrade prompt
Use this to keep the QA-test-coverage prompt aligned with current repository practices and scripts.

```markdown
# Upgrade the QA checklist → test coverage prompt

You are Codex reviewing `docs/prompts/codex/qa-test-coverage.md`. Refresh it so it stays precise,
copy-paste ready, and aligned with how the repo runs tests.

## Instructions
- Re-audit the prompt for clarity, duplication, and correctness against the current repository
  layout and CI expectations.
- Verify that referenced paths, commands, and heuristics for linking checklist items remain valid.
- Tighten language, remove drift, and keep the three-section structure (main prompt, merge
  compatibility prompt, upgrade prompt).
- Output a single fenced code block replacing the existing file contents.
```
