# DSPACE Design: dChat RAG Grounding and Actionability

**Status:** Draft proposal  
**Audience:** Maintainers working on `/chat`, docs/changelog retrieval, and QA  
**Scope:** Improve trust, grounding visibility, uncertainty calibration, and mixed-context handling for dChat without changing core game content

## 1) Problem statement

The transcript is a **strong success signal** for dChat: it stays on-topic, retrieves concrete v3/v3.0.1
release details, and gives useful follow-up analysis instead of generic filler. It demonstrates that
DSPACE’s current deterministic knowledge assembly and docs/changelog retrieval can produce
high-utility answers.

However, transcript-level success is not enough for long-term trust. The same conversation also
shows scalability risks:

- Synthesis quality currently outpaces visible evidence.
- “Sources used” appears as a coarse footer, not claim-level grounding.
- Evaluative answers can sound more certain than the inspectable proof shown to users.
- The interaction was mostly docs/changelog-centric; mixed questions (live quest/inventory + docs +
  lore) are harder and need explicit planning.

Without these improvements, dChat can feel smart but hard to verify.

---

## 2) What the transcript demonstrates today

### Grounding wins

1. **Concrete retrieval over obvious hallucination**
   - dChat gives specific references such as “April 1, 2026,” `/changelog#20260401`, and a detailed
     v3.0.1 breakdown instead of vague “recent update” language.
2. **Abstraction control**
   - It starts with a concise “latest update” summary, then zooms into v3.0.1 when prompted,
     matching the user’s granularity.
3. **Route-scoped framing**
   - It organizes changes by `/quests`, `/processes`, `/docs`, migration, and release governance,
     which aligns with DSPACE’s route/documentation conventions.

### Product usefulness wins

1. **Nuanced evaluative reasoning**
   - On “strictly better?”, dChat avoids naive yes/no and surfaces tradeoffs (performance wins,
     strictness changes, first-search latency).
2. **Actionable critique generation**
   - It turns patch notes into concrete improvements: sectioning, “what you’ll notice,” behavior
     change callouts, and QA verification steps.
3. **Helpful next-step prompts**
   - It asks for user priorities to tailor conclusions, which supports real product decision-making.

---

## 3) Risks and failure modes surfaced by the transcript

1. **Evidence display lags synthesis strength**
   - The response quality implies strong grounding, but the UI only shows “Sources used,” limiting
     trust inspection.
2. **Coarse source footer hides claim provenance**
   - Users cannot tell which bullet came from which changelog chunk versus assistant synthesis.
3. **Potential overconfidence in tone**
   - Phrases like “strict improvement” can sound stronger than direct source language.
4. **Weak uncertainty surfacing for evaluative prompts**
   - Interpretation-heavy answers do include nuance, but uncertainty labeling is inconsistent.
5. **Likely asymmetry across query types**
   - Performance appears stronger on docs/changelog retrieval than on mixed stateful queries
     combining quest progress, inventory/process state, and lore context.
6. **Low inspectability when sources disagree or differ in freshness**
   - Users cannot easily see whether a claim came from static docs, changelog notes, or live state.

---

## 4) Proposed RAG improvements

### A) Claim-to-source grounding UX

Move from a generic footer to **inspectable claim grounding**.

#### Proposal

- Introduce **claim-group citations** in each answer section, e.g.:
  - `Direct source support` chips (docs/changelog/state).
  - `Synthesis` badges when combining multiple sources.
- Add expandable evidence rows per claim group:
  - source label (e.g., `/changelog#20260401`)
  - short excerpt/snippet
  - source type (`changelog`, `docs`, `live_state`, `knowledge_pack`)
- Keep current source list for backward compatibility, but render it as a collapsed summary.

#### Implementation shape (repo-consistent)

- Extend the existing `contextSources` flow (already present in tests/design notes) to include
  optional claim-group IDs and support level (`direct` vs `synthesized`).
- UI change is confined to chat rendering components; no historical changelog body edits.

### B) Confidence and uncertainty calibration

Adopt a fixed language contract tied to support type.

#### Confidence labels

- **“The changelog says X”** → use only when directly quoted/paraphrased from one source.
- **“This suggests X”** → use when pattern exists across multiple source facts.
- **“I infer X”** → use when conclusion is interpretive and not explicitly stated.

#### Evaluative answer rules (e.g., “strictly better?”)

- Required structure:
  1. direct facts
  2. interpretation
  3. possible user-dependent tradeoffs
- If answer depends on player goals or local state, include an explicit caveat sentence.

### C) Mixed-context retrieval and answer planning

Use staged assembly by source type before final generation.

#### Stage plan

1. **Intent classification**: docs-only vs mixed-context.
2. **Source retrieval by lane**:
   - static docs/changelog (`docsRag` artifacts)
   - live player state (quest progress, inventory/process state)
   - persona/lore context
