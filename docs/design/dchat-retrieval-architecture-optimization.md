# DSPACE Design: dChat Retrieval Architecture Optimization

**Status:** Draft  
**Audience:** Maintainers and contributors working on dChat retrieval, indexing, and evaluation  
**Scope:** Backend/retrieval-system architecture for answer quality at scale (not grounding UX policy)

## 1) Problem statement

dChat can already produce useful grounded responses for many changelog/docs prompts, but that is not
sufficient evidence that retrieval is production-robust. Good outcomes on a narrow class of prompts can
hide failure modes in recall, ranking, freshness handling, and source arbitration.

In DSPACE, retrieval pressure is unusually heterogeneous:

- **Exact path strings and route patterns** such as `/quests`, `/processes/:processId`, `/docs`, and
  route aliases that users ask about in troubleshooting flows.
- **Versioned release content** where users ask about `v3`, `v3.0.1`, and later patches; answers must
  separate latest state from historical changelog snapshots.
- **Entity-heavy questions** with quest/item/process names and IDs (UUID-like identifiers, process IDs,
  and route-specific slugs).
- **Mixed context questions** that require both static docs and live player state (`inventory`, quests,
  process timers) in one answer.
- **Lookup-mode variability** between exact literal matching (paths, IDs, quoted text) and semantic
  matching (paraphrased intent, critique/evaluation questions).

A production-robust retrieval architecture must preserve precision for exact signals while sustaining
semantic recall as corpus size and source diversity increase.

## 2) Current likely strengths and likely gaps

This section intentionally infers from observable repo behavior and existing design/docs artifacts,
without assuming hidden infrastructure.

### What seems to already work

- Docs/changelog retrieval appears strong enough for practical summarization and release Q&A.
- Route-scoped and release-scoped material can be surfaced, including route index and changelog docs.
- dChat can synthesize multi-source context when the candidate set is coherent.

### What likely becomes fragile at scale

- **Lexical edge cases:** pure semantic search can miss exact strings (IDs/routes/version substrings)
  unless explicit lexical retrieval remains first-class.
- **First-pass ranking ambiguity:** “related” chunks can outrank “answer-bearing” chunks.
- **Mixed-source incoherence:** docs + route + state queries may retrieve uneven bundles without
  query-class source planning.
- **Freshness/authority drift:** stale or lower-authority text can crowd out newer canonical evidence
  unless metadata-aware weighting is explicit.
- **Chunk context loss:** naive fixed-length chunks can split definitions, caveats, and release-scope
  qualifiers required for precise answers.

## 3) Hybrid retrieval design (lexical + semantic)

### Why DSPACE needs both

DSPACE query traffic is dual-mode:

- **Lexical-critical:** exact routes, version strings, IDs, quoted changelog lines, and literal error
  text must match exactly.
- **Semantic-critical:** players ask paraphrased “how/why/what changed” questions where wording diverges
  from docs.

A single retrieval mode is structurally insufficient.

### Lexical-priority examples

- “Where is `/processes/launch-rocket` documented?”
- “List changes in `3.0.1` (not `3.0.0`).”
- “What does process `launch-rocket` require?”
- “I got this wording from patch notes: ‘token.place deferred’—what does it mean now?”

### Semantic-priority examples

- “Did chat get better after the launch hardening patch?”
- “Is 3.0.1 strictly better, or just safer?”
- “Summarize the intent of this design thread.”
- “Critique the release notes clarity for non-technical players.”

### Proposed high-level retrieval flow

1. **Query classification (lightweight):** infer class (route lookup, version lookup, mixed-state,
   evaluative, etc.) and extract strong lexical cues (paths, IDs, versions, quoted spans).
2. **Lexical candidate retrieval:** BM25/keyword index over chunk text + metadata fields (route,
   version, entity IDs, headings).
3. **Semantic candidate retrieval:** embedding retrieval over same chunk corpus (or source-specific
   semantic indexes).
4. **Merge and dedupe:** union candidate sets with canonical chunk IDs; keep per-source provenance.
5. **Rerank:** apply a dedicated reranker using relevance + authority + freshness + source-fit signals.
6. **Answer assembly:** build final evidence set with source diversity constraints and authority checks.

### Recall/precision tradeoff policy

