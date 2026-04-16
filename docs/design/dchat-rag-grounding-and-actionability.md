# DSPACE Design: dChat RAG Grounding, Calibration, and Actionability

**Status:** Draft proposal  
**Audience:** Maintainers and contributors working on `/chat`, docs/changelog UX, and QA  
**Scope:** dChat response trustworthiness and usefulness for grounded Q&A + evaluative/product-feedback prompts

## 1) Problem statement

The transcript is a strong success signal for dChat: it stays on-topic, retrieves concrete changelog
facts, follows user intent shifts, and provides useful product critique rather than only summarizing
source text. In particular, it handles both factual and evaluative prompts in a way that feels
helpful and collaborative.

However, transcript-level “good answers” are not enough for long-term trust. The transcript also
shows that synthesis quality currently outpaces grounding transparency. Users see a generic
`Sources used` footer, but cannot quickly verify which claim came from which source chunk, which
parts are direct quotes/paraphrases, and which parts are interpretation. As dChat takes on more
mixed-context questions (docs/changelog + live progress + inventory/process state + lore context),
this gap becomes a scale risk:

- Trust risk: good answers can still feel un-auditable.
- Calibration risk: evaluative answers can sound more certain than visible evidence supports.
- Debuggability risk: QA and players cannot easily isolate retrieval misses from synthesis errors.

## 2) What the transcript demonstrates today

### Grounding wins

1. **Concrete, anchored retrieval over obvious hallucination.**
   - The assistant references a specific latest changelog entry (`April 1, 2026`, `v3`,
     `/changelog#20260401`) rather than making vague claims.
2. **Progressive detail control.**
   - It answers high-level first (“latest update”), then expands to detailed patch deltas when
     prompted (“please list the changes in 3.0.1”).
3. **Route/area grouping that maps to product structure.**
   - The 3.0.1 list is organized by areas like `/quests`, `/processes`, `/docs and chat retrieval`,
     making the response inspectable and operationally meaningful.

### Product usefulness wins

1. **Nuanced evaluation for “strictly better?”**
   - It avoids a binary claim and explicitly discusses tradeoffs (security strictness, first-search
     latency, normalization side effects).
2. **Editorial critique that is actionable.**
   - It proposes practical changelog improvements: sectioning, “what you’ll notice,” risk callouts,
     perf context, and “how to verify.”
3. **Conversation steering that helps next action.**
   - It asks clarifying follow-ups when useful (e.g., “gameplay vs platform change,” “what do you
     care about most”).

## 3) Risks and failure modes surfaced by the transcript

1. **Evidence display lags synthesis quality.**
   - The response quality is high, but evidence UX remains coarse.
2. **`Sources used` is too coarse for claim-level inspection.**
   - Users cannot map specific bullets to specific source lines/chunks.
3. **Potential tone overreach.**
   - Phrasing like “strict improvement” may read stronger than visible support when direct wording
     is not quoted or linked claim-by-claim.
4. **Weak uncertainty signaling for evaluative prompts.**
   - The answer includes nuance, but still could more explicitly label which parts are interpretation
     vs source-backed statement.
5. **Likely asymmetry between static-doc queries and mixed-context queries.**
   - The transcript is changelog-heavy (a current strength); harder cases combining live player state
     and static docs are not exercised.
6. **Poor chunk inspectability for advanced users/QA.**
   - It is hard to inspect freshness, source type, or conflict handling from the visible output.

## 4) Proposed RAG improvements

These proposals build on current architecture (deterministic knowledge packing, docs RAG excerpts,
`contextSources`, and changelog note rendering behavior) rather than introducing a new backend
retrieval service.

### A) Claim-to-source grounding UX

Move from a single footer to structured evidence presentation:

1. **Claim-group citation chips in answer body.**
   - Add inline chips at paragraph/bullet-group level, e.g. `[Docs]`, `[Changelog]`,
     `[PlayerState]`, `[Synthesis]`.
2. **Expandable evidence drawer per chip.**
   - Clicking a chip reveals source title/route, source type, and the supporting excerpt snippet.
3. **Support labels on each claim group.**
   - `Directly supported` (single-source paraphrase),
   - `Multi-source synthesis` (combines sources),
   - `Assistant inference` (interpretive/evaluative).
4. **Freshness metadata where available.**
   - For docs/changelog chunks, show generated-at/slug context already carried in docs pack tooling
     so users can assess recency.

Outcome: users can verify *why* each statement appears without reading full debug payloads.

### B) Confidence and uncertainty calibration

Adopt explicit language tiers:

- **“The changelog says X”** → use when directly supported by retrieved text.
- **“This suggests X”** → use when evidence supports a likely implication but not explicit wording.
- **“I infer X”** → use for interpretive judgment across multiple signals.

For evaluative questions (e.g., “strictly better?”), require a tri-part answer pattern:

1. **Direct evidence first** (what is explicitly changed).
2. **Interpretation second** (why this may improve or trade off).
3. **Conditional caveat third** (where user preference or edge-case state changes outcome).

Add a lightweight calibration rule:

- If an evaluative conclusion is not direct source language, prepend with
  “Based on these notes…” or “From the available changelog evidence…”.

### C) Mixed-context retrieval and answer planning

Use a staged answer planner by source type for multi-context prompts:

1. **Intent decomposition stage**
   - Classify question into needed source buckets: docs/changelog, player progress, inventory/
     process state, lore/persona context.
2. **Source fetch stage (typed fan-out)**
   - Retrieve from each required bucket separately (rather than one blended query).
3. **Conflict/freshness resolution stage**
   - Priority rule:
     1) live local player state for user-specific current facts,
     2) current release-state/changelog docs for product state,
     3) broader docs for mechanics,
     4) lore/persona for style only.
