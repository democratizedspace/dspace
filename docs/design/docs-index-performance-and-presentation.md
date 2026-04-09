# `/docs` index performance and presentation (v3.0.1 design)

## Problem statement

The `/docs` index currently ships a rich, per-doc client payload (including full stripped body text)
for every listed link, hydrates a Svelte search UI immediately on page load, and computes query
filtering/snippet extraction on every keystroke. This design is functionally correct, but likely
heavier than necessary for a patch release where we want safer, high-confidence improvements to:

- initial payload size
- hydration/boot work
- client-side search responsiveness
- presentation clarity for default (non-search) and active-search states

without adding product functionality or changing information architecture.

## Current-state analysis (with code anchors)

### Route/build path

- `frontend/src/pages/docs/index.astro` imports all docs markdown with `Astro.glob('./md/**/*.md')` and
  builds a `Map` of `{ features, bodyText }` per slug by loading full doc content via `rawContent` or
  `compiledContent`, running `detectDocFeatures(content)` and `stripMarkdownToText(content)`, then
  attaching both fields to every docs link passed to the client. This happens for both curated links
  from `sections.json` and generated Skills links from quest trees.
- The route renders `<DocsIndex sections={docsSectionsWithAllSkills} client:load />`, so hydration is
  eager (load-time) rather than deferred until interaction/visibility.

### Client search/render path

- `frontend/src/components/svelte/DocsIndex.svelte` computes `parsedQuery`, `filteredSections`, and
  `totalResults` reactively on each input change.
- Matching currently scans `title + keywords + bodyText` for each link and applies `has:` operators.
- For text queries, snippet generation calls `findDocSnippet(link, keywords)` for each matched link,
  with tokenization and match-window extraction done from `bodyText` at query time.

### Utility behavior

- `frontend/src/lib/docs/fullTextSearch.ts` provides:
  - query parse/de-dup/sort (`parseDocsQuery`)
  - markdown stripping (`stripMarkdownToText`)
  - snippet extraction (`extractSnippet`/`findDocSnippet`)
- `frontend/src/utils/docsSearchFeatures.js` currently detects only `link` and `image` features from
  markdown/html syntax.
- `frontend/src/utils/docsSkillsIndex.js` merges curated Skills links with generated quest-tree links.

### Existing quality coverage

- Component tests: `frontend/src/components/__tests__/DocsIndexSearch.spec.ts`
- Search utility tests: `frontend/src/lib/__tests__/fullTextSearch.test.ts`
- E2E docs search behavior: `frontend/e2e/docs-search.spec.ts`
- Feature detector tests: `tests/docsSearchFeatures.test.ts`
- Link integrity checks relevant to docs index inputs: `tests/docsSlugCoverage.test.ts` and
  `scripts/link-check.mjs`
- QA baseline expectations include docs search behavior in `docs/qa/v3.md`.

## Measured facts vs. hypotheses

### Measured facts (from repository inspection)

1. The docs source corpus included by `Astro.glob('./md/**/*.md')` is large enough to matter:
   - 104 markdown files under `frontend/src/pages/docs/md/**`
   - ~676 KB raw markdown
   - ~492 KB stripped plain text (using current strip rules)
2. An approximate serialized payload shape equivalent to `sections` with attached `bodyText` and
   `features` across current links is large:
   - 66 links in final sections
   - minified JSON payload estimate: ~419 KB
   - of that, `bodyText` contributes ~387 KB (dominant share)
3. `DocsIndex` hydration is eager via `client:load`.
4. Snippet extraction currently recomputes tokenization from `bodyText` during filtering rather than
   reusing precomputed snippet/search artifacts.

### Informed hypotheses (not benchmarked in this PR)

1. Dominant initial transfer + parse cost on `/docs` comes from serializing full `bodyText` into the
   initial hydrated props.
2. Search latency on low-end devices is likely dominated by repeated lowercasing/substring scans and
   snippet tokenization per keystroke.
