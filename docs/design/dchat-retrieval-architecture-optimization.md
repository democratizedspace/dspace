# DSPACE v3 Design: dChat Retrieval Architecture Optimization

**Status:** Draft  
**Audience:** Maintainers + contributors working on chat retrieval/indexing/ranking  
**Scope:** Backend/retrieval architecture unlocks for dChat grounding quality at scale

## 1) Problem statement

dChat can already produce useful grounded responses for some docs and changelog prompts, but that is
not equivalent to a production-robust retrieval system.

Current behavior shows that DSPACE can often pull relevant docs/changelog excerpts and synthesize a
reasonable answer. That is a meaningful baseline. The risk is that baseline quality on a narrow
class of prompts can mask structural retrieval gaps that appear as the corpus and query diversity
expand.

DSPACE-specific retrieval pressure includes:

- Exact route/path references (`/quests`, `/docs`, `/processes/:processId`, `/inventory/item/:itemId`).
- Fine-grained version references (`v3`, `v3.0.0`, `v3.0.1`, and future patch lines).
- Entity-level identifiers (quest tree IDs, item IDs, process IDs, slug-like route params).
- Mixed context questions that combine static docs/changelog with live player state.
- Queries that require both literal token matching and semantic intent matching.

In short: “RAG works on changelog questions” proves basic capability, not robustness under growing
source volume, mixed query classes, and authority/freshness conflicts.

---

## 2) Current likely strengths and likely gaps

This section intentionally infers from repo-observable behavior and tests, without assuming hidden
infrastructure.

### What seems to already work

- dChat grounding already includes docs/changelog retrieval that is useful for summarization and
  route/release references.
- Retrieval includes route-aware and release-aware logic (for example route/changelog intents and
  release-state preference behavior).
- The system can synthesize across selected sources rather than only quoting a single chunk.
- Current docs retrieval includes deterministic source metadata and comparison/debug affordances,
  which is a strong foundation for future retrieval observability.

### What likely becomes fragile at scale

- Lexical edge cases can be missed if exact token handling is not a first-class stage (IDs,
  routes, version strings, literal error snippets).
- First-pass relevance scoring can still surface “related but generic” chunks over “exact answer
  evidence” chunks.
- Mixed-source prompts (docs + state + release context) can retrieve incoherent bundles without
  explicit query-class source planning.
- Stale or weaker sources can dominate unless freshness/authority are formal ranking signals, not
  only heuristics.
- Uniform chunking can lose local meaning in changelog sections, route docs, and quest/process
  semantics docs.

---

## 3) Hybrid retrieval design (lexical + semantic)

### Why DSPACE needs both

DSPACE has both token-sensitive and intent-sensitive queries:

- Token-sensitive: route paths, changelog versions, process IDs, quest identifiers, exact phrasing
  from release notes or errors.
- Intent-sensitive: paraphrased gameplay questions, evaluation prompts (“is this strictly better?”),
  synthesis or critique prompts over multiple docs.

A single retrieval mode underperforms one of those groups.

### Where lexical retrieval must dominate

- Exact route/path mentions (`/quests/manage`, `/processes/launch-rocket`, `/docs/routes`).
- Version strings (`3.0.1`, `v3.0.0`, dated changelog anchors).
- Quest/item/process identifiers and slug tokens.
- Literal patch-note wording and literal error text.

### Where semantic retrieval must dominate

- Paraphrased gameplay intent (“How do I move forward when a process is blocked?”).
- Design-doc intent and tradeoff queries.
- Evaluative phrasing (“Is 3.0.1 strictly better?”) where evidence is distributed.
- Summaries and critiques that do not reuse exact source wording.

### Proposed high-level retrieval flow

1. **Query classification (lightweight):** infer likely query class and required source families.
2. **Lexical candidate retrieval:** BM25/term index over chunk text + metadata terms.
3. **Semantic candidate retrieval:** embedding similarity over the same chunk universe.
4. **Candidate merge + dedupe:** union candidate set with source/anchor/entity dedupe.
5. **Rerank stage:** apply learned/heuristic reranker with authority and freshness features.
6. **Answer assembly set selection:** select diverse top-K with coverage constraints.

### Recall/precision tradeoff controls

- Raise lexical weight for route/version/id-heavy queries.
- Raise semantic weight for paraphrase/evaluation/summary queries.
- For mixed queries, enforce minimum per-source-family coverage before final top-K truncation.

---

## 4) Reranking design (separate stage)

### Why first-pass retrieval is insufficient

