# dChat Retrieval Architecture Optimization

**Status:** Proposed  
**Audience:** Maintainers and contributors working on dChat backend/retrieval quality  
**Scope:** Retrieval, indexing, ranking, metadata strategy, and retrieval eval/observability for `/chat` as DSPACE scales

## 1) Problem statement

dChat can already produce useful grounded responses for many changelog and docs questions, but “works on
changelog prompts” is not the same as “production-robust retrieval.”

A robust retrieval stack must keep working when query complexity and corpus diversity increase:

- exact route/path terms (`/quests`, `/processes/:processId`, `/docs/routes`) must survive tokenization,
  typo noise, and document growth.
- versioned release references (`v3`, `v3.0.1`, future patch lines) must resolve to the right scope and
  freshness context.
- entity-specific asks (quest/item/process names and IDs) must prefer exact answer-bearing evidence over
  broad “about this area” text.
- mixed-source asks (docs + player state) must avoid incoherent candidate sets.
- stale or lower-authority text must not outrank newer or canonical sources.

In short: retrieval quality is a systems problem (indexing + metadata + ranking + authority + freshness),
not a single prompt-quality problem.

## 2) Current likely strengths and likely gaps

This section is intentionally based on repository-observable behavior and design artifacts, not hidden
implementation assumptions.

### What seems to already work

- dChat has usable grounding for docs/changelog-style summarization and can produce source-aware responses.
- route-scoped and release-scoped information is present in repo-readable corpora (for example
  `docs/ROUTES.md` and changelog/doc content), so useful retrieval is possible.
- answer synthesis across multiple retrieved snippets appears feasible and already part of current chat
  behavior.

### What likely becomes fragile at scale

- lexical edge cases (exact route strings, version tokens, IDs, literal error snippets) can be underpowered
  if semantic retrieval dominates.
- first-pass candidate ranking likely mixes “related but generic” chunks with “directly answer-bearing”
  chunks, reducing precision.
- mixed-source questions (static docs + local player state) can produce incoherent bundles without explicit
  source-type planning.
- stale or secondary mentions can crowd out canonical docs/changelog material when authority/freshness are
  not weighted.
- naive fixed-size chunking can hide critical local context (heading/release/entity scope) even when the
  right file is in the candidate set.

## 3) Hybrid retrieval design (lexical + semantic)

DSPACE needs both retrieval modes because user questions span exact literals and paraphrased intent.

### Why lexical retrieval is required

Lexical matching should carry primary weight when the query includes literal tokens such as:

- route/path terms (`/quests`, `/docs/changelog`, `/processes/launch-rocket`)
- version strings (`v3.0.1`, `20260401`, release tags)
- entity identifiers (quest IDs, process IDs, item IDs/slugs)
- literal patch-note or error wording

### Why semantic retrieval is required

Semantic matching should rescue recall when users do not use canonical wording, such as:

- paraphrased gameplay/help asks
- design-intent questions (“what was the goal of this change?”)
- evaluative framing (“is 3.0.1 strictly better?”)
- critique/summarization requests over long docs

### Proposed high-level retrieval flow

1. **Query classification (lightweight):** detect literal-heavy vs intent-heavy signals and source-type hints.
2. **Lexical retrieval:** retrieve top-k by BM25/keyword index (or equivalent) across eligible source sets.
3. **Semantic retrieval:** retrieve top-k embedding candidates across the same or class-specific source sets.
4. **Merge + dedupe:** union by source ID/chunk ID with score normalization.
5. **Rerank stage:** apply cross-signal ranking (semantic, lexical overlap, authority, freshness, source fit).
6. **Answer assembly:** use top-N reranked chunks with explicit source diversity and authority guards.

### Recall/precision operating guidance

- **Literal-heavy query:** lexical recall/score dominates; semantic acts as a backstop.
- **Intent-heavy query:** semantic recall dominates; lexical overlap remains a precision signal.
- **Mixed query:** require minimum coverage across required source classes before answer synthesis.

## 4) Reranking design

First-pass retrieval is recall-oriented and will often over-include. dChat needs an explicit reranking stage
for precision and authority control.

### What reranking should fix

