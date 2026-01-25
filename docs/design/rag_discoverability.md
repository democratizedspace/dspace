# DSPACE v3 Design: RAG Discoverability + Hallucination Mitigation (Chat)

**Status:** Draft (grounded to current v3 implementation)  
**Audience:** Maintainers + contributors working on chat UX, RAG context, and QA  
**Scope:** `/chat` and dChat knowledge-base grounding in v3 (OpenAI first, token.place later)

## Why this exists

The v3 chat experience already ships with a curated knowledge summary, but it is **not** true
retrieval or RAG in the vector sense. The current system is a deterministic “context packer” that
concatenates a subset of quests, items, processes, achievements, and live player state into the
system prompt. That makes the assistant helpful, but it has three shortcomings:

1) **Discoverability:** users cannot see *what sources* the assistant used, which makes it harder
   to trust or debug answers.
2) **Hallucination mitigation:** QA expects “don’t invent” guardrails and explicit uncertainty.
   Today only the default dChat persona has that language.
3) **Coverage drift:** QA policy expects `/docs`, routes, and release notes to be part of the
   grounding context, but the current knowledge pack does not include them.

This design doc tightens the spec to match reality, then proposes a small, repo-consistent
augmentation that makes sources visible, guards against hallucinations, and aligns with QA policy
without introducing heavyweight infrastructure.

---

## Goals

- Make the current RAG context **discoverable** in the chat UI (show sources used per reply).
- Align system prompts with the QA “don’t invent facts” rule across all personas.
- Add a lightweight docs/routes grounding layer that fits the existing client-only architecture.
- Keep the implementation small and deterministic; no server-side retrieval in v3.

## Non-goals

- Vector search, embeddings, or external vector databases.
- Server-side RAG pipeline or new backend services in v3.
- Streaming responses or tool calls (not in current chat flow).

---

## Current Architecture (as-is)

### Chat UI + message flow
- The `/chat` page hydrates the Svelte chat integrations via
  `frontend/src/pages/chat/index.astro` and `frontend/src/pages/chat/svelte/Integrations.svelte`.
- OpenAI chat renders in `frontend/src/pages/chat/svelte/OpenAIChat.svelte` and calls
  `GPT5Chat` from `frontend/src/utils/openAI.js` with the message history.
- token.place chat (gated by feature flags) renders in
  `frontend/src/pages/chat/svelte/TokenPlaceChat.svelte` and calls `tokenPlaceChat` from
  `frontend/src/utils/tokenPlace.js`.

### Retrieval / “RAG” context (current)
- The only retrieval mechanism is **string assembly** inside
  `frontend/src/utils/dchatKnowledge.js` via `buildDchatKnowledge(gameState)`.
- Sources used today:
  - Items catalog: `frontend/src/pages/inventory/json/items/index.js`
  - Processes catalog: `frontend/src/generated/processes.json`
  - Quests catalog: `frontend/src/pages/quests/json/**/*.json` via `import.meta.glob`
  - Achievements: `frontend/src/utils/achievements.js`
  - Live player state: `loadGameState()` in `frontend/src/utils/gameState/common.js`
- The summary is capped with hard limits (ex: `MAX_ITEMS`, `MAX_PROCESSES`, `MAX_QUESTS`) and
  truncated descriptions; there is **no chunking** and **no ranking** beyond sorting.
- The summary is injected as a **system message** with the prefix
  `DSPACE knowledge base:` in `frontend/src/utils/openAI.js`.

### Prompting + response shape
- Persona system prompts are defined in `frontend/src/data/npcPersonas.js` and passed into
  `GPT5Chat` as the system message. Only the **dChat persona** currently includes explicit
  “If you’re unsure, say you don’t know” language.
- `GPT5Chat` calls our OpenAI client via `openai.responses.create` (a project-level abstraction
  over the OpenAI Chat Completions API) and returns **only the output text** string (no citations,
  no metadata).
- token.place chat builds a simple system + user message list and returns a string reply.

### Error handling + uncertainty
- OpenAI errors are mapped to user-facing copy in `frontend/src/utils/openAI.js` and surfaced
  by `OpenAIChat.svelte`.
- token.place errors are caught in `TokenPlaceChat.svelte` with a generic fallback message.
- There is **no UI affordance** to show what sources were used or how much context was present.

### Telemetry
- Chat-related telemetry is limited to `console.error` in the client. There is no structured
  RAG logging or “context used” trace.

---

## Consistency with QA policy (docs/qa/v3.md)