4. **Answer assembly stage**
   - Emit a structured response with clearly separated facts by source type before synthesis.

Conflict policy:

- If sources disagree, state disagreement explicitly and prefer fresher + more authoritative source.
- If player state is unavailable, do not imply access; request save snapshot/clarifying input.

### D) Actionability mode

Formalize a distinct response mode for critique/planning prompts.

**Trigger examples:**
- “How could these notes be better?”
- “Turn this into tasks.”
- “How do we verify this patch?”

**Output contract for Actionability Mode:**
1. Findings (what is strong/weak)
2. Evidence-linked rationale
3. Proposed improvements
4. Verification checklist (route-based where possible)
5. Suggested implementation task slices (small, testable)

This mode should be separate from normal lore/help responses and should preserve grounding labels
(`direct`, `synthesis`, `inference`) so critique does not drift into unsupported recommendations.

### E) Guardrails against subtle overreach

Add explicit heuristics for changelog/patch-note Q&A:

1. **Summarization guardrail**
   - Do not add claims absent from retrieved text, even if plausible.
2. **Interpretation guardrail**
   - Interpretation must cite at least one supporting change statement.
3. **Recommendation guardrail**
   - Recommendations must be labeled as suggestions, not existing release commitments.
4. **Precision guardrail**
   - Preserve exact metrics only when present in sources; otherwise avoid synthetic specificity.
5. **Behavior-change guardrail**
   - For hardening/strictness updates, include at least one potential user-visible tradeoff when
     making “strictly better” style judgments.

## 5) Response policy recommendations (compact contract)

For non-trivial answers, dChat should follow this envelope:

1. **Answer**
   - Concise direct response to user question.
2. **Evidence**
   - Claim-group chips with expandable source snippets.
3. **Synthesis / interpretation**
   - Clearly labeled interpretation (`suggests` / `infer`).
4. **Uncertainty / caveats**
   - Explicit when evidence is partial, conflicting, or preference-dependent.
5. **Suggested next step (optional)**
   - Only when it helps user decision or verification.

## 6) Evaluation plan

Use scenario-based evaluations inspired by the transcript, with explicit pass/fail criteria.

### Scenario A: “What’s the latest update in the game?”

- **Success:** Correctly identifies latest available release entry with date/version and cites
  changelog source chunk.
- **Failure:** Vague “latest update” without anchor, or stale release selection.
- **High-priority mistake type:** Freshness/grounding error.

### Scenario B: “Please list the changes in 3.0.1.”

- **Success:** Produces sectioned summary matching patch notes; each section has inspectable
  evidence chips.
- **Failure:** Drops major sections, invents extra changes, or provides no claim-level evidence map.
- **High-priority mistake type:** Unsupported summarization.

### Scenario C: “Is 3.0.1 strictly better?”

- **Success:** Uses evaluative template (evidence → interpretation → caveat), with explicit
  uncertainty wording for preference/edge cases.
- **Failure:** Unqualified yes/no or overconfident conclusion without caveats.
- **High-priority mistake type:** Calibration overreach.

### Scenario D: “How could the 3.0.1 notes be better?”

- **Success:** Enters Actionability Mode and outputs concrete, evidence-linked improvements plus QA
  verification steps.
- **Failure:** Pure paraphrase, generic writing advice, or recommendations detached from sources.
- **High-priority mistake type:** Actionability without grounding.

### Scenario E (mixed-context):
“Given my current progress and inventory, should I prioritize 3.0.1-related quest flow checks or
process reliability checks first?”

- **Success:** Separates changelog facts from player-state facts, requests missing player-state data
  if needed, and provides a conditional recommendation path.
- **Failure:** Pretends to have player-state details it does not have, or ignores mixed-source
  dependencies.
- **High-priority mistake type:** State hallucination and source-priority failure.

### Metrics and instrumentation targets

- **Grounding coverage:** % of non-trivial claims with attached claim-group evidence.
- **Calibration quality:** % of evaluative answers using labeled interpretation/caveat language.
- **Mixed-context correctness:** % of mixed queries with correct source ordering + no state
  hallucination.
- **User inspectability:** time-to-evidence (clicks/seconds) in QA runs.

## 7) Prioritized follow-up implementation ideas

### P0 — UI/source rendering improvements

1. Add claim-group evidence chips and expandable source drawer in chat message UI.
2. Add support labels: `Directly supported`, `Multi-source synthesis`, `Assistant inference`.
3. Show source freshness/type badges (docs/changelog/player-state).

### P1 — Retrieval pipeline changes

1. Add typed retrieval fan-out for mixed-context prompts (docs/changelog vs player state vs lore).
2. Add explicit source-priority and conflict-resolution logic in answer planner.
3. Attach retrieval metadata needed for claim-group evidence rendering.

### P1 — Answer-planning / prompt policy changes

1. Enforce language-tier rules: `says` vs `suggests` vs `infer`.
2. Add evaluative-answer template for “is this better?” style prompts.
3. Add overreach guardrails distinguishing summarization, interpretation, recommendation.

### P2 — Evaluation harness additions

1. Add scenario set covering transcript prompts plus at least one mixed-context case.
2. Add rubric checks for claim-level grounding, uncertainty calibration, and state hallucination.
3. Add regression checks that assert evidence inspectability, not just answer fluency.

## Notes and constraints alignment

- This design preserves the transcript’s observed strengths (factual grounding + actionable critique)
  while making supportability explicit at claim level.
- It does **not** require retroactive edits to published changelog markdown; changelog improvements
  are framed as future retrieval/rendering/response behavior, consistent with immutable-history
  policy.
- It stays within current repo direction: deterministic/client-centric chat grounding with stronger
  evidence UX and planning rules, rather than introducing a new external RAG service.
