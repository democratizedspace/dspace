# dChat RAG: Grounding, Confidence Calibration, and Actionability

**Status:** Proposed  
**Audience:** Chat UX, docs retrieval, and QA maintainers  
**Scope:** `/chat` response grounding and answer quality for dChat in the current v3 architecture

## 1) Problem statement

The transcript is a strong success signal for dChat: the assistant stayed anchored to v3 release
material, answered the user’s intent at the right abstraction level, and turned raw changelog
content into actionable critique. That behavior is exactly what players need from an in-game
assistant.

However, transcript-level success is not enough for trust at scale. The stronger dChat’s synthesis
becomes, the more users need transparent evidence and calibrated certainty. In the transcript,
answer quality is often higher than evidence visibility (“Sources used” appears, but not claim-level
support). That mismatch can undermine user trust, make QA validation harder, and hide retrieval
failures when questions require mixed context (docs + live state + lore) instead of only changelog
facts.

## 2) What the transcript demonstrates today

### Grounding wins

- dChat retrieved concrete changelog facts (including dates, version references, and route anchors)
  instead of obvious hallucinations.
- It moved from broad summary (“latest update”) to narrower detail (“3.0.1 changes”) when nudged.
- It preserved route-aware references (`/changelog`, `/changelog#20260401`) that align with
  DSPACE’s route-centric docs model.
- It answered patch-scope questions in a way consistent with current docs/changelog retrieval
  behavior already present in v3.

### Product usefulness wins

- It handled evaluative framing (“strictly better?”) with nuance instead of binary certainty,
  including possible tradeoffs.
- It went beyond paraphrasing and produced practical editorial recommendations for better release
  notes.
- It generated QA-friendly “how to verify” ideas, showing that dChat can bridge player-facing
  language and implementation-quality checks.
- It maintained conversational flow while still grounding statements in product context.

## 3) Risks and failure modes surfaced by the transcript

1. **Evidence display lags synthesis quality**
   - The assistant can produce strong structured synthesis, but user-visible grounding is still
     coarse.

2. **“Sources used” is too coarse for inspection**
   - The user cannot easily map individual claims to specific source chunks.

3. **Potential overconfidence relative to visible proof**
   - Some conclusions are plausible and likely right, but phrasing can sound more certain than the
     visible evidence model supports.

4. **Weak uncertainty surfacing for evaluative questions**
   - For judgment questions, uncertainty and scope conditions are present but not consistently
     explicit as policy.

5. **Likely asymmetry: docs/changelog > mixed-context**
   - The transcript mostly exercises docs/changelog retrieval. Harder multi-source questions (live
     quest progress + inventory/process state + lore + docs) are more failure-prone.

6. **Low inspectability of source chunk lineage**
   - Even when `contextSources` exists, players cannot quickly see which statement came directly
     from source text vs assistant interpretation across sources.

## 4) Proposed RAG improvements

### A) Claim-to-source grounding UX

Move from turn-level source disclosure to **claim-group grounding** while staying compatible with the
current `contextSources` pipeline.

#### Proposal

- Add **claim groups** in assistant responses (example groups: “Release facts”, “Interpretation”,
  “Recommendations”).
- Render **citation chips** per claim group (not per sentence) to keep UI readable.
- Make chips expandable to show:
  - source label and route (`/docs/...`, `/changelog#...`),
  - source type (`doc`, `changelog`, `route`, `player-state`),
  - short excerpt used for grounding.
- Add explicit support labels:
  - **Directly supported** (single-source or equivalent statements),
  - **Synthesis** (combined from multiple sources),
  - **Inference** (reasoned implication, not explicitly stated).

#### Why this fits the current repo

- Reuses existing source metadata patterns (`contextSources`, docs RAG source metadata) instead of
  introducing a new backend retrieval system.
- Extends current “Sources used” affordance rather than replacing it.

### B) Confidence and uncertainty calibration

Define explicit language tiers tied to support level.

#### Proposed language contract

- **“The changelog says X”** → use only when a retrieved source states X directly.
- **“This suggests X”** → use when multiple grounded facts imply X but do not state it verbatim.
- **“I infer X”** → use for model interpretation or recommendation not directly present in sources.

#### Evaluative question policy (e.g., “strictly better?”)

For evaluative prompts, answer structure should be:
1. Short judgment with scope (`mostly`, `for players focused on ...`, etc.).
2. Supporting evidence bullets tied to source chips.
3. Explicit caveat section naming interpretation-dependent assumptions.

Required uncertainty language when applicable:
- “Based on available changelog/docs context...”,
- “I don’t see direct evidence for ... in current sources...”,
- “This is an inference, not a quoted release-note claim.”

### C) Mixed-context retrieval and answer planning

Use staged planning by source type before generation.

#### Source buckets

1. **Static docs/changelog bucket** (release notes, routes, docs pages).
2. **Live state bucket** (quest completion stats, inventory/process snapshot).
3. **Persona/lore bucket** (tone + role framing only, lowest factual authority).

#### Answer assembly stages

1. **Intent classification:** factual status, list request, evaluation, critique, or mixed.
2. **Bucket retrieval:** retrieve per bucket with explicit freshness tags.
3. **Conflict resolution:**
   - live state wins for player-specific current status,
   - changelog/docs win for product behavior and release history,
   - persona/lore never overrides factual buckets.