First-pass retrieval is optimized for recall. dChat answer quality depends on precision at the top
of the final context window. The system needs an explicit reranker that can distinguish “generally
related” from “directly answer-bearing” evidence.

### Reranking objectives

- Prioritize exact answer-bearing chunks over adjacent context.
- Prefer authoritative/canonical sources when multiple plausible chunks compete.
- Improve mixed-context answerability by balancing source families intentionally.

### Candidate rerank signals

- Query↔chunk semantic relevance score.
- Exact-term overlap score (especially route/version/ID tokens).
- Source authority (canonical docs/routes/changelog > incidental mention).
- Source freshness (newer releases when query asks “latest/current”).
- Source-type compatibility with query class.
- Conflict indicators (chunk contradicts higher-authority source).

### Reranker placement and inputs

- Place reranker **after** lexical/semantic merge and **before** final answer assembly.
- Inputs should include:
  - Query class + extracted cues (route/version/entity/state intent).
  - Candidate chunk text.
  - Candidate metadata (source type, release, updated-at, canonicality, route/entity tags).
  - Initial lexical and semantic scores.

---

## 5) Contextual chunking / contextual retrieval

### Why naive chunking fails

Even with the right document retrieved, naive fixed-size chunks can separate critical context:

- Changelog headings detached from bullet details.
- Route docs detached from canonical path tables.
- Quest/process semantics detached from requirement and IO explanations.

### Source-specific chunking rationale

Different sources in DSPACE have different structure:

- Changelog: release-scoped, heading-heavy, version/date-sensitive.
- Route docs (`docs/ROUTES.md`): table + canonical path semantics.
- Design docs: long narrative sections with decision boundaries.
- Quest/item/process docs/data: entity-centric and often ID/slug-sensitive.

### Proposed contextual chunking patterns

- Section-aware chunking at heading boundaries.
- Heading-prepended chunk context (title + section path).
- Metadata injection per chunk (route tags, version tag, entity tags).
- Optional neighbor-window retrieval for small chunks (retrieve adjacent chunks when selected).

### Tradeoffs

- Larger chunks improve local meaning but reduce rank precision and increase token cost.
- Smaller chunks improve rank precision but can lose decision-critical context.

### DSPACE-oriented chunking policy (initial)

- **Changelog:** chunk by release section + subsection bullets; attach release date/version metadata.
- **Routes doc:** preserve canonical route index table chunks with explicit route-type metadata.
- **Design docs:** chunk by second-level section with heading lineage.
- **Quest/item/process docs:** entity-scoped chunks with normalized entity IDs/slugs.
- **Live player state:** compact, structured field-level chunks (inventory, active quest/process,
  completion state), indexed separately from static docs.

---

## 6) Metadata-aware retrieval and filtering

### Required metadata dimensions

- Source type: changelog, design doc, route doc, quest data, item data, process data, player state.
- Version/release marker.
- Entity type + identifiers (quest/item/process/doc).
- Route/path metadata.
- Freshness (`updatedAt`, release date, generatedAt/indexedAt).
- Canonical vs derived/generated source.
- Official built-in vs user-authored/custom content.
- Live player-state vs static repository content.

### Retrieval-time metadata usage

- Hard filters when query explicitly requires scope (for example “my inventory”, “latest update”).
- Soft filters/boosts when intent is implicit (for example “current status”).
- Query-class defaults to avoid irrelevant source family over-selection.

### Ranking-time metadata influence

Even when not hard-filtered, metadata should modulate rank:

- Authority boosts for canonical route/docs/changelog sources.
- Freshness boosts for “latest/current” language.
- Compatibility boosts for source types aligned with query class.

### Conflict handling

When sources disagree:

1. Prefer higher-authority source type.
2. Within same authority, prefer fresher source.
3. Preserve older conflicting source as secondary evidence only when explicitly asked for history.

### Preventing non-canonical dominance

- Cap top-K contribution from low-authority source families.
- Require at least one canonical source in final context for factual queries.
- Penalize stale changelog anchors for “current/latest” intents unless user asks historical-only.

---

## 7) Freshness and authority rules (DSPACE-specific)

1. **Latest changelog vs older release docs**
   - If query includes “latest/current/now”, prioritize newest release chunks and newest changelog
     notes/annotations.
   - Keep older release chunks only as historical context, not primary answer evidence.

2. **Canonical route docs vs passing mentions**
   - For route/path questions, prefer canonical route catalog chunks from `docs/ROUTES.md`-derived
     route index over incidental route mentions in other docs.

