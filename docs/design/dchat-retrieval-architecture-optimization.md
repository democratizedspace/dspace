# DSPACE Design: dChat Retrieval Architecture Optimization

**Status:** Proposal (retrieval architecture)
**Audience:** Maintainers and contributors working on `/chat` quality, docs indexing, and runtime grounding
**Scope:** Retrieval/indexing/ranking pipeline changes for dChat as knowledge sources and user load grow

## 1) Problem statement

dChat can already produce useful answers for many docs/changelog prompts, but that does **not** imply retrieval is production-robust.

A retrieval stack that succeeds on changelog summarization can still fail on:

- exact route/path queries (`/quests`, `/processes/:processId`, `/docs`), where one missed token means a wrong instruction;
- release/version disambiguation (`v3`, `v3.0.1`, and future tags), where stale or nearby versions can bleed into answers;
- exact game entities (quest/item/process names and IDs), where lexical precision matters;
- mixed grounding (repo docs + live player state), where answer quality depends on source-type planning;
- paraphrased user asks (“is this strictly better?”, “what changed behavior-wise?”) that require semantic matching.

The core risk is false confidence from partial success: “RAG works for changelog questions” is a narrower claim than “retrieval selects the right evidence under varied query shapes, growing corpus size, and changing source authority.”

## 2) Current likely strengths and likely gaps

This section intentionally avoids claiming unseen internals beyond repo-observable patterns.

### What seems to already work

- dChat has deterministic knowledge assembly and docs pack support, which already enables useful summaries for docs/changelog prompts.
- Route-scoped and release-scoped info can surface for common asks, suggesting the system can find relevant chunks for known intents.
- Responses can synthesize across sources (docs + game concepts), indicating downstream answer assembly is not purely extractive.

### What likely becomes fragile at scale

- Lexical edge cases may be underpowered if exact route/version/entity matching is not a first-class retrieval mode.
- First-pass retrieval can over-return generic-but-related chunks instead of exact answer-bearing evidence.
- Mixed-source questions (for example docs + player progression) may gather incoherent bundles without query-class source planning.
- Older or secondary sources can crowd out canonical/fresher evidence without explicit metadata weighting.
- Naive chunking can split local context (heading + caveat + version note), producing plausible but incomplete answers.

## 3) Hybrid retrieval design (lexical + semantic)

### Why DSPACE needs both

DSPACE retrieval pressure includes both symbol-heavy lookups and meaning-heavy asks:

- **Lexical-critical:** exact route literals, version strings, IDs, specific patch-note phrases, and precise process terms (`requires`, `consumes`, `creates`).
- **Semantic-critical:** paraphrased gameplay asks, design intent comparisons, evaluative prompts (“strictly better?”), and critique/summarization requests.

A single-mode retriever is likely to underperform on one of these classes.

### Proposed high-level flow

1. **Query classification (lightweight):** infer dominant intent(s): route/version/entity/state/evaluative.
2. **Lexical candidate retrieval:** BM25-like/indexed term retrieval over chunk text + metadata fields.
3. **Semantic candidate retrieval:** embedding similarity over contextual chunks.
4. **Merge + dedupe:** combine top-N from both lanes, dedupe by canonical chunk ID/source ID.
5. **Rerank (separate stage):** score merged candidates using cross-signals (section 4).
6. **Answer assembly:** pass top-K with metadata to generation, plus explicit authority/freshness hints.

### Recall/precision policy

- **Lexical-dominant mode** for explicit routes/IDs/versions/literal strings.
- **Balanced mode** for general factual docs lookup.
- **Semantic-dominant mode** for paraphrase-heavy evaluative/critique asks.
- Always retain a minimum lexical floor for route/version/entity classes to avoid missing exact literals.

## 4) Reranking design

First-pass retrieval should maximize recall, not final precision. A dedicated rerank stage is needed to isolate best evidence.

### Reranking goals

- Separate exact answer-bearing chunks from broadly related context.
- Prefer authoritative sources when several chunks appear plausible.
- Improve mixed-context answerability by promoting source-compatible bundles.

### Recommended rerank signals

- Query↔chunk semantic relevance score.
- Exact-term overlap score (boosted for route/version/id/token matches).
- Source authority weight (canonical docs/routes/changelog over incidental mentions).
- Freshness score (when query implies “latest/current”).
- Source-type compatibility score (for example player-state asks prioritize state sources).
- Contradiction risk penalty (down-rank stale or non-canonical collisions).

### Pipeline placement and inputs

Reranking should execute **after merge/dedupe**, before final context packing.

Reranker input should include:

- raw chunk text,
- structured metadata (sourceType, sourcePath, version, updatedAt, canonicalFlag, entity tags),
- lexical match diagnostics,
- query-class hints.

Output should be scored candidates plus reason codes (for observability).

## 5) Contextual chunking / contextual retrieval

Naive fixed-size chunking can fail even if the right document is retrieved, because local meaning in DSPACE is often carried by section headers, route literals, or version framing.

### Why source-specific chunking is required

