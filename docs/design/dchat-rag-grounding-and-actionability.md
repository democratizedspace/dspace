# dChat RAG grounding and actionability

**Status:** Draft  
**Audience:** Maintainers and contributors working on chat UX, docs retrieval, and QA  
**Scope:** `/chat` response grounding, confidence calibration, mixed-context retrieval, and
actionability patterns using existing v3 architecture

**Related documents:** Builds on and should be implemented alongside
[`docs/design/rag_discoverability.md`](./rag_discoverability.md), which defines the
`{ text, contextSources }` response shape and baseline "Sources used" UX.

## 1) Problem statement

The transcript is a strong success signal for dChat:

- It stayed anchored to concrete in-product artifacts (`/changelog`, route-scoped updates, version
  and date references) instead of drifting into generic patch-note filler.
- It answered at useful abstraction levels: short answer first, deeper detail when the user nudged.
- It handled evaluative and editorial prompts productively ("strictly better?", "how improve notes?")
  instead of only paraphrasing source text.

However, transcript-level quality is not enough for trust at scale. The conversation shows stronger
synthesis than evidence visibility. Without claim-level inspectability and calibrated uncertainty,
players cannot reliably distinguish:

- direct source-backed facts,
- assistant interpretation, and
- assistant recommendations.

As dChat handles more mixed questions (docs/changelog + live quest state + inventory/process state
+ lore context), this trust gap becomes the primary failure mode.

## 2) What the transcript demonstrates today

### Grounding wins

- **Concrete changelog retrieval:** dChat cited a specific date (April 1, 2026), release family
  (`v3`, `v3.0.1`), and route anchor (`/changelog#20260401`) rather than inventing a release.
- **Progressive detail behavior:** it moved from "latest update" summary to granular patch bullets
  only when asked.
- **Route-aware explanations:** several responses mapped statements to route scopes (`/quests`,
  `/processes`, `/docs`), which aligns with DSPACE docs and QA conventions.
- **Reasonable tradeoff framing:** the "strictly better" answer included caveats and edge cases,
  which is healthier than a blanket yes/no.

### Product usefulness wins

- **Actionable editorial critique:** dChat produced useful changelog improvement suggestions
  (player-visible grouping, "what you'll notice", risk callouts, "how to verify" checks).
- **Implementation-adjacent thinking:** it translated release-note content into QA-like validation
  steps that a maintainer can run.
- **Question narrowing:** it invited the user to choose gameplay vs technical focus, reducing
  ambiguity.

## 3) Risks and failure modes surfaced by the transcript

1. **Evidence display lags synthesis strength.**
   Responses were well-composed, but the visible grounding was mostly a coarse "Sources used"
   footer.
2. **No claim-to-source mapping.**
   Users cannot inspect which specific source chunk supports which claim.
3. **Potential overconfidence tone.**
   Phrases like "strict improvement" can sound stronger than what source text alone proves.
4. **Weak uncertainty labels for evaluative answers.**
   The model gave nuance, but did not explicitly tag which parts were interpretation vs direct quote.
5. **Likely modality imbalance.**
   The transcript suggests strong docs/changelog handling; mixed questions requiring live state
   reconciliation are higher risk.
6. **Inspection friction.**
   Users cannot quickly answer "why did dChat say this?" without opening multiple docs manually.

## 4) Proposed RAG improvements

### A) Claim-to-source grounding UX

Move from one footer to structured evidence disclosure per answer.

#### Proposal

Add an evidence model with two explicit support types:

- `direct`: claim is directly supported by one source chunk.
- `synthesis`: claim combines multiple sources and/or light reasoning.

Render it in response UI as:

1. **Inline citation chips** after factual claim groups (e.g., `[changelog:20260401]`).
2. **Expandable evidence drawer** per chip with:
   - source display label (human-readable title),
   - source URL/link (e.g., `/docs/changelog/20260401`),
   - anchor/section,
   - short excerpt,
   - support type (`direct` or `synthesis`).
3. **Claim-group citations** when many bullets share one source (avoid visual noise).