QA’s AI chat section is explicit about both *polite failure* and *grounded answers*.
Relevant excerpts:

> Goal: reduce “confident but wrong” game answers before v3 launch. Focus on content grounding,
> context coverage, and clear “I don’t know” behavior when the answer is not in context.
This design satisfies it by making the knowledge summary explicit and adding deterministic sources
in the chat UI, so uncertainty and coverage are visible to QA (file touchpoints:
`frontend/src/utils/dchatKnowledge.js`, `frontend/src/utils/openAI.js`,
`frontend/src/pages/chat/svelte/OpenAIChat.svelte`).

> - [ ] RAG includes `/docs` markdown sources from `frontend/src/pages/docs/md/` (especially custom
>       content, quests, processes, and inventory docs).
> - [ ] RAG includes a route/map index (ex: `docs/ROUTES.md` and/or a generated sitemap) to avoid
>       invented URLs.
This design satisfies it by extending the knowledge summary with `/docs` titles + slugs and the
route index (file touchpoints: `frontend/src/utils/dchatKnowledge.js`, `docs/ROUTES.md`,
`frontend/src/pages/docs/json/sections.json`).

> - [ ] System prompt explicitly forbids inventing items, quests, processes, or routes that are not
>       in context; require “check docs” or ask a clarifying question instead.
> - [ ] System prompt includes an explicit “never invent game facts” rule, points to
>       `docs/ROUTES.md` or asks for a save snapshot when unsure, and is versioned/synced between
>       staging and prod.
This design satisfies it by appending a shared “never invent” guardrail to every persona prompt
so every provider uses the same uncertainty language (file touchpoints:
`frontend/src/data/npcPersonas.js`, `frontend/src/utils/openAI.js`).

> - [ ] If context is missing, model responds with uncertainty + asks a clarifying question or
>       suggests the exact doc page to consult.
This design satisfies it by requiring the guardrail sentence to explicitly instruct “I don’t know”
responses and by surfacing source lists so QA can confirm when context is missing (file
touchpoints: `frontend/src/data/npcPersonas.js`, `frontend/src/pages/chat/svelte/Message.svelte`).

> - [ ] Quest graph diagnostics surface and export reports (Map + Diagnostics tabs)
This design satisfies the *debug visibility* expectation by proposing a minimal, opt-in chat
diagnostics hook that exposes context metadata when telemetry is enabled (file touchpoints:
`frontend/src/utils/openAI.js`, `frontend/src/pages/chat/svelte/OpenAIChat.svelte`).

> - [ ] E2E tests pass (Playwright or equivalent)
This design satisfies it by adding a deterministic “Sources used” UI assertion to the existing
Playwright suite (file touchpoints: `frontend/e2e/chat-rag-context.spec.ts`).

Today’s implementation partially satisfies the “fail politely” rule via error mapping, but
**does not satisfy** the RAG coverage and “don’t invent” guardrails for all personas. This
spec aligns the design doc to QA by:

1) Adding **docs + routes** to the knowledge summary.
2) Standardizing the **uncertainty + “don’t invent”** language for every persona prompt.
3) Surfacing **context sources** in the UI so QA can verify grounding.

### Solutions for QA failure modes (9.4.2)
The QA checklist now treats hallucination modes as **fixes to implement**. Below are
concrete solutions that map to those fixes.

1) **Custom content blind spots**
   - **Add docs coverage:** include `/docs` pages for the custom content editor, import/export,
     and backup flows in the knowledge summary and sources list.
   - **Prompt guardrail:** require the assistant to state that custom content can be created
     via the in-game editor and import/export; do not imply “PR-only” changes.
   - **QA validation:** use the “How do I add custom content?” probe to ensure the response
     links to `/docs` and mentions the editor + import/export paths.

2) **Stale content drift**
   - **Release notes grounding:** add v3 release notes/changelog entries to the summary so the
     model can assert which features are active vs deferred.
   - **Prompt rule:** add an explicit clause: “If a feature is deferred (ex: token.place), say
     it is inactive in v3 and point to the release notes.”
   - **QA validation:** probe “Is token.place active?” and confirm the answer matches v3 notes.

3) **Non-reasoning model regression**
   - **Shared guardrails:** enforce identical “don’t invent” language across all persona
     prompts regardless of reasoning model selection.
   - **Probe loop:** run 2–3 non-reasoning prompts; if any response guesses, tighten
     guardrails or add a dedicated “uncertainty sentence” appended to system prompts.