- **Changelog docs:** require release framing + date/slug context per chunk.
- **Route docs (`docs/ROUTES.md`):** route tables and click-path lists need structure-preserving chunk boundaries.
- **Quest/item/process docs/data:** entity IDs and gating semantics must stay attached to local explanations.
- **Design docs:** section intent and non-goals can be distant from details unless heading context is preserved.

### Proposed chunking strategy

- Section-aware chunking (split by heading/table/list boundaries before token windows).
- Prepend chunk-local context header (doc title, section path, source type, version/release tag).
- Attach metadata tags (`route=/quests`, `entityType=process`, `release=20260401`, etc.).
- Preserve table rows as coherent units where route/version/entity columns exist.

### Tradeoffs

- Larger chunks improve coherence but reduce rerank precision and context budget efficiency.
- Smaller chunks improve precision but risk dropping caveats/qualifiers.

### DSPACE-specific policy (initial)

- **Route index docs:** smaller, structure-aligned chunks (row/list scoped).
- **Changelog:** medium chunks aligned to release subsection boundaries.
- **Quest/process semantics docs:** medium chunks with heading-prefix metadata.
- **Design docs:** larger section-level chunks plus heading labels.

## 6) Metadata-aware retrieval and filtering

Metadata should be treated as a first-class retrieval surface, not only display information.

### Core metadata dimensions

- source type: changelog, design doc, route doc, quest data, item data, process data, player state;
- version/release identifiers;
- entity type and IDs (quest/item/process/doc);
- route/path tags;
- freshness (`updatedAt`, generated timestamp);
- canonical vs derived/generated source;
- official/built-in vs custom/user-authored content;
- live/local player state vs static repo content.

### Retrieval-time behavior

- Apply hard filters when query intent is explicit (for example release-specific or “my inventory”).
- Apply soft boosts/penalties otherwise (allow cross-source recall but bias authority).
- Enforce collision handling: if sources disagree, elevate canonical + newer source and flag disagreement for generation.

### Anti-domination controls

- Cap candidates per source family to prevent one large corpus slice from crowding top-K.
- Penalize obsolete/non-canonical duplicates when canonical alternatives exist.

## 7) Freshness and authority rules (DSPACE-specific)

1. **Latest release asks:** prioritize newest changelog/release notes unless query pins an older version.
2. **Version-pinned asks (`3.0.1`):** hard-filter to that release scope first; use nearby versions only as fallback context.
3. **Route/navigation asks:** canonical route docs (`docs/ROUTES.md` and routed docs pages) outrank incidental mentions.
4. **“My progress/inventory” asks:** live player state outranks static docs; static docs become explanatory support only.
5. **Official vs user-authored:** built-in canonical content answers default gameplay behavior; custom/user content should be opt-in or explicitly labeled.
6. **Historical changelog policy:** published changelog bodies remain immutable history; newer clarifications should be represented as retrieval-time notes/annotations (for example changelog notes), not by rewriting historical entries.

## 8) Retrieval plans by query class

### A) Factual docs/changelog lookup

- Preferred sources: docs + changelog + route docs.
- Order: lexical first, semantic second, then rerank.
- Filters: optional release filter from query cues.
- Rerank emphasis: authority + exact-term support.
- Main risk: stale release chunk outranking latest.

### B) Route-specific troubleshooting

- Preferred sources: `docs/ROUTES.md`, route docs, relevant page docs.
- Order: lexical-dominant (path literals), semantic backfill.
- Filters: route/path tags.
- Rerank emphasis: exact literal/path overlap.
- Main risk: semantically similar but wrong route.

### C) Quest/item/process lookup

- Preferred sources: quest/process/item canonical data + docs explaining semantics.
- Order: lexical on entity names/IDs, semantic for paraphrased intent.
- Filters: entityType + entity ID/name match candidates.
- Rerank emphasis: entity ID precision + canonical source.
- Main risk: near-name collisions and generic guide overfit.

### D) Evaluative/product-feedback questions

- Preferred sources: design docs, changelog rationale, relevant docs sections.
- Order: semantic-dominant with lexical constraints for named releases/features.
- Filters: source type = design/changelog/docs.
- Rerank emphasis: relevance + freshness + source diversity.
- Main risk: overly generic context without concrete evidence.

### E) Mixed docs + live player state

- Preferred sources: live state snapshot + docs/changelog.
- Order: dual-lane retrieval by source family, then joint rerank.
- Filters: include player-state source when user signals possession/progress.
- Rerank emphasis: state compatibility + authority.
- Main risk: answering as if state were known when missing or stale.

### F) Lore/personality-flavored but factual

- Preferred sources: factual docs first; persona/lore context second.
- Order: normal hybrid retrieval with factual-source floor.
- Filters: none hard unless question pins release/entity.
- Rerank emphasis: factual evidence support.
- Main risk: stylistic generation drifting beyond evidence.

## 9) Indexing and storage considerations

A vector index may improve semantic recall, but it is insufficient alone for DSPACE’s route/version/entity-heavy workload.

### Architecture-level recommendations

