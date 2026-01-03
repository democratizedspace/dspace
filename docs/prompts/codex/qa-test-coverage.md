# QA checklist → automated test coverage prompts

Use these prompts to steadily convert the v3 QA checklist into lines backed by automated tests while
keeping each PR small and reviewable.

## QA-test-coverage prompt
Use this when you want to link QA checklist items to existing or new automated tests.

```markdown
# DSPACE QA checklist → automated test coverage

You are Codex working in the democratizedspace/dspace repository on branch `v3`. Your mission is to
pick a small set of unchecked QA checklist items in `docs/qa/v3.md` that lack linked automated
coverage, add or locate tests for them, and append the links inline.

## Guardrails
- If this repo contains relevant AGENTS.md files (per-directory instructions), read them before
  editing and obey the most specific instructions.
- CI enforces QA-doc test-link freshness for `docs/qa/v3.md` and `docs/qa/v3.1.md` via
  `tests/qaDocsLinkFreshness.test.ts`; expect to update `#L...` anchors (or widen to
  `#LSTART-LEND`) so they still include the referenced test snippet.
- Keep scope tight: default to **3–5** checklist items, hard cap **6** per run.
- Do not refactor or rename unrelated code; only touch the chosen checklist lines and the tests you
  add/adjust.
- Prefer deterministic, stable tests; avoid flakes and excessive timeouts.

## Selecting checklist items (small batches)
1) Open `docs/qa/v3.md` and list unchecked lines without linked tests.
   - Use the heuristic: linked lines contain `#L` anchors inside parentheses.
   - Helper commands:
     - `rg "^- \[ \]" docs/qa/v3.md | rg -v "#L"` → unchecked + unlinked (heuristic).
     - `rg "\\[ \\] .*#L" docs/qa/v3.md` → shows already-linked items.
     - `rg "\\[ \\] .*" docs/qa/v3.md | rg -v "#L"` → candidate unlinked items.
2) Choose 3–5 items (max 6) that are deterministic and automatable first (routes loading, schema or
   validation checks, map/graph behaviors, import/export flows, etc.).
3) If an item needs human judgment, design the best mechanical proxy (lint-like checks, placeholder
   text guards, schema coverage). If partial automation is the best possible, note the gap in the PR
   summary.

## Finding or creating tests for each selected item
For each chosen checklist line:
1) Search for existing coverage before writing new tests.
   - Likely locations: `frontend/e2e/*.spec.ts`, `tests/*.test.ts`, `frontend/tests`, and any test
     directories near the relevant feature.
   - Use targeted searches:
     - `rg "<keyword>" frontend/e2e` for route/UI behaviors.
     - `rg "<keyword>" tests` for root/unit/integration coverage.
     - `rg "<route or selector>" frontend/src` to locate the page/component under test.
2) If a test exists and matches the checklist claim, link to it (no code change needed unless a
   small assertion tweak improves alignment).
3) If no coverage exists, add a minimal, deterministic test:
   - Prefer unit/integration when logic is pure; only use Playwright when validating page routing,
     rendering, or interactive flows.
   - Reuse existing fixtures/selectors; prefer data-testid and stable text over positional selectors.
   - Avoid timing races: wait for network-idle or specific locators, not arbitrary sleeps.
   - Keep tests narrowly scoped to the checklist statement.

## Updating the checklist with links (required)
- Append test links at the end of the checklist line in `docs/qa/v3.md` using the enforced pattern:
  `([<FILE_LABEL:TEST_NAME_SUBSTRING>](relative/path/to/test#LSTART[-LEND]))`. Multiple links go
  inside one set of parentheses, comma-separated.
  - `FILE_LABEL` should match the target filename or its trailing path segment (e.g.
    `wallet-page.spec.ts`, `questGraph.test.ts`).
  - `TEST_NAME_SUBSTRING` must literally appear within the linked line range (often the `it(` title
    or a unique assertion string) so the freshness checker can validate the anchor.
  - Use `#LSTART-LEND` ranges when needed for stability, but keep them tight around the referenced
    snippet.
- Paths are relative to `docs/qa/v3.md` (already in `docs/qa/`); mimic existing examples.
- The short description should summarize what the test asserts.

## Verification commands
- Discover the right runner: inspect `package.json`, `frontend/package.json`, and
  `.github/workflows/*.yml` to map tests you touched to the correct command (unit/integration vs.
  Playwright E2E).
- Always run the QA-doc link freshness check when touching `docs/qa/v3*.md`:
  `npm run test:root -- qaDocsLinkFreshness.test.ts`.
- Keep verification lightweight for docs-only PRs: `git diff --check` plus the freshness test above.
- Additional helpers:
  - `rg -n "qaDocsLinkFreshness" -S .`
  - `rg -n "QA docs test link freshness" -S tests`
- Run the relevant subset locally (at least the runner(s) that cover your new/modified tests).
- Record every command and result in the PR summary. If a required command can’t run locally,
  note why (environment limit) and mark it as a warning.

## PR summary requirements
- List the exact checklist items you covered (quote the lines) and the test files linked/added for
  each.
- Note whether coverage was newly added or already existed.
- Include every command you ran with results.
- Call out any partially automated items and the remaining manual expectation.
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
- Recommendations on which PRs can merge together safely vs. which need sequencing or reconciliation.

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