4) **Made-up game state**
   - **State access disclaimer:** add a standard line: “I cannot see your save unless you
     provide a snapshot; ask me to interpret it.”
   - **UI + docs tie-in:** surface the “Sources used” list to show when no save context was
     present, and recommend the save/import docs as next steps.

5) **Incorrect routes/UX**
   - **Routes grounding:** embed `docs/ROUTES.md` into the knowledge summary with a compact
     index of canonical routes.
   - **Response rule:** only reference routes in the index and point to `/docs` for
     navigation paths.

6) **Incorrect data semantics**
   - **Semantic primer:** include the “requires/consumes/creates + duration” rules in the
     summary so the model can restate them accurately.
   - **QA validation:** run the “Processes doc examples” probe from QA and ensure the answer
     matches the documented semantics.

7) **Overconfident precision**
   - **Precision guardrail:** add a policy: “Exact counts, durations, or drop rates require a
     cited source; otherwise answer with uncertainty or a range.”
   - **UI enforcement:** pair exact answers with “Sources used” in the UI so QA can verify
     grounding for precise numbers.

### If QA doc is outdated
**What’s missing today:** QA policy does not spell out that v3 “RAG” is a **client-only,
deterministic knowledge summary** nor that source visibility is expected via UI disclosures
instead of server logs. It also doesn’t yet acknowledge the planned “Sources used” block or
lightweight chat diagnostics.

**What Stage 2/3 proposes:** Stage 2 adds `/docs` + routes into the summary; Stage 3 adds
`contextSources` in the UI and a telemetry-gated diagnostics hook.

**Minimal QA doc tweak (if repo stays client-only):** Add a note under 9.4 that “RAG” means
local summary assembly (no vector DB), require the docs/routes index to be included, and allow
UI-level source disclosures + telemetry-gated metadata for QA validation.

---

## Design: RAG Discoverability + Hallucination Mitigation

### 1) Add a Source Registry to the Knowledge Builder

**Change:** update `buildDchatKnowledge` to return **both** a summary string and a structured
source list.

Proposed return shape:
```ts
{
  summary: string;
  sources: Array<{
    type: 'item' | 'process' | 'quest' | 'achievement' | 'doc' | 'route' | 'state';
    id: string;
    label: string;
    url?: string;
    detail?: string;
  }>;
}
```

**Why this fits:** `buildDchatKnowledge` already iterates the catalogs and game state, so it
can emit a parallel `sources` list without new infra. It stays deterministic and local.

**Compatibility note:** this is a breaking change to the current string-only return shape.
Consider a staged migration (e.g., `buildDchatKnowledgeWithSources` or a feature-flagged
return shape) so callers like `GPT5Chat` can be updated incrementally.

**Where:** `frontend/src/utils/dchatKnowledge.js` (new helper to append sources while summarizing).

### 2) Extend Context Coverage with `/docs` + routes

**Docs grounding (lightweight):**
- Use the existing docs index consumed by the live `/docs` page:
  `frontend/src/pages/docs/json/sections.json` (imported by
  `frontend/src/pages/docs/index.astro`).
- Emit a short “Docs index” summary (titles + slugs) and add each doc to the `sources` list.

**Routes grounding:**
- Include the canonical route list from `docs/ROUTES.md` in the knowledge summary as a short
  section.
- Add a `route` source entry for each route group to avoid invented URLs.

These changes align with QA’s RAG coverage requirements without introducing embeddings.

**Rule:** If a source isn’t currently present in-repo, this spec **must** say so and treat it
as a proposal (not an existing dependency).

### 3) Standardize “don’t invent” prompts across personas

**Change:** add a shared guardrail sentence to *every* persona system prompt (not just dChat).

Suggested sentence to append:
> “Never invent quests, items, processes, routes, or player state. If you’re unsure, say you
> don’t know and point to the relevant `/docs` page or ask a clarifying question.”

**Where:** `frontend/src/data/npcPersonas.js` (append to each persona’s `systemPrompt`).

### 4) Cite sources in the UI (discoverability)

**Change:** extend chat message data to carry `contextSources` on assistant replies.

- Add a versioned helper (e.g., `GPT5ChatV2`) in `frontend/src/utils/openAI.js` that returns
  `{ text, contextSources }`, while keeping the existing `GPT5Chat` string-returning API for
  backward compatibility during migration.
- Update `OpenAIChat.svelte` to attach `contextSources` to the assistant message object.
- Render a collapsible “Sources used” block in `Message.svelte` (or a new subcomponent).