#### Claim-to-source binding contract

`contextSources` today is a per-turn list. To support per-claim inspectability, add a lightweight
mapping layer in the answer payload:

- `claimGroups[]`: ordered claim-group blocks rendered in the response body.
- Each claim group has a stable `claimGroupId` and `sourceRefs[]`.
- `sourceRefs[]` contains `Source.id` values from `contextSources` (or stable positional indexes
  if `Source.id` is unavailable during migration).
- Each `sourceRef` can optionally include `supportType` (`direct` / `synthesis`) and
  `excerptSpan`/`anchor`.

This keeps existing `contextSources` plumbing intact while making inline chips and evidence drawers
deterministically renderable.

#### Repo-fit notes

- `contextSources` already exists in prompt payload plumbing (`buildChatPrompt`, `GPT5ChatV2`) and
  can carry richer attribution metadata without changing core chat model calls.
- Existing source typing in `frontend/src/utils/contextSources.js` (`doc`, `route`, `changelog`,
  `state`, etc.) is a good base for chip labels and filters.

### B) Confidence and uncertainty calibration

Define wording tiers tied to evidence strength.

#### Confidence lexicon

- **"The changelog says X"** → use only when source text explicitly states X.
- **"This suggests X"** → use when text implies a likely outcome but does not assert it.
- **"I infer X"** → use when combining evidence with gameplay/product judgment.

#### Evaluative question policy (example: "strictly better?")

Response should contain, in order:

1. **Judgment with scope:** "Mostly better for performance/correctness/security."
2. **Evidence-backed facts:** concrete changelog items.
3. **Interpretive caveats:** where player experience may differ.
4. **Explicit uncertainty tag:** "Interpretation, not direct changelog wording."

### C) Mixed-context retrieval and answer planning

Questions can span static docs and live local state. Use staged assembly by source type.

#### Proposed retrieval plan

1. **Intent classification (lightweight):** release/docs, player-state, mixed, or lore.
2. **Parallel retrieval lanes:**
   - Lane 1: docs/changelog chunks (`docsRag`).
   - Lane 2: live player snapshot (`PlayerState`, quest progress, inventory/process state).
   - Lane 3: static game catalogs (items/processes/quests summaries).
3. **Answer planner merges lanes** into a structured draft with claim tags:
   - `source:doc`, `source:changelog`, `source:state`, `source:item`, `source:process`,
     `source:quest`, `source:achievement`, `source:synthesis`.

> Note: Lane 3 ("catalogs") is a retrieval concept. Attribution should use the existing granular
> `SourceType` values (`item`/`process`/`quest`/`achievement`) unless/until a deliberate type
> extension is approved.

#### Freshness and conflict rules

When sources disagree:

1. **Live state beats static summaries** for "what I currently have/did" claims.
2. **Changelog/docs beat model prior** for release-history claims.
3. **Newest dated source beats older dated source** for version-state claims.
4. **If unresolved conflict remains:** report both values and ask a clarifying follow-up.

### D) Actionability mode

The transcript shows strong critique generation; formalize this as an explicit response pattern.

#### Trigger

Activate when user asks "how could this be better", "what should we change", "how verify", or
"turn this into tasks".

#### Output contract for Actionability mode

- **Observation:** what the source currently says.
- **Issue:** why this may confuse users/maintainers.
- **Proposed change:** concrete, bounded improvement.
- **Verification step:** route-level check ("open `/quests` on cold load...").
- **Task seed:** one implementation-ready ticket stub.

Keep this mode distinct from normal lore/help responses by adding a short header label
(e.g., "Actionability mode: changelog critique").

### E) Guardrails against subtle overreach

Introduce heuristics that block unsupported leap statements.

#### Heuristics

1. **No "strictly" superlatives without explicit criteria + caveat.**
2. **Quantitative claims require visible numeric evidence.**
3. **Security/perf recommendation language must separate fact from recommendation.**
4. **Summarization vs interpretation vs recommendation labels required in evaluative answers.**