- separate direct answer-bearing chunks from merely related context
- prefer canonical/authoritative evidence when multiple chunks look plausible
- improve mixed-context answerability (for example docs + state) by ordering coherent evidence bundles

### Candidate reranking signals

- query↔chunk semantic relevance score
- exact-term overlap (especially for route/version/ID queries)
- source authority weight (canonical docs/routes/changelog > incidental mentions)
- freshness score (latest release notes favored unless query explicitly targets older release)
- source-type compatibility (question class vs source class)
- intra-bundle coherence (penalize contradictory or redundant near-duplicates)

### Placement in pipeline

Reranking should run after lexical+semantic merge and before final context truncation. The reranker should
receive:

- normalized first-pass scores
- chunk metadata (source type, version, updated-at, canonical flag, entity tags)
- query classification labels
- optional conflict markers (same entity/version with conflicting claims)

## 5) Contextual chunking / contextual retrieval

Naive chunking can fail even when the correct document is retrieved: answer-critical context (section scope,
version scope, route scope) may be split away.

### Why source-specific chunking is needed

- **Changelog docs:** need release-anchored chunks (release header + bullet scope).
- **Route docs (`docs/ROUTES.md`):** need route-table and section-aware chunks preserving exact path strings.
- **Quest/item/process docs/data:** need entity-scoped chunks preserving IDs/slugs and key fields.
- **Design docs:** need heading-aware chunking so intent/rationale stays attached to proposals.

### Contextual chunking strategy

- prepend chunk-local contextual header (source type, title, heading path, release/entity tag)
- use section-aware boundaries instead of fixed-token slices where possible
- attach heading-aware labels for reranking/debug readability
- enrich metadata with route/version/entity tags at index time

### Tradeoffs

- larger chunks improve coherence but reduce ranking precision and increase token cost
- smaller chunks improve precision but risk losing local meaning

### Proposed DSPACE-oriented chunk policy

- changelog/docs markdown: heading-bounded chunks with small overlap
- route catalog: row/table-preserving chunks plus route-string exact-index entries
- quest/item/process structured data: entity-record chunks with normalized alias tokens
- player-state snapshots: schema-bounded chunks (inventory/progress/process timers) with strict recency tags

## 6) Metadata-aware retrieval and filtering

Metadata should be first-class in retrieval, not an afterthought.

### Required metadata dimensions

- source type: changelog, design doc, route doc, quest data, item data, process data, player state
- version/release (release slug/tag/date)
- entity type and ID (quest/item/process/doc)
- route/path tags
- freshness (`updatedAt`, release date, ingest timestamp)
- canonical vs derived/generated
- official/built-in vs custom/user-authored
- live player-state vs static repo content

### Retrieval-time use

- hard filters when user intent is explicit (for example “my inventory”, “in 3.0.1”, “route /processes”).
- soft weighting when intent is broad (metadata contributes to rank, not strict exclusion).

### Conflict handling

When sources disagree:

1. prefer canonical + fresher source within same source class.
2. if cross-class disagreement (for example static docs vs live state), use query intent to decide primary
   authority.
3. surface uncertainty or explicit comparison when conflict remains unresolved.

### Preventing non-canonical dominance

Apply authority priors in reranking and enforce max-candidate quotas per low-authority source class so older
or derivative content cannot flood top-N.

## 7) Freshness and authority rules (DSPACE-specific)

The retrieval layer should encode explicit priority rules:

1. **Latest release by default:** “latest update” prefers newest changelog/release docs unless query pins an
   older version.
2. **Canonical route source:** route/path answers prioritize `docs/ROUTES.md` and route-specific docs over
   incidental mentions.
3. **Player-state precedence for personal queries:** “my progress/inventory/processes” prioritizes live local
   state over static docs, with docs used only for semantics/explanations.
4. **Official over custom by default:** unless user explicitly asks about custom content, official built-in
   docs/data rank first.
5. **Historical changelog immutability:** published historical changelog bodies remain immutable; newer context
   should be applied as retrieval-time notes/annotations (for example render-time note layers), not edits to
   historical markdown.

## 8) Retrieval plans by query class

### A) Factual docs/changelog lookup

