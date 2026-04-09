# Docs index performance and presentation (`/docs`) for `v3.0.1`

## Problem statement

The `/docs` route currently ships a large client payload and eagerly hydrates full search data for all
docs links on first load. The implementation is functionally correct, but for a patch release we can
likely improve perceived responsiveness and presentation clarity by reducing initial payload,
deferring heavy search data until needed, and avoiding repeated per-keystroke work.

This design proposes **narrow, patch-safe improvements** that preserve existing functionality,
including offline behavior, SSR safety, and current search semantics (`has:` operators + snippets).

---

## Current-state analysis (with code anchors)

### Request/render path

1. `frontend/src/pages/docs/index.astro` reads all docs markdown via `Astro.glob('./md/**/*.md')` and
   builds a per-doc search map (`features`, `bodyText`) using `detectDocFeatures` and
   `stripMarkdownToText`.
2. It projects that data onto every link in `sections.json` and generated Skills links,
   then passes the fully expanded structure into `<DocsIndex ... client:load />`.
3. `frontend/src/components/svelte/DocsIndex.svelte` performs client-side filtering and snippet
   generation reactively as `query` changes.

### Search/index utilities

- `frontend/src/lib/docs/fullTextSearch.ts`
  - `parseDocsQuery`: tokenizes keywords/operators.
  - `findDocSnippet` / `extractSnippet`: scans `bodyText` for first keyword match and builds snippet
    HTML.
  - `stripMarkdownToText`: strips markdown to plain text used in client payload.
- `frontend/src/utils/docsSearchFeatures.js`: lightweight link/image feature detection.
- `frontend/src/utils/docsSkillsIndex.js`: merges curated Skills links with generated quest-tree
  links.

### Tests/QA coverage today

- Component tests: `frontend/src/components/__tests__/DocsIndexSearch.spec.ts`,
  `frontend/__tests__/DocsIndex.test.js`.
- Search utility tests: `frontend/src/lib/__tests__/fullTextSearch.test.ts`.
- E2E coverage: `frontend/e2e/docs-search.spec.ts` (query filtering, operators, snippet, overflow).
- Regression context: `outages/2026-01-14-docs-search-snippet-overflow.json`.

---

## Measured facts vs hypotheses

### Measured facts (from repository inspection and local scripts)

- `/docs` source set is substantial: **82 markdown docs**, about **636,096 bytes** raw markdown under
  `frontend/src/pages/docs/md/`.
- The current page data projected into `DocsIndex` is large:
  - **66 links** after Skills merge.
  - Serialized `sections` payload (with `bodyText`) is about **397,637 bytes** (JSON string size).
  - `bodyText` contributes ~**379,108 characters** total.
- A curated-only sections structure (title/href/keywords only, no full text) is much smaller
  (~**5,500 bytes**), showing that full text dominates payload cost.

> Measurement note: these values came from local Node scripts that mirror route shaping logic and
> should be treated as approximate implementation-level sizing, not network-transfer benchmarks.

### Informed hypotheses (not directly benchmarked yet)

- The largest performance win for `v3.0.1` is reducing initial hydrated payload by deferring full
  `bodyText` until search is active.
- Current snippet generation likely does avoidable repeated work because it tokenizes/scans body text
  repeatedly per query change.
- `client:load` hydration means `/docs` pays search JS startup cost even when users only browse
  categories and never type.

---

## Likely bottlenecks and data-shape inefficiencies

1. **Oversized initial client payload**
   - `index.astro` attaches `bodyText` to each rendered link regardless of whether user searches.
   - This inflates HTML/serialized data for the default “browse docs” state.

2. **Search work paid before intent**
   - `DocsIndex` hydrates eagerly via `client:load`; interactive search machinery is initialized at
     page load.

3. **Per-keystroke repeated scanning/tokenization**
   - `matchLink` includes `link.bodyText` in searchable values for every link each update.
   - `findDocSnippet` calls `extractSnippet`, which splits and scans full `bodyText` repeatedly.

4. **Data coupling between landing and search state**
   - Default landing and active-search states share one rich data model; non-search view pays for
     search-only fields.

5. **Presentation density/noise during search**
   - Snippets can increase visual density quickly; even with clamp fixes, broad-result queries may
     feel noisy and make readability harder.

6. **Minor avoidable server/build-time work**
   - `buildDocIndex` computes doc text/features for all markdown docs even though only slugs used by
     docs links are required for the page payload.

---

## Presentation/UX rough edges relevant to `/docs`

- Search-first affordance is clear, but default browse view and active search results share identical
  card density; search state can feel text-heavy.
- Snippet display is useful but can reduce signal when many links match short terms.
- For non-search users, there is no perceptible benefit from full-text data being present up front.

(These are presentation refinements, not feature changes: no new operators/filter controls/ranking.)

---

## Goals

1. Reduce initial `/docs` payload and hydration cost without changing search behavior.
2. Keep existing query semantics (`keywords` + `has:` operators + snippet behavior).
3. Improve perceived responsiveness for first load and first interaction.
4. Keep changes small and low-risk for `v3.0.1` patch scope.
5. Preserve offline-first and SSR-safe behavior.

## Non-goals

- No new search operators, filters, ranking algorithms, or backend search service.
- No docs content rewrite or taxonomy/IA redesign.
- No major visual redesign beyond minor presentation tuning for readability.

---

## Candidate approaches considered

### Approach A — Keep current shape, micro-optimize client search only

**What:** keep full `bodyText` in initial payload; optimize Svelte/client code (memoization, fewer
allocations, pre-normalized values).

**Pros:** smallest implementation delta.
**Cons:** does not address dominant payload cost; first-load improvement likely limited.

### Approach B — Two-tier payload (recommended)