- Maintain **both** lexical and vector indexes.
- Consider separate logical indexes (or partitions) by source type for predictable candidate budgets.
- Preserve shared canonical IDs across indexes for clean merge/dedupe.
- Support incremental re-indexing:
  - static docs/changelog/design sources on build/update,
  - live player-state index on local state changes or session checkpoints.

### Local-first / update cadence implications

Given DSPACE’s local-first patterns (local game state and offline-aware behavior), retrieval should:

- keep static corpus indexing stable across app versions,
- isolate volatile local player-state retrieval from static docs retrieval,
- include versioned index metadata so stale index packs are detectable and debuggable.

## 10) Observability and debugging

Retrieval failures must be diagnosable without guessing.

### Recommended diagnostics

- Retrieval trace per query (query class, filters, candidate counts by lane).
- Top-K inspection snapshots (pre-rerank and post-rerank).
- Source-type distribution and authority/freshness breakdown.
- Per-candidate “selected because” reason codes (lexical hit, semantic score, authority boost, freshness boost).
- Query-class tagging to segment eval outcomes.

### Failure triage examples

- **Missing retrieval:** correct source absent from top-N in both lanes.
- **Bad ranking:** source present but buried after rerank.
- **Stale authority choice:** old/non-canonical source selected over canonical/fresher evidence.
- **Chunking/context loss:** selected chunk lacks nearby qualifier needed for correct answer.
- **Synthesis overreach:** evidence adequate but generation overstates certainty.

## 11) Evaluation plan (scenario-driven)

Use scenario sets that intentionally stress retrieval stages.

| Scenario | Success | Failure | Likely miss class | Metric / rubric |
| --- | --- | --- | --- | --- |
| “What’s the latest update in the game?” | Uses newest release summary and labels recency correctly | Cites older release as latest | authority/freshness | Top-1 source recency correctness; answer-level recency check |
| “Please list the changes in 3.0.1” | Constrains to 3.0.1-scoped evidence | Mixes v3.0.0/v3.0.1 details without marking boundaries | metadata/authority | Version precision score; cross-version contamination rate |
| “Is 3.0.1 strictly better?” | Retrieves patch deltas + tradeoff context, states basis | Generic opinion with weak evidence | ranking/semantic relevance | Evidence density rubric (claims backed per answer) |
| “How could the 3.0.1 notes be better?” | Grounds critique in actual note content and gaps | Hallucinates missing sections | recall/chunking | Grounded critique rubric; unsupported-claim count |
| Route query (for example “Where is `/processes/:processId` explained?”) | Returns canonical route/doc path precisely | Returns nearby but wrong route guidance | lexical/ranking | Exact route hit rate; route literal accuracy |
| Mixed query: “Given my inventory/progress, what changed in recent release that affects me?” | Combines live state + release notes, labels assumptions | Ignores state or invents state | source planning/metadata | Source-family coverage metric; assumption disclosure check |
| Exact-match wins case (ID-heavy query) | Returns exact ID/route/version chunk despite semantic neighbors | Picks semantically related generic overview | lexical priority/rerank | Exact token match at Top-K |
| Semantic rescue case (paraphrased ask) | Finds relevant docs despite no literal overlap | No results or off-target literal match | semantic recall | Paraphrase retrieval recall@K |

### Evaluation mechanics

- Track stage-local metrics (recall@K pre-merge, rerank NDCG, authority override rate).
- Track answer-level rubrics (groundedness, recency correctness, route/version/entity accuracy).
- Maintain a small regression set with stable expected evidence IDs for deterministic smoke checks.

## 12) Prioritized follow-up implementation ideas

### P0 — indexing/chunking

1. Add source-type-aware chunking policy (route/changelog/entity/design variants).
2. Attach canonical metadata schema to all chunks (source type, version, route/entity tags, authority flags).
3. Add incremental index manifests with generated timestamps and version IDs.

### P1 — hybrid retrieval + reranking

1. Implement dual-lane retrieval (lexical + semantic) with merge/dedupe.
2. Add rerank stage with exact-match, semantic, authority, freshness, and source-compatibility features.
3. Add query-class-aware weighting profiles (route/version/entity/state/evaluative).

### P1 — metadata + authority policy

1. Implement hard filters for explicit version and player-state intents.
2. Implement soft authority/freshness boosts for general queries.
3. Add conflict policy that prefers canonical/fresher sources and flags disagreement.

### P2 — observability/debugging

1. Add retrieval traces and candidate inspection artifacts in debug mode.
2. Add reason-code logging for final selected chunks.
3. Add query-class and failure-mode tagging for dashboards/regression reports.

### P2 — evaluation harness

1. Add scenario suite covering the eight retrieval stress classes above.
2. Add stage-level + answer-level scorecards to CI-adjacent quality checks.
3. Add targeted regressions for lexical precision, semantic rescue, and authority/freshness correctness.

---

## Summary

Retrieval quality in dChat should be treated as a systems problem, not a single-model problem. The meaningful unlock is the interaction of **indexing + chunking + metadata + hybrid retrieval + reranking + authority/freshness policy + observability**, tuned to DSPACE’s route/version/entity and live-state realities.