- Route/version/ID-heavy queries should up-weight lexical retrieval and exact overlap.
- Paraphrase/evaluative queries should broaden semantic recall, then rely on reranking for precision.
- Mixed queries should reserve a quota for each required source type (e.g., docs + player state).

## 4) Reranking design

First-pass retrieval should be treated as **candidate generation**, not final evidence selection.

### Why first-pass is not enough

- First-pass lexical retrieval often returns many partial overlaps.
- First-pass semantic retrieval often returns topical but non-specific chunks.
- Neither alone guarantees best evidence for answerability.

### Reranking goals

- Promote chunks that directly answer the user ask.
- Prefer authoritative and current sources when multiple candidates are plausible.
- Improve mixed-context coherence (e.g., include both route docs and relevant live state evidence).

### Proposed reranking signals

- Query↔chunk semantic relevance score.
- Exact-term overlap score for route/version/ID tokens.
- Source authority score (canonical doc > passing mention > derived summary).
- Freshness score (for time-sensitive classes like release questions).
- Source-type compatibility score by query class (e.g., “my inventory” should favor live state).
- Coverage score for multi-intent queries (ensure all sub-intents represented).

### Pipeline placement and inputs

- Rerank after lexical+semantic merge.
- Input should include: chunk text, heading, source type, source path/slug, version/release metadata,
  updated-at/generated-at, canonical flags, and query-class hints.
- Output should provide an explainable score decomposition for observability.

## 5) Contextual chunking / contextual retrieval

### Why naive chunking fails

Even if the right document is retrieved, fixed-size chunking can separate a critical definition from
its scope qualifier (“in v3.0.1 only”, “legacy route”, “deferred to v3.1”), causing wrong synthesis.

### Source-type-specific needs

- **Changelog docs:** preserve release boundaries, subheadings, and addendum notes.
- **Route docs (`docs/ROUTES.md`):** preserve path + description table rows and section anchors.
- **Quest/item/process docs/data:** preserve entity identity, requirements/consumes/creates semantics,
  and route references.
- **Design docs:** preserve section-level intent and decision/risk boundaries.

### Contextual chunking proposals

- Prepend chunk-local context headers (source type, doc title, heading path, release tag).
- Chunk by heading/section boundaries first; only then apply max-token windows.
- Attach heading-aware labels and structural path (H1 > H2 > H3).
- Attach metadata tags: route, version, entity IDs, canonical status, source authority tier.

### Tradeoffs and policy

- Larger chunks improve interpretability but reduce ranking precision.
- Smaller chunks improve precision but increase context-loss risk.

**Suggested DSPACE policy by source type**:

- Changelog: medium chunks grouped by release entry + subsection.
- Routes: small-to-medium chunks anchored at route table blocks.
- Entity docs/data: small chunks with high metadata density.
- Design docs: medium chunks per section to preserve rationale.

## 6) Metadata-aware retrieval and filtering

### Core metadata dimensions

- `source_type`: changelog, design_doc, route_doc, quest_data, item_data, process_data, player_state.
- `version_release`: semantic version/release anchor/date.
- `entity_type`: quest/item/process/doc.
- `route_path`: canonical route or dynamic pattern.
- `freshness`: updated-at/generated-at/indexed-at.
- `canonicality`: canonical vs derived/generated/summary.
- `origin`: official/built-in vs custom/user-authored.
- `state_scope`: live local player state vs static repository content.

### Retrieval-time usage

- Apply hard filters only when explicit in query (“my inventory”, “3.0.1”, specific route path).
- Otherwise use soft filters that influence ranking, preserving recall.

### Ranking influence

Metadata should be a first-class reranking feature, not only a post-hoc tie-breaker.

### Conflict resolution policy

When sources disagree:

1. Prefer canonical + fresher source within same source type.
2. Prefer source type aligned to query class (e.g., player-state questions prioritize state).
3. If conflict persists, surface uncertainty and cite both with precedence explanation.

### Guard against non-canonical dominance

- Cap contribution from derived/generated summaries in top-k evidence.
- Require at least one canonical source when answering factual questions.

## 7) Freshness and authority rules (DSPACE-specific)

Proposed precedence rules:

1. **Latest release questions:** prefer latest changelog/release docs for “what’s new/latest”.
2. **Historical release questions:** when user asks specific version/date, lock retrieval to that
   release first, then optionally add latest-note context.
