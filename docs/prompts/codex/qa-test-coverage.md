# QA checklist → automated test coverage prompts

Use these prompts to keep the QA checklist linked to reliable automated tests while keeping each PR
small and reviewable.

## QA-test-coverage prompt
Use this when you want to link QA checklist items to existing or new automated tests.

```markdown
# DSPACE QA checklist → automated test coverage

You are Codex working in the democratizedspace/dspace repository. Pick a small set of unchecked QA
checklist items in `docs/qa/v3.md` that lack linked automated coverage, add or locate tests for
them, and append the links inline.

## Guardrails
- Read and obey any applicable AGENTS.md instructions before editing.
- CI enforces QA-doc test-link freshness for `docs/qa/v3.md` and `docs/qa/v3.1.md` via
  `tests/qaDocsLinkFreshness.test.ts`; update `#L…` anchors (or narrow ranges) so they still wrap
  the referenced snippet.
- Keep scope tight: target **3–5** checklist items, hard cap **6** per run.
- Only touch the chosen checklist lines and the tests you add or adjust; avoid unrelated refactors
  or renames.
- Favor deterministic, stable tests and avoid long timeouts or flake-prone waits.

## Selecting checklist items (small batches)
1) Open `docs/qa/v3.md` and list unchecked lines without linked tests.
   - Linked lines contain `#L` anchors inside parentheses.
   - Helper commands:
     - `rg "^- \[ \]" docs/qa/v3.md | rg -v "#L"` → unchecked + unlinked (heuristic).
     - `rg "\\[ \\] .*#L" docs/qa/v3.md` → already-linked items.
     - `rg "\\[ \\] .*" docs/qa/v3.md | rg -v "#L"` → candidate unlinked items.
2) Pick 3–5 items (max 6) that are deterministic and automatable first: routing/SSR checks,
   schema/validation, map or graph behaviors, import/export flows, etc.
3) When a line needs human judgment, design the best mechanical proxy (lint-like checks, placeholder
   guards, schema coverage). Note any remaining manual expectation in the PR summary.

## Finding or creating tests for each selected item
For each checklist line:
1) Search for existing coverage before writing new tests.
   - Likely locations: `frontend/e2e/*.spec.ts`, `tests/*.test.ts`, `frontend/tests`, and test
     directories near the feature.
   - Targeted searches:
     - `rg "<keyword>" frontend/e2e` for route/UI behaviors.
     - `rg "<keyword>" tests` for root/unit/integration coverage.
     - `rg "<route or selector>" frontend/src` to locate the page/component under test.
2) If a test already covers the claim, link to it. Only tweak assertions when it clearly tightens
   alignment with the checklist.
3) If no coverage exists, add a minimal, deterministic test:
   - Prefer unit/integration when logic is pure; use Playwright only for routing, rendering, or
     interactive flows.
   - Reuse existing fixtures/selectors; prefer `data-testid` or stable text over positional
     selectors.
   - Avoid arbitrary sleeps; wait on network idle or specific locators.
   - Keep scope tight to the checklist statement.

## Updating the checklist with links (required)
- Append test links at the end of the checklist line in `docs/qa/v3.md` using the enforced pattern:
  `([<FILE_LABEL:TEST_NAME_SUBSTRING>](relative/path/to/test#LSTART[-LEND]))`. Multiple links share
  one set of parentheses, comma-separated.
  - `FILE_LABEL` must match the target filename or its trailing path (e.g. `wallet-page.spec.ts`,
    `questGraph.test.ts`).
  - `TEST_NAME_SUBSTRING` must literally appear within the linked line range (the `it(` title or a
    unique assertion string) so the freshness check can validate it.
  - Use `#LSTART-LEND` ranges when needed for stability and keep them tight.
- Paths are relative to `docs/qa/v3.md` (already in `docs/qa/`). Mimic existing examples.
- Summaries inside the parentheses should describe what the linked test asserts.

## Verification commands
- Map each touched test to the correct runner by checking `package.json`, `frontend/package.json`,
  and `.github/workflows/*.yml` (root Vitest vs. frontend Vitest vs. Playwright).
- Always run the QA-doc link freshness check when editing `docs/qa/v3*.md`:
  `npm run test:root -- qaDocsLinkFreshness.test.ts`.
- For docs-only PRs, keep it lean: `git diff --check` plus the freshness check above.
- If you add or modify tests, run the minimal relevant runner (e.g. `npm run test:root` for root
  unit tests, `npm run test:e2e` for Playwright, `npm run check` for frontend lint/type). Record the
  exact commands and outcomes. If a required command cannot run locally, note why and mark it as a
  warning in the PR summary.

## PR summary requirements
- Quote the checklist items you covered and list the linked/added test files for each. Note whether
  coverage was newly added or preexisting.
- Enumerate every command you ran with results.
- Call out any partially automated items and the remaining manual expectation.
```

## Merge compatibility prompt
Use this when multiple QA-test-coverage PRs are in flight and you need to surface overlaps or
conflicts before merging.

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
