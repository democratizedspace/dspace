# `/docs` index performance and presentation design (`v3.0.1` patch scope)

## Problem statement

The current `/docs` experience is functionally correct, but it likely does more work than needed for
initial page load and for each keystroke once hydrated. The route appears to serialize a rich
per-doc payload (including full stripped body text) into the client component, and the component
recomputes filtering/snippets reactively against that payload.

For `v3.0.1`, we want narrowly scoped improvements that reduce payload and client work while keeping
behavior the same (no new search features, no backend search, no IA/content rewrite).

## Current state analysis (with code anchors)

### Route assembly and payload shaping

- `/docs` is rendered by `frontend/src/pages/docs/index.astro`.
- The route loads **all docs markdown modules** via `Astro.glob('./md/**/*.md')`, then builds a
  `docSearchIndex` map by loading content (`rawContent`/`compiledContent`) and deriving:
  - `features` via `detectDocFeatures`.
  - `bodyText` via `stripMarkdownToText`.
- `docsSections` is built from `frontend/src/pages/docs/json/sections.json`, and each link is
  enriched with `features` and `bodyText`.
- Skills links are merged with quest-tree-derived links through `mergeSkillLinks(...)`.
- The Svelte component is hydrated with `client:load`, meaning JS work starts on initial load,
  regardless of whether the user searches.

Code paths:

- `frontend/src/pages/docs/index.astro`
- `frontend/src/utils/docsSearchFeatures.js`
- `frontend/src/lib/docs/fullTextSearch.ts`
- `frontend/src/utils/docsSkillsIndex.js`

### Client filtering/search/snippet path