3. **Route troubleshooting:** canonical route docs (`/docs/routes` / `docs/ROUTES.md`) outrank casual
   mentions in unrelated docs.
4. **Player progress/inventory/process timers:** live player state outranks static docs for user
   state facts; docs provide interpretation, not factual override.
5. **Official vs custom content:** official built-in content is default authoritative baseline unless
   user explicitly asks about custom/local authored content.
6. **Changelog immutability:** published changelog markdown bodies remain historical records; newer
   clarifications are represented as separate notes/annotations at retrieval/render time, not
   retroactive body rewrites.

## 8) Retrieval plans by query class

### A) Factual docs/changelog lookup

- Preferred sources: changelog + docs pages.
- Retrieval strategy: lexical first (version/date terms), semantic second.
- Metadata filters: version/release if specified.
- Reranking emphasis: exact overlap + authority + freshness.
- Main risks: stale release chosen; generic summary chunk outranking exact entry.

### B) Route-specific troubleshooting

- Preferred sources: route docs, route-index chunks, relevant feature docs.
- Retrieval strategy: lexical-heavy on path tokens and route labels.
- Metadata filters: `source_type=route_doc` soft-boost or hard filter when exact path given.
- Reranking emphasis: path exact-match + canonical route authority.
- Main risks: path alias confusion; dynamic route pattern mismatch.

### C) Quest/item/process lookup

- Preferred sources: quest/item/process canonical data + related docs.
- Retrieval strategy: lexical by entity ID/name, semantic for paraphrased mechanics.
- Metadata filters: entity type + ID when available.
- Reranking emphasis: entity identity correctness + semantics-bearing chunks.
- Main risks: near-name collisions, ID misses, requirement semantics split across chunks.

### D) Evaluative/product-feedback questions

- Preferred sources: changelog + design docs + release-state docs.
- Retrieval strategy: semantic-heavy with lexical anchors for explicit versions.
- Metadata filters: none hard unless version specified.
- Reranking emphasis: breadth across evidence + recency-aware authority.
- Main risks: overly generic evidence set, overconfident synthesis.

### E) Mixed queries (docs + live player state)

- Preferred sources: live state + docs/changelog.
- Retrieval strategy: dual-track candidate generation with source quotas.
- Metadata filters: require state_scope presence when user says “my”.
- Reranking emphasis: source-type compatibility and cross-source coherence.
- Main risks: answering state question from static docs, or vice versa.

### F) Lore/personality-flavored but factual

- Preferred sources: factual docs plus optional persona/lore context.
- Retrieval strategy: semantic + lexical anchors for concrete claims.
- Metadata filters: avoid non-factual-only sources for factual asks.
- Reranking emphasis: factual authority before style.
- Main risks: style overshadowing factual grounding.

## 9) Indexing and storage considerations

### Vector DB helps, but is insufficient alone

Vector retrieval improves semantic recall but does not reliably handle exact-match path/version/ID
constraints. A lexical index remains mandatory.

### Recommended architecture shape

- Maintain **dual indexes**: lexical + vector.
- Consider **source-type partitioning** (or faceting) for better query planning and incremental updates.
- Keep a shared chunk ID namespace for merge/dedupe across indexes.

### Incremental indexing/update strategy

- Static docs/changelog: rebuild on repo content changes and release events.
- Route docs: rebuild on route/schema/menu changes.
- Quest/item/process canonical data: rebuild on generated JSON/catalog updates.
- Player state: index in a separate, fast-refresh local index with short TTL and strict privacy scope.

### DSPACE-specific constraints

- dChat already combines static knowledge with local player state; indexing architecture should keep
  these planes distinct to avoid stale-state bleed.
- If local-first/offline usage is supported, retrieval should degrade gracefully with local lexical
  indexes and cached vector artifacts where available.

## 10) Observability and debugging

Retrieval failures must be diagnosable without guesswork.

### Required diagnostics

- Retrieval trace per query (query class, filters, index hits, selected candidates).
- Top-k candidate inspection before and after reranking.
- Source-type distribution report for candidate and final evidence sets.
- “Why selected?” feature breakdown per final chunk.
- Query-class tags to segment eval dashboards.

### Failure-debug examples

