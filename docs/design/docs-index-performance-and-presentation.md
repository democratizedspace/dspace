# `/docs` index performance and presentation improvements for `v3.0.1`

## Problem statement

The `/docs` landing page currently hydrates a single client component with a rich, per-doc payload
that includes full markdown-derived body text and feature flags for every listed link. This achieves
full-text search + snippets, but likely over-pays in a few patch-relevant areas:

1. **Initial payload size** (large serialized `sections` prop).
2. **Client compute on every keystroke** (normalization + matching + snippet extraction across all
   docs).
3. **Immediate hydration cost on page load** (`client:load` regardless of search intent).
4. **Presentation clarity under active search** (dense snippets + card layout can feel noisy).

For `v3.0.1`, we should keep behavior/functionality stable while reducing avoidable cost and
improving perceived responsiveness and readability.

---

## Current-state analysis (with code anchors)

### Route and data-building path

- `/docs` is rendered by `frontend/src/pages/docs/index.astro`.
- At render time it:
  - Loads all docs markdown modules with `Astro.glob('./md/**/*.md')`.
  - Builds `docSearchIndex` by reading each doc’s full source via `rawContent`/`compiledContent`.
  - Derives both `features` (`detectDocFeatures`) and full stripped `bodyText`
    (`stripMarkdownToText`).
  - Injects `{ features, bodyText }` into every `sections.json` link.
  - Generates extra Skills links from quest-tree directories and merges them into Skills.
  - Passes the resulting structure to `<DocsIndex sections={...} client:load />`.

### Client rendering/search path

- `frontend/src/components/svelte/DocsIndex.svelte` receives all sections + per-link payload.
- Reactive filtering on query change:
  - `parseDocsQuery(query)` splits keywords/operators.
  - For each link, `matchLink()` normalizes/searches title, keywords, and `bodyText`.
  - For matching links and non-`has:` keyword searches, `findDocSnippet()` computes snippet HTML.
- This work occurs on each input update across all links.

### Search utility behavior

- `frontend/src/lib/docs/fullTextSearch.ts`:
  - `stripMarkdownToText()` performs regex-based markdown stripping.
  - `extractSnippet()` tokenizes body text per call and scans for first keyword hit.
  - `findDocSnippet()` loops sorted keywords and calls `extractSnippet()` until first match.
- `frontend/src/utils/docsSearchFeatures.js` detects `link` and `image` markers using regex.

### Skills merge/discovery path

- `frontend/src/utils/docsSkillsIndex.js`:
  - Discovers quest trees from module paths.
  - Merges curated Skills links with generated tree links (alias-aware dedupe + alpha sort).
- Current test coverage confirms one slug per quest tree and merge behavior:
  `frontend/tests/docsSkillsIndex.test.ts`.

### Existing tests/QA guarantees relevant to patch safety

- Search UI + filter behavior:
  - `frontend/__tests__/DocsIndex.test.js`
  - `frontend/src/components/__tests__/DocsIndexSearch.spec.ts`
  - `frontend/e2e/docs-search.spec.ts`
- Search utilities:
  - `frontend/src/lib/__tests__/fullTextSearch.test.ts`
  - `tests/docsSearchFeatures.test.ts`
- QA tracking references:
  - `docs/qa/v3.md` section 3.4 (docs search + `has:` operators).

---

## Measured facts vs informed hypotheses

### Measured facts (from repository inspection)

1. `sections.json` currently contains **62 curated links** across 5 sections.
2. Quest-tree merge logic can add generated Skills links (currently **4 additional trees** not in
   curated Skills list: `completionist`, `devops`, `ubi`, `welcome`).
3. A local script reproducing the current payload shape (`sections` + `features` + `bodyText`)
   estimates:
   - Baseline `sections.json` JSON size: **~5.5 KB**.
   - Enriched payload JSON size: **~356 KB**.
   - Added payload from body/features enrichment: **~351 KB**.
4. The same analysis shows aggregate stripped body text for listed docs is
   **~346,635 characters**.

### Informed hypotheses (not benchmarked in-browser yet)

1. Most of the incremental payload comes from serialized `bodyText`, not metadata.
2. `findDocSnippet()` repeatedly tokenizes large doc strings during typing, amplifying CPU cost as
   query length changes.