3. **Live player state vs static docs for “my” queries**
   - If query is about personal progress/inventory/process status, prioritize live state sources.
   - Use static docs as interpretation layer (rules/explanations), not as substitute for player data.

4. **Official built-in vs user-authored content**
   - Default to official built-in content for general factual questions.
   - Elevate user-authored/custom content when query explicitly references custom entities or current
     local game state.

5. **Immutable historical changelog bodies vs render-time notes**
   - Preserve historical changelog markdown as immutable source content.
   - Treat changelog notes/annotations as additive context with newer-facts priority for
     “current/latest” interpretations.

---

## 8) Retrieval plans by query class

### A) Factual docs/changelog lookup
- Preferred sources: canonical docs + changelog.
- Candidate strategy: lexical-first + semantic expansion.
- Metadata filters: source type in {doc, changelog}; freshness boost if “latest/current”.
- Rerank emphasis: exact match + authority + freshness.
- Major risk: stale release chunk outranks latest source.

### B) Route-specific troubleshooting
- Preferred sources: route catalog + relevant feature docs.
- Candidate strategy: lexical route token retrieval first.
- Metadata filters: route-tag required/boosted.
- Rerank emphasis: exact path overlap, canonical route authority.
- Major risk: semantically similar non-route docs outrank canonical route chunks.

### C) Quest/item/process lookup
- Preferred sources: entity docs/data + related process semantics docs.
- Candidate strategy: lexical entity-ID/slug retrieval + semantic fallback.
- Metadata filters: entity type and entity ID when parseable.
- Rerank emphasis: ID overlap, entity match confidence, source authority.
- Major risk: near-name entity confusion.

### D) Evaluative/product-feedback questions
- Preferred sources: changelog + design docs + release-state docs.
- Candidate strategy: semantic-heavy with lexical anchors for cited versions.
- Metadata filters: include multiple source families intentionally.
- Rerank emphasis: coverage diversity + authority ordering.
- Major risk: one-source overfitting that misses tradeoffs.

### E) Mixed docs + live state queries
- Preferred sources: live player state + docs/changelog.
- Candidate strategy: dual-lane retrieval (state lane + static lane), then merge.
- Metadata filters: state source required when user asks about “my” progress/inventory.
- Rerank emphasis: state relevance first, then policy/guide interpretation docs.
- Major risk: answering from generic docs while ignoring actual player state.

### F) Lore/personality-flavored but factual questions
- Preferred sources: factual docs/changelog + optional lore/persona context.
- Candidate strategy: semantic retrieval with factual floor constraints.
- Metadata filters: require at least one factual canonical source.
- Rerank emphasis: factual grounding before stylistic sources.
- Major risk: style-forward answer with weak factual evidence.

---

## 9) Indexing and storage considerations

### Key principle

A vector store can improve semantic recall, but it is not sufficient by itself. DSPACE needs a
composed retrieval substrate:

- Lexical index for exact tokens/routes/versions/IDs.
- Semantic index for paraphrase and concept matching.
- Metadata index for filtering, authority, and freshness logic.

### Architectural considerations

- Keep lexical indexes first-class (BM25/token index or equivalent).
- Consider separate logical indexes by source family (static docs/changelog, route catalog,
  structured entities, live player state) to simplify query-class planning.
- Use incremental indexing for static docs/changelog updates and fast invalidation for generated
  packs.
- Treat live local player-state indexing as a separate, low-latency pipeline with stricter privacy
  boundaries and short refresh cycles.

### DSPACE-specific constraints

- Current architecture includes generated docs RAG artifacts and metadata provenance fields.
- DSPACE patterns emphasize local/offline-friendly behavior and local game-state authority; retrieval
  design should avoid requiring always-online central indexing for core flows.
- Update cadence differs by source type (static docs/changelog less frequent, player state frequent),
  so indexing/update policies should differ accordingly.

---

## 10) Observability and debugging

Retrieval quality must be diagnosable at stage granularity.

### Retrieval diagnostics to add

- Query trace ID with stage-by-stage logs:
  - query classification output
  - lexical top-K
  - semantic top-K
  - merged candidate set
  - reranked top-K + selected context window
- Source-type distribution summary in selected context.
- “Why selected” explanation fields per chunk (score components + metadata boosts/penalties).
- Query-class tags attached to traces and eval runs.

### Debugging failure patterns

1. **Missing retrieval (recall failure)**
   - Expected chunk absent from lexical and semantic candidate sets.
2. **Bad ranking (precision failure)**
   - Correct chunk present in candidate set but not in final top-K.
3. **Stale authority choice**
   - Older/lower-authority chunk outranks canonical fresher chunk.