- **Missing retrieval:** relevant doc exists but not in top-k → recall/indexing/filter issue.
- **Bad ranking:** relevant doc in candidate set but not promoted → reranker weighting issue.
- **Stale authority choice:** older source outranks canonical latest source → freshness/authority rule issue.
- **Chunking/context loss:** selected chunk misses local qualifier → chunking policy issue.
- **Synthesis overreach:** evidence adequate but answer over-extends claims → answer-stage guardrail issue
  (separate from retrieval, but visible via trace).

## 11) Evaluation plan (scenario-based)

Run targeted retrieval-first evals where each scenario captures likely failure class.

| Scenario | Success signal | Failure signal | Likely miss type | Metric / rubric |
| --- | --- | --- | --- | --- |
| “What’s the latest update in the game?” | Uses latest release evidence and clearly states version/date scope. | Uses older release as latest. | Authority/freshness | Top evidence includes latest release chunk; answer version-date correctness. |
| “Please list the changes in 3.0.1” | Retrieves 3.0.1-scoped chunks and avoids 3.0.0 leakage. | Blends unrelated releases without distinction. | Metadata/ranking | Version precision@k; contamination rate from non-target releases. |
| “Is 3.0.1 strictly better?” | Compares improvements/tradeoffs with cited release evidence. | Pure opinion without evidence or one-sided claim. | Retrieval breadth/ranking | Evidence diversity + supported-claim ratio. |
| “How could the 3.0.1 notes be better?” | Retrieves notes plus context and generates concrete critique anchored in source. | Generic writing advice not grounded in retrieved notes. | Semantic recall/ranking | Grounded critique rubric (specificity, source anchoring). |
| Route query using `/quests` or `/processes` | Returns canonical path guidance from route docs. | Invents/guesses routes or wrong click-path. | Lexical recall/authority | Exact-route hit@k; route correctness rubric. |
| Mixed query: changelog + live quest/inventory/process context | Correctly combines user state with release/docs context. | Answers state part from static docs only (or ignores state). | Source planning/metadata | Source-type coverage metric; state-fact correctness. |
| Exact-match should beat semantic | Exact token query retrieves route/version/ID chunk at top ranks. | Semantically similar but wrong chunk outranks exact match. | Lexical weighting/rerank | Exact-match priority score; MRR on exact-token set. |
| Paraphrase should be rescued semantically | Paraphrased intent still retrieves correct canonical chunk. | No relevant retrieval unless exact words used. | Semantic recall | Recall@k on paraphrase set. |

### Evaluation mechanics

- Maintain a labeled query suite grouped by query class.
- Log per-stage artifacts (lexical candidates, semantic candidates, merged pool, reranked top-k).
- Track stage-wise metrics: recall@k, precision@k, MRR, authority-correctness, freshness-correctness,
  and mixed-source coverage.
- Add qualitative review for overreach and conflict handling.

## 12) Prioritized follow-up implementation ideas

### A) Indexing/chunking changes

1. Implement source-type chunking policies with heading-aware metadata.
2. Add route/version/entity tags to chunk schema.
3. Introduce incremental index rebuild triggers by source type.

### B) Hybrid retrieval + reranking

1. Add dual candidate generation (lexical + semantic) with merge/dedupe.
2. Introduce query classifier for retrieval mode weighting.
3. Add reranker with explicit relevance/authority/freshness/source-fit features.

### C) Metadata and authority rules

1. Define canonical metadata schema and enforce at index-build time.
2. Implement query-time filters + soft boosts by query class.
3. Encode freshness/authority precedence rules (including changelog immutability handling).

### D) Observability/debug tooling

1. Add retrieval traces and top-k inspection output for dev/QA.
2. Add “why selected” feature explanations for reranked evidence.
3. Add dashboards for source-type balance and failure-mode counts.

### E) Evaluation harness additions

1. Create a scenario corpus covering exact-match, paraphrase, mixed-source, and authority-conflict cases.
2. Add stage-specific regression gates (retrieval recall/ranking before answer text quality checks).
3. Add release-aware eval slices (latest vs explicit historical version queries).

---

## Summary

Retrieval quality for dChat will not be unlocked by a vector database alone. It depends on the joint
behavior of indexing, chunking, lexical+semantic candidate generation, reranking, metadata-aware
selection, freshness/authority precedence, and stage-level observability. This proposal defines that
system as an implementation-shaping architecture so future work can be split into focused, testable
engineering tasks.