**Why:** this gives QA and players visibility into *what context* the model saw without
parsing the model response itself.

### 4.1) Sources + citations contract (single place)

**Contract (proposed):**
- `GPT5ChatV2` returns:
  ```ts
  {
    text: string;
    contextSources: Array<{ type: string; id: string; label: string; url?: string }>;
  }
  ```
- `OpenAIChat.svelte` stores the data on the assistant message as:
  ```ts
  {
    role: 'assistant';
    content: string;
    contextSources?: Array<{ type: string; id: string; label: string; url?: string }>;
  }
  ```
- `Message.svelte` renders a collapsed disclosure labeled “Sources used” and lists sources in
  deterministic order (e.g., type then label) from the knowledge builder output. The list is
  **not** derived from the model response, and the UI does not accept LLM self-reported
  citations unless a structured response format is introduced later (optional Stage 4).

### 5) Minimal telemetry + debug hooks

**Goal:** enable QA to inspect context without leaking secrets.

Proposal (opt-in):
- When `telemetry.enabled` is true in the runtime config endpoint (currently served at
  `/config.json`), store the last request’s `contextSources` + summary length in
  `window.__DSpaceChatDiagnostics` for QA.
- Keep contents **metadata only** (no raw API keys or full message text).

**Where:** `frontend/src/utils/openAI.js` and/or `OpenAIChat.svelte`.

---

## Implementation Plan

### Stage 1 — Source registry + persona guardrails
**Changes:**
- Update `buildDchatKnowledge` to return `{ summary, sources }`.
- Add shared “don’t invent” guardrails to all persona prompts.

**Acceptance criteria:**
- Chat requests still include a single system prompt + knowledge summary.
- Source list includes items, quests, processes, achievements, and state snapshots.
- Persona prompts in `npcPersonas.js` all include the explicit uncertainty language.

### Stage 2 — Docs + routes grounding
**Changes:**
- Add docs index + routes list to `buildDchatKnowledge` summary.
- Add corresponding `sources` entries.

**Acceptance criteria:**
- Knowledge summary contains `/docs` titles + slugs and route index data.
- QA probes about custom content, routes, and v3 release notes are answerable
  without invented URLs.

### Stage 3 — UI citations + diagnostics
**Changes:**
- Introduce `GPT5ChatV2` (or similar) response shape and update
  `OpenAIChat.svelte` message objects to use it.
- Render “Sources used” in `Message.svelte` (collapsed by default).
- Add `window.__DSpaceChatDiagnostics` when telemetry is enabled.

**Acceptance criteria:**
- Each assistant reply shows a deterministic list of sources used for that turn.
- QA can inspect source lists in the UI and via diagnostics.

---

## Testing Plan (repo-aligned)

### Unit tests
- `frontend/__tests__/dchatKnowledge.test.js` (or new file):
  - Ensures `buildDchatKnowledge` returns `summary` + `sources`.
  - Verifies docs + routes entries appear when enabled.
- Update `tests/gpt5ChatResponses.test.ts` (existing) to assert the new return shape and
  `contextSources` propagation.

### Simple eval harness plan (deterministic)
- Extend `tests/gpt5ChatResponses.test.ts` with golden fixtures that assert:
  - The generated prompt includes a knowledge summary and a shared “never invent” guardrail.
  - `contextSources` propagates from `buildDchatKnowledge` through `GPT5ChatV2` to the returned
    response object.
  - When context is absent (mock empty summary + sources), the prompt contract includes the
    “don’t know / ask clarifying question” instruction.
- Keep the harness purely unit-level: strict schema assertions and serialized fixtures only,
  no new services or infrastructure.

### E2E tests (Playwright)
- Extend `frontend/e2e/chat-rag-context.spec.ts`:
  - Verify that a “Sources used” block renders and contains item/quest/process IDs.

---

## Failure Modes Checklist

- **Retrieval mismatch:** sources list does not reflect summary content.
- **Prompt injection:** user messages try to override system prompt; guardrails must remain
  first system message.
- **Missing source docs:** docs/routes list missing or stale; ensure `ROUTES.md` is updated.
- **State hallucination:** assistant claims access to inventory or quests when no game state is
  present in local storage.
- **Provider mismatch:** token.place lacks the expanded knowledge summary; document this
  difference explicitly until v3.1.

---

## Notes on scope

This design intentionally avoids backend RAG or embeddings for v3. The aim is to **make the
existing context visible and aligned with QA expectations**, then incrementally add lightweight
sources (docs + routes) without changing the client-only architecture.