#### Example (patch-note style)

- **Allowed summary:** "Changelog reports quest-list TTI improvements from X to Y."
- **Allowed interpretation:** "This suggests faster browsing on similar workloads."
- **Allowed recommendation:** "Add device/test-context notes so players can interpret the numbers."
- **Disallowed overreach:** "All players will experience instant loads in all cases."

## 5) Response policy recommendations (compact contract)

For non-trivial dChat answers, return sections in this order:

1. **Answer** (direct response, 1–3 sentences).
2. **Evidence** (claim-group citations or chips).
3. **Synthesis / interpretation** (explicitly labeled if present).
4. **Uncertainty / caveats** (explicit when interpretation is involved).
5. **Suggested next step** (only when it improves user outcome).

This keeps helpfulness while making support boundaries legible.

## 6) Evaluation plan

Use scenario-based checks modeled on this transcript.

### Scenario A: "What's the latest update in the game?"

- **Success:** cites latest dated changelog entry, names version/date correctly, provides linkable
  evidence.
- **Failure:** stale version, missing date, or ungrounded latest-claim language.
- **Critical mistake class:** freshness grounding failure.

### Scenario B: "Please list the changes in 3.0.1"

- **Success:** sectioned summary that maps to changelog areas and keeps claims source-backed.
- **Failure:** fabricated bullets, omitted major sections, or no claim-level evidence.
- **Critical mistake class:** attribution granularity failure.

### Scenario C: "Is 3.0.1 strictly better?"

- **Success:** provides scoped judgment + explicit interpretation label + caveats.
- **Failure:** absolute yes/no without uncertainty framing.
- **Critical mistake class:** calibration failure on evaluative question.

### Scenario D: "How could the 3.0.1 notes be better?"

- **Success:** actionable critique with verification steps and implementation-ready suggestions.
- **Failure:** generic writing advice not tied to DSPACE routes/symptoms.
- **Critical mistake class:** actionability failure.

### Scenario E (mixed):
"Given my current quest completion and inventory, should I prioritize any 3.0.1-related checks?"

- **Success:** combines changelog implications with live player state and clearly labels which
  recommendations depend on local state.
- **Failure:** ignores state, invents missing state, or conflates static docs with live data.
- **Critical mistake class:** mixed-context fusion/conflict failure.

### Metrics to track across scenarios

- Claim citation coverage (% claims with inspectable evidence).
- Evidence precision (% citations that actually support the claim).
- Calibration score (appropriateness of certainty language by answer type).
- Mixed-context correctness (state-vs-doc conflict handling accuracy).
- Actionability usefulness (reviewer rating: "could this become an issue/task directly?").

## 7) Prioritized follow-up implementation ideas

### UI / source rendering improvements

1. Add claim-group citation chips in chat messages.
2. Add expandable evidence drawer with excerpt + support type (`direct`/`synthesis`).
3. Add optional confidence badge per response section.

### Retrieval pipeline changes

1. Extend `contextSources` metadata to include chunk/anchor and support type.
2. Add source-lane tagging using existing source types (`doc`, `changelog`, `state`, `item`,
   `process`, `quest`, `achievement`) in retrieval payloads.
3. Add deterministic freshness ordering for dated changelog/docs claims.

### Answer-planning / prompt policy changes

1. Enforce confidence lexicon rules ("says" vs "suggests" vs "infer").
2. Enforce evaluative-answer template with explicit caveat block.
3. Add Actionability mode template and trigger detection.

### Evaluation harness additions

1. Add transcript-derived scenario set to chat regression checks.
2. Add scoring rubric for evidence coverage and calibration.
3. Add mixed-context conflict test cases (docs vs live state disagreements).

## Constraints and compatibility notes

- Keep changelog history immutable; improvements should be in retrieval, rendering, and response
  formatting layers, not retroactive edits to historical changelog markdown bodies.
- Keep architecture client-compatible and incremental: reuse existing `docsRag`,
  `buildChatPrompt`, and `GPT5ChatV2` pathways before introducing new infrastructure.