- `DocsIndex.svelte` stores a query string and parses it with `parseDocsQuery`.
- For each reactive update:
  - all sections and links are traversed,
  - each link is matched against title/keywords/**full bodyText** + `has:` operators,
  - if keyword query is active and not pure `has:`, snippet generation runs via `findDocSnippet`.
- `findDocSnippet` calls `extractSnippet`, which tokenizes candidate `bodyText` each time.

Code paths:

- `frontend/src/components/svelte/DocsIndex.svelte`
- `frontend/src/lib/docs/fullTextSearch.ts`

### Existing test coverage relevant to this flow

- Component behavior tests:
  - `frontend/src/components/__tests__/DocsIndexSearch.spec.ts`
  - `frontend/__tests__/DocsIndex.test.js`
- Search utility tests:
  - `frontend/src/lib/__tests__/fullTextSearch.test.ts`
  - `tests/docsSearchFeatures.test.ts`
- Route/index coupling and manifest tests:
  - `frontend/__tests__/docsIndexPage.test.js`
- E2E search behavior:
  - `frontend/e2e/docs-search.spec.ts`
- QA checklist references for docs search:
  - `docs/qa/v3.md`

## Measured facts vs. hypotheses

### Measured facts (local repo measurement, no runtime profiler)

Measured on 2026-04-09 with a one-off Node script that reproduces current shaping logic
(`sections.json` links + stripped `bodyText` + detected features):

- Docs markdown files scanned: **104**.
- Slugs indexed from docs markdown frontmatter: **104**.
- Curated links in docs sections: **62**.
- Curated links carrying `bodyText`: **62/62**.
- Aggregate stripped body text attached to curated links: **346,635 chars**.
- Largest single linked doc `bodyText`: **32,294 chars**.
- Serialized JSON size for curated sections payload (with features + bodyText): **363,560 bytes**.
- After Skills auto-discovery merge (quest trees 19, curated skills links 17, auto-added 4), final
  links become **66** and serialized payload becomes **397,637 bytes**.

### Informed hypotheses (not directly benchmarked here)

- Hydrating with `client:load` plus ~400 KB of JSON likely delays interactivity on slower devices.
- Re-running `findDocSnippet` for many links on each keystroke likely causes avoidable CPU churn,
  especially because tokenization is repeated per query.
- Route-side `buildDocIndex` doing per-doc content extraction on the SSR request path can raise
  response-time variance under load.

## Likely bottlenecks and data-shape inefficiencies

1. **Over-serialized initial payload**
   - Full `bodyText` is sent for every docs link on first load, even if the user never searches.
2. **Eager hydration cost**
   - `client:load` pays hydration/startup cost before user intent is known.
3. **Per-keystroke repeated work**
   - Query changes trigger full section/link traversal and snippet lookup repeatedly.
4. **Snippet extraction cost shape**
   - `extractSnippet` tokenizes `bodyText` on-demand for each candidate link and keyword set.
5. **Route assembly doing all-doc content extraction**
   - Current approach extracts content for all docs before rendering index payload.
6. **Presentation density/noise under search**
   - Snippet text under many results can become visually dense; equal visual weight for all sections
     can reduce readability when search is active.

## Presentation / UX rough edges (patch-safe)

- The default landing state and active-search state currently share the same heavy payload path.
- Search results can become text-heavy quickly due to snippets under many cards.
- Search feedback is binary (results/no results) with limited perceived-progress cues when typing on
  lower-end devices.

These are presentation/perceived-responsiveness issues, not feature gaps.

## Goals

- Reduce `/docs` initial client payload for non-search landing use.
- Reduce hydration and per-keystroke CPU work while preserving current search semantics.
- Keep search fully client-side/offline-capable.
- Keep implementation safe for `v3.0.1` (small, testable, low regression risk).
- Improve clarity/readability of search results without changing ranking/operators/features.

## Non-goals

- No new search operators, filters, ranking, stemming, fuzzy matching, or relevance model changes.
- No backend/external search service.
- No docs taxonomy or content rewrite.
- No major UI redesign or route architecture rewrite.

## Constraints and risks

- Must preserve SSR safety and offline-first behavior.
- Must keep docs/quest skill-link merge behavior intact.
- Existing tests cover behavior; optimizations must avoid snapshot/selector churn unless necessary.
- Patch-release risk if we introduce new generated artifacts without robust staleness checks.

## Candidate approaches considered

### Approach A — Keep one payload, micro-optimize client only

**Summary:** Retain current serialized data; only optimize in `DocsIndex.svelte` (memoization,
query throttling, pre-tokenization in memory).

**Pros**

- Lowest structural change.
- Minimal server/build impact.

**Cons**

- Does not address the largest issue (initial payload size).
- Hydration still carries full body corpus.

**Fit for `v3.0.1`:** Safe but leaves major wins unrealized.

### Approach B — Two-tier data model (light manifest + lazy search corpus)

**Summary:** Ship only light link metadata initially (title/href/keywords/features). Load heavy
search corpus (`bodyText`-backed index) lazily on first non-empty keyword search.

**Pros**

- Directly cuts initial payload and hydration parse cost.
- Keeps offline/client-only behavior (corpus still bundled locally as static asset/module).
- Natural split between landing and active-search state.

**Cons**

- Requires careful UX for first-search load (avoid “visual lag” perception).
- Requires new artifact/module boundary and cache lifecycle.

**Fit for `v3.0.1`:** Strong fit if scoped narrowly (no feature changes).

### Approach C — Build-time precomputed compact search artifact

**Summary:** Move markdown stripping/feature detection/snippet token prep to build step, emit a
compact generated search dataset consumed by `/docs`.

**Pros**

- Removes repeat extraction work from route request path.
- Allows tighter, purpose-built data shape.

**Cons**

- Adds build pipeline complexity.
- Artifact freshness and test coverage must be explicit.

**Fit for `v3.0.1`:** Good, if introduced incrementally and validated with CI checks.

### Approach D — No lazy split, but aggressive compression/segmentation of bodyText in-props

**Summary:** Keep current prop transport but compress/chunk `bodyText` and decode in client.

**Pros**

- Avoids additional fetch/module load boundary.

**Cons**

- Added complexity and decode CPU; poor tradeoff for patch release.
- Still pays hydration overhead for carrying large encoded blobs.

**Fit for `v3.0.1`:** Not recommended.

## Recommended approach (`v3.0.1`)

Adopt a **hybrid of B + limited C** with strict scope:

1. **Ship a lightweight initial sections payload for default `/docs` landing**
   - Keep `title/href/keywords/features`.
   - Exclude `bodyText` from initial hydrated props.

2. **Load a static local search corpus lazily on first keyword search**
   - Trigger only when parsed query has at least one keyword.
   - Keep `has:`-only filtering working immediately from light metadata.
   - Cache corpus in-memory for subsequent queries.

3. **Precompute the corpus shape to avoid repeated on-request markdown stripping**
   - Build-time (or prebuild script) generates compact `{ slug -> searchable text/snippet basis }`.
   - `/docs` route no longer extracts all doc bodies at request time.

4. **Patch-safe presentation polish during active search (no feature changes)**
   - Keep two-line snippet clamp, but reduce visual noise (e.g., lower contrast/spacing tuning and
     clearer separation between title pills and snippet text).
   - Add a minimal “search index loading…” transient state for first lazy load to improve perceived
     responsiveness.

### Why this recommendation is appropriate for `v3.0.1`

- It targets the largest observed inefficiency (initial payload size) with minimal product-surface
  change.
- It preserves all existing query semantics (`has:` behavior, snippet logic, section structure).
- It is decomposable into small PR-sized slices with clear tests.
- It avoids high-risk infra changes (no backend search, no external dependency).

## Must-have vs. nice-to-have vs. deferred

### Must-have (`v3.0.1`, safest)

- Light initial payload (remove `bodyText` from initial props).
- Lazy-load local search corpus on first keyword query.
- Preserve `has:`-only searches without requiring corpus load.
- Add/update tests proving semantic parity.

### Nice-to-have (`v3.0.1`, still plausible)

- Build-time generated compact corpus artifact to remove request-path extraction cost.
- Minor snippet presentation tuning for readability in dense result sets.
- Simple telemetry/debug marker for one-time corpus load duration (dev/test only).

### Deferred (`v3.1+`)

- Worker-thread/off-main-thread search execution.
- Incremental indexing and advanced scoring/ranking.
- Query-result virtualization for very large docs sets.
- Semantic/taxonomy/content redesign of docs structure.

## Rollout and verification plan

1. **Implementation behind a local feature flag or guarded code path** (short-lived during rollout)
   so fallback to current in-memory behavior is possible during QA.
2. **Regression test updates**:
   - Unit: query parsing/snippet parity unchanged.
   - Component: `has:` behavior works before corpus load; keyword search works after load.
   - E2E: existing docs-search specs pass with lazy loading.
3. **Operational checks**:
   - Compare serialized initial payload size before/after with a deterministic script in CI.
   - Verify no SSR browser-API violations introduced.
4. **Launch gate for patch release**:
   - `node scripts/link-check.mjs`
   - `npm run lint`
   - targeted docs/search tests + existing docs search E2E suite (or `SKIP_E2E=1` CI-equivalent path
     where browser install is unavailable).

## Acceptance criteria

- `/docs` default load no longer serializes full per-doc `bodyText` into component props.
- Search behavior parity is preserved for:
  - title/keyword/body matches,
  - `has:link`/`has:image`,
  - snippet rendering rules and empty-state behavior.
- First keyword search loads local corpus once; subsequent searches reuse it.
- Route request path no longer performs full markdown body extraction for every docs page (if
  precomputed corpus slice is included in this patch).
- Existing docs search tests remain green (updated only where loading-state timing requires it).

## Recommended implementation slices (2–4 minimal PRs)

1. **Slice 1: Data contract split**
   - Introduce light sections payload type (no `bodyText`).
   - Keep UI behavior identical for non-keyword and `has:` flows.

2. **Slice 2: Lazy corpus loader in `DocsIndex.svelte`**
   - Load static corpus on first keyword query.
   - Cache locally; keep snippet generation semantics unchanged.

3. **Slice 3: Build-time corpus generation**
   - Add deterministic generator + tests that validate artifact freshness/shape.
   - Route consumes generated artifact rather than per-request extraction.

4. **Slice 4 (optional in patch): presentation polish**
   - Small CSS/readability refinements for snippet-heavy search state.

## Open questions and explicit follow-ups (deferred)

- Should corpus load be via dynamic import chunk or static JSON fetch, given caching/offline
  tradeoffs in current Astro build outputs?
- Do we want a hard payload budget check in CI specifically for `/docs` HTML + inline JSON?
- Is there enough value in pre-tokenizing snippet windows at build time, or is runtime extraction
  acceptable once lazy loading is in place?
- Should we adopt `client:idle` (or conditional hydration) after payload split, or keep
  `client:load` for deterministic immediate interactivity?

## Design-only note

This document intentionally proposes changes without implementing production behavior in this PR.