4. **Claim drafting:** annotate claims as direct/synthesis/inference.
5. **Response shaping:** include uncertainty when bucket coverage is incomplete.

#### Freshness/priority rules

- Prefer newest changelog anchor for “latest” queries.
- If docs/changelog disagree, prioritize canonical current release-state docs and add caveat.
- If player-state is missing for player-specific claims, do not guess; ask for a snapshot or narrow
  the answer to generic guidance.

### D) Actionability mode

Formalize a response mode for product/docs critique distinct from normal lore/help chat.

#### Trigger patterns

- “How could this be better?”
- “What should we change?”
- “How do we verify this?”
- “Turn this into tasks/design work.”

#### Output pattern (Actionability Mode)

1. **Observed issue(s)**
2. **Why it matters (player/dev/QA impact)**
3. **Concrete improvement options**
4. **Verification checks (route-level where possible)**
5. **Task-ready follow-up bullets**

This preserves transcript strengths (useful critique + QA checks) while making behavior deterministic
and auditable.

### E) Guardrails against subtle overreach

Introduce lightweight heuristics that separate summarization, interpretation, and recommendation.

#### Heuristics

- If wording contains normative conclusions (“strictly better”, “guaranteed”, “always”), require a
  caveat or downgrade language unless directly stated in source.
- If numeric/performance claims are cited, require local context framing (“reported in notes under
  specified benchmark conditions”).
- For changelog summarization, forbid adding ungrounded root-cause intent unless explicitly
  attributed as inference.
- For recommendation outputs, label recommendation blocks as proposal, not release fact.

#### Changelog-policy compatibility

- Any improvement suggestions about release notes should target future rendering/retrieval or
  assistant presentation behavior, not retroactive edits of historical changelog bodies under
  `frontend/src/pages/docs/md/changelog/`.

## 5) Response policy recommendations (compact contract)

Every substantial dChat answer should follow this contract:

1. **Answer:** direct response to user question.
2. **Evidence:** claim-group citations or source chips.
3. **Synthesis/interpretation:** clearly labeled when combining or inferring.
4. **Uncertainty/caveats:** explicit when evidence is partial or evaluative.
5. **Suggested next step:** only when useful (e.g., clarify intent, verify on route, ask for state).

## 6) Evaluation plan

Use scenario-based evaluations derived from this transcript and one mixed-context extension.

### Scenario A: “What’s the latest update in the game?”

- **Success:** identifies latest release context with correct date/version and cites current
  changelog/release-state source.
- **Failure:** stale version/date, missing citation, or confident answer without current-source tie.
- **High-priority mistake:** freshness error presented as certainty.

### Scenario B: “Please list the changes in 3.0.1”

- **Success:** structured list with accurate categories and claim-group evidence chips.
- **Failure:** omissions/additions not supported by source, or untraceable bullet claims.
- **High-priority mistake:** synthesis details that cannot be inspected back to source chunks.

### Scenario C: “Is 3.0.1 strictly better?”

- **Success:** scoped judgment + explicit caveats + labeled inference language.
- **Failure:** absolute yes/no framing without interpretation boundaries.
- **High-priority mistake:** evaluative confidence presented as direct changelog fact.

### Scenario D: “How could the 3.0.1 notes be better?”

- **Success:** actionability-mode structure (issues, rationale, concrete improvements, verify steps,
  task-ready outputs).
- **Failure:** generic writing advice disconnected from product routes/behaviors.
- **High-priority mistake:** recommendations mislabeled as existing release-note facts.

### Scenario E (mixed):
“Given I finished 11/248 quests, should I prioritize 3.0.1-related quest browsing or process
workflows first, and why?”

- **Success:** combines live progress context with changelog implications; distinguishes personalized
  advice from sourced release facts; cites both state and docs/changelog support.
- **Failure:** ignores live state, invents unavailable inventory/process facts, or over-personalizes
  without state evidence.
- **High-priority mistake:** claiming player-specific inventory/process status without grounded
  player-state input.

## 7) Prioritized follow-up implementation ideas

### P0 — UI/source rendering improvements

1. Replace coarse “Sources used” footer with claim-group citation chips and expandable evidence.
2. Add support-level badges: Direct, Synthesis, Inference.
3. Expose source freshness hints (e.g., changelog date/anchor) in expanded evidence.

### P1 — retrieval pipeline changes

1. Add retrieval bucket tagging (docs/changelog, live state, persona) in prompt assembly metadata.
2. Add conflict-resolution ordering rules in retrieval assembly (state > docs for player facts,
   docs/changelog > persona for product facts).
3. Add explicit missing-state detection path for player-specific questions.

### P1 — answer planning / prompt policy changes

1. Enforce confidence language tiers (“says”, “suggests”, “infer”).
2. Add evaluative-answer template with mandatory caveat block.
3. Add actionability-mode template for critique/task-generation prompts.

### P2 — evaluation harness additions

1. Add scenario suite mirroring A–E above with pass/fail rubrics.
2. Add calibration checks for overclaim patterns (absolute wording without direct support).
3. Add mixed-context regression probes for docs + live-state + route grounding consistency.

---

## Notes on repository alignment

- This proposal assumes the existing client-oriented chat stack and docs RAG architecture described
  in current design/QA materials, with incremental improvements to source rendering and answer
  planning rather than a new backend vector service.
- Historical changelog markdown remains immutable; this design targets retrieval behavior, evidence
  UX, and response policy.
