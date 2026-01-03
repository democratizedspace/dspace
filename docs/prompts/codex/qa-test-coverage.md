# QA checklist → automated test coverage prompts

Use these prompts to convert the v3 QA checklist into test-backed lines while keeping each PR
small, deterministic, and reviewable.

## QA-test-coverage prompt
Use this to link QA checklist items to existing or new automated tests.

```markdown
# DSPACE QA checklist → automated test coverage

You are Codex working in the democratizedspace/dspace repository. Pick a small set of unchecked QA
checklist items in `docs/qa/v3.md` that lack linked automated coverage, add or locate tests for
them, and append the links inline.

## Guardrails
- Read and follow all relevant AGENTS.md instructions (use the most specific scope).
- CI enforces QA-doc link freshness for `docs/qa/v3.md` and `docs/qa/v3.1.md` via
  `tests/qaDocsLinkFreshness.test.ts`; keep anchors (`#L...` or `#LSTART-LEND`) wrapped around the
  referenced snippet.
- Keep scope tight: default to **3–5** checklist items, hard cap **6** per run.
- Do not refactor or rename outside the chosen checklist lines and their tests.
- Prefer deterministic, stable tests; avoid flakes and long timeouts.

## Selecting checklist items (small batches)
1) Open `docs/qa/v3.md` and find unchecked lines missing test links.
   - Linked lines contain `#L` anchors inside parentheses.
   - Helper commands:
     - `rg "^- \[ \]" docs/qa/v3.md | rg -v "#L"` → unchecked + unlinked (heuristic).
     - `rg "\\[ \\] .*#L" docs/qa/v3.md` → already-linked items.
     - `rg "\\[ \\] .*" docs/qa/v3.md | rg -v "#L"` → candidate unlinked items.
2) Choose 3–5 automatable items first (route loading, schema/validation checks, map/graph behavior,
   import/export flows, etc.); never exceed 6.
3) When human judgment is needed, design the tightest mechanical proxy (lint-like checks,
   placeholder guards, schema coverage). Note any remaining manual gap in the PR summary.

## Finding or creating tests for each selected item
For each chosen checklist line:
1) Search for existing coverage before writing new tests.
   - Likely locations: `frontend/e2e/*.spec.ts`, `tests/*.test.ts`, `frontend/tests`, plus any test
     directories near the feature under test.
   - Targeted searches:
     - `rg "<keyword>" frontend/e2e` for route/UI behaviors.
     - `rg "<keyword>" tests` for root/unit/integration coverage.
     - `rg "<route or selector>" frontend/src` to find the page/component.
2) If a test already covers the statement, link to it (small assertion tweaks are fine to align).
3) If no coverage exists, add a minimal deterministic test:
   - Prefer unit/integration when logic is pure; use Playwright only for routing/rendering or user
     flows.
   - Reuse fixtures/selectors; prefer data-testid or stable text over positional selectors.
   - Avoid sleeps; wait for network-idle or explicit locators.
   - Keep scope tight to the checklist statement.

## Updating the checklist with links (required)
- Append test links at the end of the checklist line in `docs/qa/v3.md` using:
  `([<wallet-page.spec.ts:renders balances and process card>](../../../frontend/e2e/wallet-page.spec.ts#L5-L20))`.
  Multiple links live
  inside one set of parentheses, comma-separated.
  - `FILE_LABEL` must match the filename or trailing path segment (e.g. `wallet-page.spec.ts`,
    `questGraph.test.ts`).
  - `TEST_NAME_SUBSTRING` must appear within the linked line range (often the `it(` title or a
    unique assertion string) so the freshness checker can validate it.
  - Use tight `#LSTART-LEND` ranges when needed for stability.
- Paths are relative to `docs/qa/`; mirror existing examples.
- The short description should summarize what the test asserts.

## Verification commands
- Map touched tests to the right runner by inspecting `package.json`, `frontend/package.json`, and
  `.github/workflows/*.yml` (unit/integration vs. Playwright E2E).
- Always run the QA-doc link freshness check when touching `docs/qa/v3*.md`:
  `npm run test:root -- qaDocsLinkFreshness.test.ts`.
- For docs-only PRs, keep it light: `git diff --check` plus the freshness test above.
- Helper searches:
  - `rg -n "qaDocsLinkFreshness" -S .`
  - `rg -n "QA docs test link freshness" -S tests`
- Run relevant subsets locally (at least the runner(s) for new/modified tests).
- Record every command and result in the PR summary. If a required command cannot run locally, note
  why and mark it as a warning.

## PR summary requirements
- Quote the checklist lines you covered and list the linked/added test files for each.
- Note whether coverage was newly added or already existed.
- Include every command you ran with results.
- Call out partially automated items and what still requires manual verification.
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
- "Safe to merge together" list (pairs/groups) with brief rationale.
- "Needs reconciliation" list with the overlapping file(s) or checklist lines called out.
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