- **Preferred sources:** changelog + docs markdown + route docs
- **Strategy:** lexical-first + semantic backfill
- **Filters:** version/release constraints if present
- **Rerank emphasis:** exact overlap + freshness + authority
- **Major risks:** stale release chosen, generic summary chunk outranking exact release chunk

### B) Route-specific troubleshooting

- **Preferred sources:** `docs/ROUTES.md`, route docs, relevant troubleshooting docs
- **Strategy:** lexical-heavy path token retrieval, semantic for paraphrase
- **Filters:** route/path/entity tags
- **Rerank emphasis:** exact route token overlap, canonical route authority
- **Major risks:** path hallucination, route alias confusion, legacy path drift

### C) Quest/item/process lookup

- **Preferred sources:** structured quest/item/process sources + docs pages
- **Strategy:** lexical ID/name retrieval + semantic fallback for paraphrases
- **Filters:** entity type + ID/name aliases
- **Rerank emphasis:** entity-ID exactness, source authority, section relevance
- **Major risks:** near-name collisions, custom vs built-in ambiguity

### D) Evaluative/product-feedback questions

- **Preferred sources:** changelog, design docs, QA docs (as configured)
- **Strategy:** semantic-forward + lexical anchor retrieval for versions/features
- **Filters:** release/version where present
- **Rerank emphasis:** evidence breadth + freshness + explicit version grounding
- **Major risks:** high-level opinions without concrete evidence, version drift

### E) Mixed docs + live player state

- **Preferred sources:** live player state + docs/changelog/process/quest refs
- **Strategy:** two-lane retrieval (state lane + static lane), then joint rerank
- **Filters:** session/state recency + relevant static source types
- **Rerank emphasis:** state relevance first for personal facts; docs for explanatory context
- **Major risks:** stale state snapshot, static docs overriding personal state

### F) Lore/personality-flavored but factual

- **Preferred sources:** lore/persona docs plus canonical factual sources
- **Strategy:** semantic retrieval with mandatory factual-source floor
- **Filters:** retain factual source classes even with style/lore phrasing
- **Rerank emphasis:** factual authority before style fit
- **Major risks:** style-over-fact drift

## 9) Indexing and storage considerations

A vector database can help semantic recall, but it is insufficient alone.

### Architecture considerations

- maintain lexical indexes for exact-match needs (paths, IDs, versions, literals)
- maintain semantic indexes for paraphrase and intent matching
- consider separate logical indexes (or partitions) by source type to reduce cross-domain noise
- build incremental indexing for changed docs/data rather than full reindex on every update

### Update cadence and source classes

- static repo content can follow build/deploy indexing cadence
- changelog/docs updates should trigger targeted incremental reindex by file scope
- local player-state indexing should be session-local and lightweight, with strict recency handling

### DSPACE constraints to respect

- current architecture includes strong client-side/local-state patterns and offline-aware concerns; retrieval
  design should avoid making correctness depend entirely on always-on remote services.
- if remote retrieval services are introduced, degrade gracefully to deterministic local fallback for critical
  route/docs grounding.

## 10) Observability and debugging

Retrieval failures must be diagnosable without guesswork.

### Recommended diagnostics

- retrieval trace logging per query (classification, filters, top-k by stage)
- candidate inspection by stage (lexical top-k, semantic top-k, post-merge, post-rerank)
- source-type distribution report for final context window
- “why selected” explanation fields per chosen chunk
- query-class tags attached to traces for aggregate analysis

### Failure-debug taxonomy

For bad answers, classify quickly as one of:

- **missing retrieval (recall):** needed source never appears in candidate sets
- **bad ranking (precision):** needed source retrieved but outranked
- **authority/freshness miss:** older/non-canonical source chosen
- **chunking/context loss:** right source retrieved, wrong chunk boundaries
- **synthesis overreach:** evidence sufficient, but answer overstates confidence

This taxonomy should map to action owners (indexing, ranking, metadata, synthesis guardrails).

## 11) Evaluation plan (scenario-based)

Use scenario suites aligned to realistic dChat usage.

### Scenario 1: “What’s the latest update in the game?”

- **Success:** cites newest release context and summarizes current latest changes accurately.
- **Failure:** answers with older release or mixed stale/current claims.
- **Likely miss class:** authority/freshness selection.
- **Metric/rubric:** top-evidence release freshness correctness; answer freshness agreement.