**What:**

- Initial payload: lightweight docs list for default browse state (`title`, `href`, `keywords`,
  `features`).
- Search payload: separate local static index artifact containing `bodyText` (or compact snippet
  source text), loaded lazily on first non-empty keyword query.
- Cache loaded search index in-memory for session; preserve current matching/snippet semantics.

**Pros:**

- Largest likely win with minimal product risk.
- Keeps fully client-side/offline behavior (index is still static local asset).
- Cleanly separates non-search and active-search costs.

**Cons:**

- Introduces lazy-load state management and a “search warming” transition.

### Approach C — Build-time precomputed snippet windows only

**What:** preprocess docs into token windows/snippet candidates at build time; ship compact snippet
metadata instead of full body text.

**Pros:** can reduce per-keystroke work.
**Cons:** higher complexity/risk for patch release; more brittle around query flexibility and
maintenance.

### Approach D — Defer hydration (e.g., `client:idle`) plus payload unchanged

**What:** keep data shape, but delay hydration timing.

**Pros:** easy.
**Cons:** payload still large; does not address network/transfer/parse overhead of embedded data.

---

## Recommended approach for `v3.0.1`

Adopt **Approach B** with constrained scope:

1. **Split docs page data into browse index vs search index**
   - Browse index remains embedded in SSR output and powers default page rendering.
   - Search index (with full-text source) is emitted as static JSON and fetched lazily at first
     keyword search.

2. **Preserve current behavior exactly once index is loaded**
   - Same keyword matching requirements.
   - Same `has:` operator behavior.
   - Same snippet extraction behavior and overflow-safe rendering.

3. **Patch-safe search execution optimizations (small)**
   - Pre-normalize immutable fields once per doc record after search index load.
   - Avoid repeated array/object allocations in tight reactive paths where straightforward.

4. **Minor presentation tuning for active search readability**
   - Keep existing card layout, but reduce snippet visual noise (e.g., consistent spacing/typography
     adjustments) without changing information hierarchy or adding controls.

### Why this is appropriate for `v3.0.1`

- Targets the most obvious cost center (embedded full text) with low conceptual risk.
- Avoids new product behavior.
- Preserves offline-first architecture (static asset, no external service).
- Can be implemented/tested in small PR slices and guarded by existing docs-search tests.

---

## Constraints and risks

### Constraints

- Must remain SSR-safe and client-safe (no unguarded browser API usage in shared modules).
- Must keep docs available offline after app assets are cached.
- Must not regress `has:` filtering or snippet correctness.
- Must not add backend dependencies.

### Risks

1. **First-search latency spike** when lazy loading index.
   - Mitigation: preload on input focus (still intent-driven) or show subtle loading state.
2. **Behavior drift** between embedded browse links and lazy search index records.
   - Mitigation: generate both from a single build-time source of truth and validate via tests.
3. **Hydration/search race conditions** if user types before index resolves.
   - Mitigation: deterministic pending state and query replay once index loaded.

---

## Rollout and verification plan

### Implementation-time checks (for future implementation PRs)

1. **Data-shape tests**
   - Assert browse payload excludes full `bodyText`.
   - Assert search index artifact contains expected fields and doc coverage.

2. **Behavior regression tests**
   - Keep/extend existing unit tests in `fullTextSearch.test.ts`.
   - Keep/extend component tests in `DocsIndexSearch.spec.ts`.
   - Keep/extend E2E `frontend/e2e/docs-search.spec.ts` for:
     - baseline browse view,
     - first-keyword query after lazy load,
     - `has:` queries,
     - snippet rendering + overflow protection.

3. **Operational safeguards**
   - Ensure `scripts/link-check.mjs` still passes.
   - Add a smoke assertion that `/docs` renders without the lazy index loaded yet.

### Launch gates for `v3.0.1`

- No functional diffs in docs search expectations except allowed loading transition.
- No SSR errors in `/docs` route.
- No regressions in existing docs search outages/tests.
- Build/test/lint/link-check green in CI.

---

## Acceptance criteria

1. `/docs` default page loads with a materially smaller serialized payload than current baseline,
   with full-text body data removed from initial embedded sections.
2. Search results (including snippets and `has:` operators) remain behaviorally equivalent after
   lazy index load.
3. Existing docs search tests pass; new tests cover lazy-load path and no-regression behavior.
4. Offline behavior remains intact when static assets are cached.
5. No production functionality changes beyond performance/presentation polish.

---

## Recommended implementation slices (future PRs)

1. **Slice 1: Data split + artifact generation**
   - Introduce build/runtime wiring for separate browse vs search datasets.
2. **Slice 2: Client lazy-load integration**
   - Load search index on first keyword query; preserve operators/snippets behavior.
3. **Slice 3: Search-path micro-optimizations + tests**
   - Pre-normalization/memoization improvements; add targeted regressions.
4. **Slice 4: Presentation polish + QA hardening**
   - Minor snippet readability tweaks; finalize E2E assertions and outage guardrails.

---

## Deferred to `v3.1+`

1. More advanced indexing/tokenization strategies (e.g., precomputed token maps or compact
   compressed structures).
2. Ranking improvements beyond current deterministic matching.
3. Larger docs IA/presentation redesign.
4. Optional worker-based search execution if dataset growth warrants it.

---

## Open questions / follow-ups

1. Should first-intent loading trigger on input `focus` or first non-empty `input`?
2. Should operator-only queries (`has:image`) require loading full text at all, or can they remain
   browse-index-only?
3. What minimum UX treatment for “index loading” is acceptable without adding new UI complexity?
4. Should we generate one combined search artifact for all docs pages, or a `/docs`-route-specific
   subset to keep static payload minimal?