4. **Chunking/context loss**
   - Right document chosen, but answer-critical neighboring context missing.
5. **Synthesis overreach**
   - Retrieval is adequate, but answer extrapolates beyond evidence.

This instrumentation should make each failure mode distinguishable instead of collapsing into “bad
answer” as a single opaque class.

---

## 11) Evaluation plan (scenario-based)

Use a query-suite with explicit expected source behaviors and failure attribution.

### Scenario 1: “What’s the latest update in the game?”
- Success: latest release/changelog context is primary and clearly time-scoped.
- Failure: older release dominates or mixed timeline without clear recency.
- Likely miss type: authority/freshness ranking.
- Catch metric/rubric: top-3 source freshness score + human recency correctness check.

### Scenario 2: “Please list the changes in 3.0.1”
- Success: version-specific retrieval (3.0.1 patch content) with minimal spillover.
- Failure: v3.0.0 or unrelated releases dominate.
- Likely miss type: lexical recall/ranking on version token.
- Catch metric/rubric: version precision@K and answer version contamination rate.

### Scenario 3: “Is 3.0.1 strictly better?”
- Success: balanced evaluative synthesis using authoritative release evidence.
- Failure: purely opinionated output without evidence mix.
- Likely miss type: semantic retrieval coverage + rerank diversity.
- Catch metric/rubric: evidence diversity rubric + grounded-claim rate.

### Scenario 4: “How could the 3.0.1 notes be better?”
- Success: critique grounded in release-note content plus actionable improvements.
- Failure: generic critique that does not reference retrieved release details.
- Likely miss type: semantic alignment and chunk context quality.
- Catch metric/rubric: critique-specific grounding rubric.

### Scenario 5: Route query using `/quests` or `/processes`
- Success: canonical route/source answers with precise path guidance.
- Failure: wrong/imagined routes or non-canonical mentions.
- Likely miss type: lexical + authority ranking.
- Catch metric/rubric: route exactness metric and canonical-source-first check.

### Scenario 6: Mixed query (changelog + live quest/inventory/process context)
- Success: answer combines current player state with relevant release/doc context.
- Failure: responds from static docs only, ignoring player state.
- Likely miss type: metadata/source planning.
- Catch metric/rubric: mixed-source coverage check (state + static required).

### Scenario 7: Exact-match should beat broad semantic similarity
- Success: literal token query retrieves exact route/version/entity chunk first.
- Failure: semantically similar but token-mismatched chunks dominate.
- Likely miss type: lexical underweighting.
- Catch metric/rubric: exact-token hit@1 for route/version/entity benchmark set.

### Scenario 8: Semantic rescue for paraphrase
- Success: paraphrased request retrieves correct conceptually aligned chunk despite low token overlap.
- Failure: no relevant chunks due to lexical mismatch.
- Likely miss type: semantic recall.
- Catch metric/rubric: paraphrase recall@K and answerability pass rate.

### Evaluation operating model

- Maintain a fixed “golden query suite” across query classes.
- Track per-class regressions, not only aggregate score.
- Report misses by failure bucket: recall, ranking, metadata, chunking, authority.
- Require retrieval-trace artifacts for failed eval cases.

---

## 12) Prioritized follow-up implementation ideas

### P0 — Indexing/chunking

1. Define source-type chunking policies and metadata schema.
2. Regenerate docs/changelog chunks with heading-aware contextual metadata.
3. Add route/version/entity tags to chunk metadata at index build time.

### P1 — Hybrid retrieval + reranking

1. Add dual-lane lexical + semantic retrieval interface.
2. Implement merge/dedupe + explicit rerank stage.
3. Add query-class weighting profiles (route/version/entity vs semantic/evaluative).

### P1 — Metadata + authority rules

1. Implement authority/freshness score components centrally.
2. Add hard-filter rules for “my progress/inventory” queries (state lane required).
3. Add conflict resolution policy with deterministic tie-breakers.

### P2 — Observability/debugging

1. Add retrieval trace payload model and sampling controls.
2. Build top-K inspection tooling and score-explanation view.
3. Add source-distribution diagnostics by query class.

### P2 — Evaluation harness

1. Implement scenario suite above with per-class dashboards.
2. Add regression gates for route exactness, version precision, and mixed-source coverage.
3. Add failure-bucket labeling workflow tied to retrieval traces.

---

## Closing note

This proposal intentionally treats retrieval quality as a systems problem, not an embeddings-only
problem. For dChat quality at scale, indexing strategy, chunk design, metadata, ranking,
authority/freshness policy, and observability must evolve together.