3. Default non-search presentation likely pays unnecessary JS/data cost before users interact with
   search.

## Likely bottlenecks and data-shape inefficiencies

1. **Over-serialization in initial client payload**
   - Full per-doc `bodyText` is always shipped, even when users only browse categories/links.
2. **Work duplication across build + runtime**
   - Build strips markdown to text, but runtime still repeatedly tokenizes body text for snippets.
3. **Eager hydration for interaction that may not be used**
   - `client:load` hydrates immediately instead of on idle/visibility.
4. **Search data not tiered by state**
   - Default landing state (no query) and active-search state use same heavy object shape.
5. **Presentation density/noise under search**
   - Snippets are useful but can create visually dense cards; current two-line clamp helps, yet
     readability can still degrade when many results appear simultaneously.
6. **Skills merge path is functionally fine but coupled to full-body attachment**
   - Merge logic itself is cheap; cost comes from attaching body text/features to every merged link
     up front.

## Presentation / UX rough edges (patch-safe scope)

1. Default `/docs` view likely loads more than needed for “browse by section” use.
2. Search results can feel visually noisy when many snippets render at once.
3. Search input has no explicit “search-ready” progressive transition (all costs paid before first
   query).
4. Uniform card treatment for browse and search states may reduce scanability of categories.

## Goals

1. Reduce initial `/docs` payload and client parse/hydration work.
2. Keep existing search semantics (`keywords` + `has:` behavior + snippet behavior) unchanged.
3. Improve perceived responsiveness for first keystrokes and ongoing filtering.
4. Keep implementation narrow, SSR-safe, offline-first, and suitable for patch release risk profile.

## Non-goals

- No new search operators, ranking algorithms, filters, or backend search services.
- No docs taxonomy/content rewrite.
- No major route/IA redesign.
- No change to canonical docs source authoring model.

## Constraints and risks

### Constraints

- Must preserve current UX contract documented in `frontend/src/pages/docs/md/docs-search.md`.
- Must preserve existing QA coverage expectations in `docs/qa/v3.md`.
- Must remain SSR-safe and offline-capable.
- Patch-release scope (`v3.0.1`) favors low-risk, reversible, testable changes.

### Risks

- Refactoring payload/index shape may break snippet fidelity if extraction logic drifts.
- Hydration strategy changes can affect E2E timing assumptions.
- Build-time preprocessing can introduce stale/generated artifact drift if not covered by tests.

## Candidate approaches considered

### A) Keep current architecture; add only small runtime optimizations

Examples:
- memoize normalized searchable values
- memoize snippet result per `(doc, query)` key

**Pros**: very low migration risk.
**Cons**: does not fix largest bottleneck (initial payload bloat).

### B) Two-tier client payload (recommended)

- Ship lightweight default payload in initial props (`title`, `href`, `keywords`, `features`).
- Keep full-text search corpus in a separate static JSON artifact loaded lazily on first non-empty
  keyword query.
- Preserve in-browser search/snippet behavior; only data loading timing changes.

**Pros**: largest win for initial page cost; minimal product/behavior change; offline-friendly if
artifact is same-origin and pre-cacheable by existing strategy.
**Cons**: introduces one async loading state path and generated artifact handling.

### C) Build precomputed snippet windows/inverted index and remove raw body text from runtime

- Precompute token index and snippet windows per doc.

**Pros**: potentially faster query-time CPU.
**Cons**: higher implementation complexity/risk for patch release; easier to regress edge cases.

### D) Server-only filtering with query params (SSR roundtrip)

**Pros**: smallest client JS.
**Cons**: changes interaction model and offline behavior; too broad for `v3.0.1`.

## Recommended approach

Adopt **Approach B** with a narrow, patch-safe plan:

1. **Split docs index data by state**
   - Initial `sections` payload: lightweight browse fields only.
   - Separate generated search corpus (slug-keyed or link-keyed) containing stripped body text +
     optional pre-normalized text.
