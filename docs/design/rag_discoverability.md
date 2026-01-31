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
- Stage 3 adds a non-breaking `GPT5ChatV2` that returns `{ text, contextSources }`, where
  `contextSources` is a deterministic list of `Source` objects
  (`type`, `id`, `label`, optional `url`/`detail`) for docs and knowledge-pack grounding.
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
DocsRag now layers deterministic forced-inclusion heuristics (routes, changelog, process
semantics) on top of MiniSearch results to avoid lexical misses in the chat context packer
(`frontend/src/utils/docsRag.js`).

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

### 0) Failure-mode fixes (v3 release checklist alignment)

This section turns the QA “known failure modes” into concrete, shippable fixes for v3. Each
subsection describes what to add, where it lives, and how QA can validate it. The seven items
below map 1:1 to the QA 9.4.2 checklist and are additive to the staged design plan that follows.

#### A) Custom content blind spot (PR-only answers)
**Problem:** The model claims custom content is only possible via PRs or repo edits and omits the
in-game editor, import/export, and backup workflows.

**Fix:**
- **Knowledge coverage:** add the custom content docs + routes to the knowledge summary so the
  model sees the editor, backup, and import/export flows in context. Source the docs index from
  `frontend/src/pages/docs/json/sections.json` and include `/docs` entries for custom content and
  quest submission guidance, plus the `/contentbackup` and `/quests/manage` routes from
  `docs/ROUTES.md`.
- **Forced include:** if the prompt matches custom content intent, force-include a matching
  custom content docs chunk in RAG so editor/import/export/backup guidance is always present.
- **Prompt guardrail:** append the shared hallucination guardrail sentence defined later in this
  doc to every persona prompt so the system message explicitly requires doc-backed answers.
- **UI disclosure:** show “Sources used” so QA can confirm custom content docs were in-context.

**QA validation:** prompt “How do I add custom content?” should mention the in-game editor and
backup/import/export workflows with a `/docs` reference, and should not claim PRs are required.

#### B) Stale content drift (v2/v3 mismatch)
**Problem:** The model describes deferred or removed features (e.g., token.place as active in v3).

**Fix:**
- **Knowledge coverage:** include the v3 changelog or release notes in the context summary, and
  ensure the doc index references the current `/docs/changelog` entry.
- **Prompt guardrail:** add a sentence to all personas that the assistant must reference the v3
  docs and avoid describing deferred features as active.
- **Source hygiene:** prefer docs from the v3 branch and remove older staging URLs from the
  knowledge pack.

**QA validation:** prompt “Is token.place active?” should answer “not in v3” and cite the v3 docs.

#### C) Non-reasoning model regression (guessing)
**Problem:** The non-reasoning `/chat` configuration guesses instead of saying “I don’t know.”

**Fix:**
- **Shared guardrail:** make the “don’t invent / ask a clarifying question” sentence part of the
  system prompt for *all* personas and providers so the non-reasoning model has the same rule.
- **Regression probes:** add 2–3 scripted prompt checks that expect a clarifying question or a
  doc reference when context is missing, and run them against the non-reasoning config.

**QA validation:** non-reasoning probes should respond with uncertainty + doc pointers, not guesses.

#### D) Made-up game state (invented inventory/quests)
**Problem:** The model claims it can see a user’s balances, inventory, or quest progress without a
provided save.

**Fix:**
- **Guardrail:** explicitly forbid claiming access to player state unless a save snapshot or game
  state is provided. Require a clarification request when state is absent.
- **Context labeling:** when `buildDchatKnowledge` includes game state, label it as “Snapshot:
  local game state” to make the presence/absence obvious to the model.
- **UI disclosure:** show whether local game state was a source in the “Sources used” list.

**QA validation:** prompt “What’s in my inventory?” should refuse or request a save snapshot.

#### E) Incorrect routes/UX (invented pages or menu paths)
**Problem:** The model recommends routes or menus that don’t exist.

**Fix:**
- **Route index grounding:** include `docs/ROUTES.md` (or a generated route list) in the context
  summary and add `route` entries to the source list.
- **Answering rule:** system prompt should instruct the assistant to reference `/docs` or
  `docs/ROUTES.md` when giving URLs or navigation steps.
- **Doc additions:** ensure docs for key flows (custom content, backups, chat) list the actual
  routes used in the UI.

**QA validation:** prompt “What are the current game routes?” should cite `docs/ROUTES.md`.

#### F) Incorrect data semantics (requires/consumes/creates mixups)
**Problem:** The model swaps process semantics or misstates duration behavior.

**Fix:**
- **Docs grounding:** ensure the processes doc includes precise definitions of
  requires/consumes/creates and duration normalization; include it in the knowledge summary.
- **Prompt reminder:** add a short line to the guardrail sentence: “If you mention process
  semantics, ensure they match the docs.”
- **Source emphasis:** include the process semantics doc in sources so QA can verify coverage.

**QA validation:** prompts about process recipes should match the doc semantics exactly.

#### G) Overconfident precision (exact numbers without sources)
**Problem:** The model gives exact counts, durations, or drop rates without grounding.

**Fix:**
- **Guardrail:** require explicit source backing when giving exact numbers; otherwise respond with
  ranges or uncertainty.
- **Context limitation:** keep the knowledge summary trimmed to only known facts; avoid synthesizing
  exact numbers from partial context.
- **UI disclosure:** “Sources used” makes it clear when exact numbers are (or are not) available.

**QA validation:** if no source provides exact values, the model should avoid precision.

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
- Generate build-time MiniSearch artifacts for docs chunks and routes under
  `frontend/src/generated/rag/` to keep QA coverage deterministic and client-only.
- At runtime, query the MiniSearch artifacts on each chat turn and inject a
  small, URL-anchored docs excerpt block into the system prompt.

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