3. **Conflict/freshness resolution**:
   - live state > release-state docs > historical changelog narrative notes
   - when conflicts persist, present both and mark uncertainty.
4. **Answer plan emission**:
   - facts by lane
   - synthesis points
   - unresolved ambiguities.

#### Key rule

When mixing lanes, dChat should never silently merge conflicting claims; it must expose the
priority rule or ask a clarifying follow-up.

### D) Actionability mode

Preserve transcript strengths by adding a dedicated response mode for critique-to-task output.

#### Trigger examples

- “How could these notes be better?”
- “What should we change in docs/release notes?”
- “Turn this into implementation tasks.”

#### Output pattern

- `What works`
- `What is unclear/risky`
- `Proposed improvements`
- `How to verify`
- `Candidate implementation tasks` (scoped to docs/UI/retrieval/prompt/eval)

This is distinct from normal lore/help answers and should be explicit in tone and structure.

### E) Guardrails against subtle overreach

Add heuristics that block unsupported escalation from summary to recommendation.

#### Heuristics

1. **Summarization guard**: do not introduce new causal claims absent in sources.
2. **Interpretation guard**: prefix interpretive judgments with support level (“suggests” / “infer”).
3. **Recommendation guard**: recommendations must reference at least one observed pain point or
   missing evidence from current sources.
4. **Patch-note guard**: avoid words like “strictly” or “guaranteed” unless all cited claims are
   direct and non-conditional.

---

## 5) Response policy recommendations (compact contract)

For dChat answers in grounded/product mode, use this template:

1. **Answer**: direct response to user question.
2. **Evidence**: claim-group citations with direct source links.
3. **Synthesis/Interpretation**: clearly labeled inference.
4. **Uncertainty/Caveats**: explicit constraints or ambiguity.
5. **Suggested next step** (only if useful): clarifying question, verification step, or scoped task.

---

## 6) Evaluation plan

Use scenario-based evals modeled on the transcript, with pass/fail + mistake taxonomy.

| Scenario | Success looks like | Failure looks like | High-priority mistake |
|---|---|---|---|
| “What’s the latest update in the game?” | Correct latest release reference with date + anchor, plus concise summary and citation chips. | Wrong release recency, vague answer, or no inspectable evidence. | Freshness error (stale changelog). |
| “Please list the changes in 3.0.1” | Structured list grouped by subsystem with claim-group evidence and no invented bullets. | Missing major sections, invented details, or uncited synthesis presented as fact. | Fabricated patch notes. |
| “Is 3.0.1 strictly better?” | Separates facts vs interpretation, includes tradeoff caveats, calibrated language. | Overconfident absolute claim without caveats or evidence distinction. | Calibration failure on evaluative reasoning. |
| “How could the 3.0.1 notes be better?” | Produces actionable editorial/QA improvements mapped to player impact and verification steps. | Generic writing advice detached from route/symptom context. | Non-grounded recommendations. |
| Mixed query: “Given my current quest progress and inventory, should I prioritize v3.0.1-related quest cleanup or docs review first?” | Uses both live state and changelog/docs, labels source lanes, and explains priority logic. | Ignores live state, pretends unavailable state exists, or hides source conflict. | Mixed-context grounding failure. |

### Metrics

- **Grounding precision**: % of factual claims with valid direct or synthesis citation.
- **Calibration score**: % of evaluative answers using correct confidence phrasing.
- **Conflict transparency**: % of mixed queries that expose lane conflicts/freshness explicitly.
- **Actionability utility**: rubric score for critiques producing verifiable next steps.

---

## 7) Prioritized follow-up implementation ideas

### P0 — UI/source rendering improvements

1. Claim-group citation chips with expandable evidence snippets.
2. Support-level badges: `Directly supported` vs `Assistant synthesis`.
3. Collapsible “Sources used” summary retained for compatibility.

### P1 — Retrieval pipeline changes

1. Multi-lane retrieval output (docs/changelog/live-state/persona lane IDs).
2. Freshness/priority metadata included in retrieved context.
3. Conflict detector for contradictory lane claims before final response assembly.

### P2 — Answer-planning / prompt policy changes

1. Confidence phrase policy (`says` / `suggests` / `infer`) embedded in chat response contract.
2. Evaluative-question template enforcing fact→interpretation→caveat flow.
3. Actionability mode template for critique + QA-verification outputs.

### P3 — Evaluation harness additions

1. Transcript-inspired regression suite for grounding + calibration.
2. Mixed-context benchmark scenarios with expected lane usage.
3. Automatic checks for unsupported certainty words in evaluative outputs.

---

## Constraints and compatibility notes

- This proposal is documentation/design only; no runtime code changes are included here.
- Historical changelog markdown remains immutable; improvements target retrieval/rendering/chat UI
  behavior (for example source display and notes interpretation), not rewriting archived changelog
  body text.
- Design aligns with current DSPACE architecture where chat grounding and docs retrieval are
  deterministic and client-oriented in v3.