2. **Lazy-load corpus only when needed**
   - Load corpus on first keyword query (not for empty query, and not necessarily for operator-only
     query like `has:image` if body text is not required).
3. **Retain existing search/snippet semantics**
   - Keep parse/match/snippet behavior stable to avoid user-visible functionality drift.
4. **Patch-safe presentation polish**
   - Keep existing layout structure, but reduce visual noise in active-search mode via small style
     tuning (e.g., snippet contrast/spacing) without changing information architecture.
5. **Keep Skills merge behavior unchanged**
   - Continue merge logic from `docsSkillsIndex`; only decouple from eager `bodyText` attachment.

## Why this is appropriate for `v3.0.1`

- Targets a clear low-hanging bottleneck (initial payload dominated by `bodyText`) with narrow
  surface-area changes.
- Preserves current search behavior and route shape.
- Avoids high-risk algorithmic rewrites and backend dependencies.
- Compatible with existing tests + straightforward additions for lazy-load state.

## Recommended implementation slices (future PRs)

### Slice 1 (must-have): Data-shape split + lazy corpus load

- Generate/search-corpus artifact at build time from docs markdown.
- Remove `bodyText` from initial `sections` props.
- Load corpus in `DocsIndex` on first keyword query and then execute existing filtering/snippets.

### Slice 2 (must-have): Search computation hygiene

- Cache normalized searchable fields once per doc after corpus load.
- Ensure snippet extraction is only attempted for matched docs and only in keyword mode.
- Add deterministic unit tests for lazy-load + no-regression semantics.

### Slice 3 (nice-to-have): Presentation clarity in search state

- Minor style refinements for snippet readability and card spacing under high-result states.
- No new controls/features.

### Slice 4 (nice-to-have): Hydration timing refinement

- Evaluate `client:idle` (or equivalent safe defer) for docs index hydration if E2E reliability is
  preserved.

## Rollout / verification plan

1. **Pre-merge checks**
   - `node scripts/link-check.mjs`
   - docs index/search unit + component + E2E tests already in suite, with added cases for lazy
     corpus loading and operator-only behavior.
2. **Launch gates for `v3.0.1`**
   - No regressions in:
     - query filtering
     - `has:` operators
     - snippet rendering rules
     - docs link integrity
3. **Post-merge sanity checks**
   - Manual smoke on `/docs` for:
     - default render before typing
     - first keyword query behavior
     - clear/reset behavior
     - keyboard accessibility of search input and links

## Acceptance criteria

1. Initial `/docs` serialized props exclude full doc body text.
2. Search behavior remains equivalent for current supported queries.
3. Snippet behavior remains equivalent to documented contract.
4. Existing docs search tests pass with any required updates for lazy-load timing.
5. Link checks and docs slug coverage continue to pass.
6. No production feature additions beyond performance/presentation refinements.

## Deferred to `v3.1+`

1. Richer ranking/scoring and typo tolerance.
2. Advanced indexing structures (inverted index, compressed trie, etc.).
3. Broader docs IA/navigation redesign.
4. Search analytics/telemetry pipelines.
5. Worker-thread offloading for search CPU.

## Open questions / follow-ups

1. Should operator-only queries (`has:image`) bypass corpus fetch entirely? (recommended yes if
   semantics remain unchanged)
2. Should the lazy corpus be a single JSON file or section-sharded payloads? (single file likely
   safer for patch release)
3. Is `client:idle` stable enough across test environments, or should hydration timing remain
   `client:load` in `v3.0.1` and be revisited later?
4. Do we want a hard size budget for `/docs` initial serialized payload in CI (e.g., snapshot
   threshold), or keep manual monitoring first?

## Notes on evidence quality

This document intentionally separates direct repository measurements from hypotheses. It does **not**
claim runtime latency improvements, because no browser performance profiling was performed in this
PR.