3. `client:load` hydrates search logic even for users who only browse links and never type.
4. Dense snippets under many results increase visual scanning cost and perceived “busy” layout.

---

## Likely bottlenecks and data-shape inefficiencies

1. **Over-broad initial client payload**
   - Full `bodyText` for all docs is shipped before any search intent.
2. **Repeated query-time work**
   - Normalization arrays and snippet tokenization are recomputed per link/per query update.
3. **No distinction between browse vs search states**
   - Landing view pays search-index cost before user types.
4. **Snippet generation tied to full text at query time**
   - No precomputed snippet windows/index terms to avoid repeated scans.
5. **Hydration eagerness**
   - `client:load` starts JS work immediately instead of idling/deferred activation.

---

## Presentation / UX rough edges (patch-safe)

1. When many matches include snippets, the grid becomes text-dense and harder to scan quickly.
2. Snippet rendering under pill links can create uneven card height and visual jitter while typing.
3. Non-search landing view and active-search view share the same visual density despite different
   user intent.

These are polish issues, not feature gaps; they can be improved without changing ranking/operators.

---

## Goals

1. Reduce initial `/docs` client payload and hydration cost.
2. Preserve current search semantics (`keywords` + full text + `has:` operators).
3. Improve perceived responsiveness while typing.
4. Reduce visual noise in active search results.
5. Keep solution SSR-safe and offline-friendly.

## Non-goals

- No new operators, filters, ranking heuristics, or search syntax.
- No backend/external search service.
- No docs taxonomy or content rewrite.
- No major route/IA redesign.

---

## Constraints and risks

1. **Patch release scope (`v3.0.1`)** demands minimal behavior risk.
2. Existing docs search tests/QA checks must remain green.
3. Offline behavior must remain functional after first load.
4. SSR boundaries must remain safe (no browser API use during server render).
5. Build-time preprocessing should not materially regress CI time.

Risk hotspots:
- Re-indexing strategy may accidentally alter match parity.
- Lazy/deferred loading could introduce flicker or transient empty states if not carefully staged.
- Snippet presentation tweaks could break current long-token wrapping guarantees.

---

## Candidate approaches considered

### Approach A — **Status quo + micro-optimizations only**

Examples:
- debounce input handling,
- small memoization in component state.

**Pros**
- Lowest implementation risk.

**Cons**
- Does not materially reduce payload/hydration cost.
- Leaves largest bottleneck (initial `bodyText` serialization) intact.

### Approach B — **Split browse payload from search payload (recommended)**

Concept:
- Ship a light initial manifest to hydrate landing view.
- Load/search heavy body-text index only after explicit search intent.
- Keep same matching semantics once index is available.

Possible patch-safe shape:
- Initial `sections` links contain title/href/keywords/features only.
- Body text (or equivalent search index) moved to a static JSON module fetched/lazily imported when
  query becomes non-empty.
- Cache loaded index in-memory for remainder of session.

**Pros**
- Directly targets largest payload and hydration contributors.
- Preserves current user-facing search behavior.
- Keeps offline-first viable if index asset is pre-cached with app shell strategy.

**Cons**
- Requires careful UX handling for “first keystroke while index loads”.
- Adds a new artifact/loader path to test.

### Approach C — **Precompute compressed/minified search corpus at build time**

Concept:
- Build a purpose-specific lightweight index (token lists/snippet windows) instead of full body text.

**Pros**
- Potentially best runtime performance and payload efficiency.

**Cons**
- Higher implementation complexity and parity risk for patch release.
- More difficult to prove correctness quickly vs current full-text behavior.

### Approach D — **No lazy loading; just precompute snippets and token maps server-side**

**Pros**
- Avoids runtime tokenization hotspots.

**Cons**
- Still ships heavy per-doc search data at first load.
- Likely insufficient for payload concerns by itself.

---

## Recommended approach (`v3.0.1`)

Adopt **Approach B** with conservative scope:

1. **Two-tier docs payload**
   - Tier 1 (initial): section metadata for browse presentation only.
   - Tier 2 (deferred): full-text corpus for snippet/match parity loaded on first non-empty query.