### Scenario 2: “Please list the changes in 3.0.1.”

- **Success:** retrieves version-specific changelog evidence for `3.0.1` only.
- **Failure:** blends v3.0.0 and v3.0.1 without disambiguation.
- **Likely miss class:** lexical recall (version token) or metadata filtering.
- **Metric/rubric:** version-precision score (share of cited facts from target version).

### Scenario 3: “Is 3.0.1 strictly better?”

- **Success:** compares concrete criteria with scoped evidence and caveats.
- **Failure:** generic opinion with weak evidence grounding.
- **Likely miss class:** ranking (generic chunks outrank specific evidence).
- **Metric/rubric:** evidence-backed comparison rubric (coverage + specificity).

### Scenario 4: “How could the 3.0.1 notes be better?”

- **Success:** critique grounded in actual note content and structure.
- **Failure:** critique detached from retrieved notes.
- **Likely miss class:** semantic retrieval or chunk context loss.
- **Metric/rubric:** critique-grounding score (claims traceable to retrieved chunks).

### Scenario 5: Route query (`/quests` or `/processes`)

- **Success:** provides correct canonical route behavior/path details.
- **Failure:** invents or confuses route paths.
- **Likely miss class:** lexical retrieval/authority weighting.
- **Metric/rubric:** route exactness score against canonical route source.

### Scenario 6: Mixed changelog + live state

Example: “Given my current inventory/process progress, what release changes matter most to me?”

- **Success:** combines live state facts with relevant release notes.
- **Failure:** ignores player state or hallucinates personal state.
- **Likely miss class:** source planning + metadata lane mixing.
- **Metric/rubric:** mixed-context coherence rubric (state accuracy + doc relevance).

### Scenario 7: Exact-match should win

Example: query includes literal path/version/ID where lexical precision should dominate.

- **Success:** top-ranked evidence contains literal token matches.
- **Failure:** semantically related but token-mismatched chunks dominate.
- **Likely miss class:** reranker weighting.
- **Metric/rubric:** literal-token top-k hit rate and MRR.

### Scenario 8: Semantic rescue should win

Example: paraphrased request without canonical terms.

- **Success:** semantically relevant chunks recovered despite lexical mismatch.
- **Failure:** no useful candidates because literal overlap is low.
- **Likely miss class:** semantic recall.
- **Metric/rubric:** paraphrase recall@k and answer sufficiency rubric.

## 12) Prioritized follow-up implementation ideas

### A) Indexing/chunking changes

1. Implement source-type-specific chunkers (changelog, routes, structured entities, design docs).
2. Add chunk contextual headers and metadata tags at ingest time.
3. Add incremental indexing pipeline for changed files/entities.

### B) Hybrid retrieval + reranking changes

1. Add two-lane first-pass retrieval (lexical + semantic) with score normalization.
2. Implement merge/dedupe + configurable reranking stage.
3. Add query-class-dependent weighting profiles (literal-heavy vs intent-heavy).

### C) Metadata and authority-rule implementation

1. Define canonical metadata schema shared across source types.
2. Implement retrieval filters + soft priors for authority/freshness/source compatibility.
3. Codify conflict-resolution policy for cross-source disagreements.

### D) Retrieval observability/debug tooling

1. Add per-query retrieval traces and stage snapshots.
2. Build developer inspection view for top-k and rerank explanations.
3. Add failure taxonomy tagging in debug output and QA artifacts.

### E) Evaluation harness additions

1. Create scenario-based retrieval eval suite for the query classes above.
2. Track recall/precision/authority metrics per class and per release.
3. Add regression gates for route exactness, version precision, and mixed-context coherence.

---

## Closing notes

This proposal intentionally focuses on retrieval architecture unlocks (indexing, chunking, hybrid
retrieval, reranking, metadata, authority, and observability). It complements existing and parallel
work on grounding UX, uncertainty calibration, and answer actionability without duplicating those tracks.

The key design principle is that no single component (including vector search) is sufficient alone:
quality emerges from the interaction of retrieval planning, metadata quality, ranking strategy,
freshness/authority policy, and diagnosable evaluation loops.