2. **Query-time work reduction (without semantic changes)**
   - Cache normalized searchable fields per link.
   - Cache snippet tokenization per doc after first use in session.
   - Keep existing keyword/operator logic identical.

3. **Patch-safe presentation polish for active search state**
   - Keep current card/pill structure.
   - Reduce visual noise by tightening snippet typography/spacing and optionally showing snippets only
     when match originates from body text (already mostly true by behavior).
   - Preserve long-token wrapping and 2-line clamp constraints.

4. **Maintain Skills merge path as-is functionally**
   - Do not redesign merge behavior.
   - Ensure generated links can still participate in deferred full-text search once index is loaded.

---

## Why this recommendation is appropriate for `v3.0.1`

- It targets the biggest cost center (initial body-text payload) with minimal product-surface change.
- It preserves documented behavior and existing `has:` semantics.
- It can be landed in small PR slices with strong regression tests.
- It avoids introducing new infra, ranking logic, or content restructuring.

---

## Recommended implementation slices (future PRs)

1. **Slice 1 — Payload split plumbing (must-have)**
   - Introduce deferred docs full-text artifact.
   - Keep browse UI and filter behavior unchanged after index load.
   - Add unit/integration coverage for “search before index loaded”.

2. **Slice 2 — Query-time caching (must-have)**
   - Memoize normalized fields and snippet tokenization.
   - Add utility tests ensuring output parity with current behavior.

3. **Slice 3 — Active-search presentation polish (nice-to-have)**
   - Refine snippet spacing/contrast/line-height in search state only.
   - Verify no overflow regressions in existing long-token tests.

4. **Slice 4 — Build-time index shaping (nice-to-have, optional for `v3.0.1`)**
   - If needed, trim deferred index fields to minimal shape while preserving parity.

---

## Rollout / verification plan

### Pre-merge checks (implementation PRs)

- Run existing docs/search suites:
  - `frontend/src/lib/__tests__/fullTextSearch.test.ts`
  - `frontend/src/components/__tests__/DocsIndexSearch.spec.ts`
  - `frontend/e2e/docs-search.spec.ts`
  - `frontend/tests/docsSkillsIndex.test.ts`
- Run route/link validation:
  - `node scripts/link-check.mjs`
- Run project guardrails per AGENTS guidance:
  - `npm run lint`
  - `npm run type-check`
  - `npm run build`

### Launch gates for `v3.0.1`

1. No change in search result parity for representative keyword + `has:` queries.
2. Snippet visibility/format parity preserved (except intentional presentation polish).
3. No SSR safety regressions.
4. `/docs` first render works with JS enabled/disabled (progressive enhancement intact).
5. QA checklist entry in `docs/qa/v3.md` updated for any new loading-state expectations.

---

## Acceptance criteria

A `v3.0.1` implementation is complete when:

1. `/docs` initial payload excludes full doc body text in hydrated props.
2. Full-text search still returns the same docs/snippets once deferred index is available.
3. `has:link` and `has:image` behavior remains unchanged.
4. Existing docs-search unit/E2E tests pass with any necessary fixture updates limited to loading
   behavior.
5. Link-check and standard lint/type/build checks pass.

---

## Explicit deferrals for `v3.1+`

1. Alternate ranking/scoring models (weighted fields, fuzzy matching, typo tolerance).
2. Token-level inverted index redesign beyond patch-safe shaping.
3. Semantic/taxonomy-level docs IA changes.
4. Search analytics/telemetry pipeline additions.
5. Worker-based search execution (if needed after post-`v3.0.1` profiling).

---

## Open questions / follow-ups

1. Should deferred full-text index be bundled as a separate static asset or dynamically imported JS
   module, given current offline caching behavior?
2. Do we want a tiny explicit “search index loading…” micro-state on first non-empty query, or rely
   on near-instant load without extra UI?
3. Should generated Skills links without curated metadata include fallback snippet eligibility only
   after index load, or always remain title/keyword-only?
4. Which exact performance budgets should be codified for `/docs` in CI (bundle size guard,
   hydration timing smoke check, or both)?

---

## This PR (design-only) intentionally does not change runtime behavior

This document proposes a narrow implementation path for `v3.0.1` and intentionally introduces no
production code changes in this PR.
