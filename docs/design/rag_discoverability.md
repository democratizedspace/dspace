# DSPACE v3 Design: RAG Discoverability + Hallucination Mitigation (Chat)

**Status:** Draft
**Audience:** Maintainers + contributors touching chat UX + OpenAI integration
**Scope:** `/chat` context visibility, grounding, and QA alignment for the OpenAI chat flow

## Why this exists

DSPACE v3 ships chat as a client-side OpenAI integration. Today the "RAG" layer is a curated
knowledge summary built in the browser, but the UI does not show what context was sent and the
prompts do not enforce consistent grounding across personas. This spec tightens the doc to match
current code and proposes the smallest, repo-consistent improvements needed for:

- **Discoverability:** make it clear what knowledge the assistant saw.
- **Grounding:** reduce confident-but-wrong answers by requiring explicit sources or uncertainty.
- **QA alignment:** match the hallucination guidance in `docs/qa/v3.md`.

---

## Current Architecture (as-is)

### Chat UI + request path
- `/chat` is an Astro page that hydrates a Svelte integration panel in the client.
  - `frontend/src/pages/chat/index.astro`
  - `frontend/src/pages/chat/svelte/Integrations.svelte`
- The OpenAI chat UI is a single Svelte component that builds the message list and calls the
  OpenAI helper.
  - `frontend/src/pages/chat/svelte/OpenAIChat.svelte`
  - It pushes a user message, calls `GPT5Chat()`, and renders the assistant reply.
  - Errors are caught and surfaced to the user as a friendly assistant message.
- Shared chat state (personas + messages) is managed in `frontend/src/stores/chat.js`.

### Model + prompting
- OpenAI responses are made **from the browser** via `frontend/src/utils/openAI.js`.
  - `GPT5Chat()` builds a prompt from:
    1) **Persona system prompt** from `frontend/src/data/npcPersonas.js` (or fallback).
    2) **Knowledge summary** from `frontend/src/utils/dchatKnowledge.js` (if any).
    3) Conversation history (user/assistant messages).
  - When there is no history, it seeds a welcome assistant message.
  - Responses API: `openai.responses.create({ model, input })` with `gpt-5.2` + fallback to
    `gpt-5-mini` on model access errors.
  - Inputs are `input_text` / `output_text` blocks per the Responses API.

### "RAG" / retrieval layer
- There is **no vector store** or server-side retrieval in v3.
- The knowledge layer is a **client-side summary** constructed from local game content and local
  save state:
  - Items: `frontend/src/pages/inventory/json/items/index.js`
  - Processes: `frontend/src/generated/processes.json`
  - Quests: `import.meta.glob('../pages/quests/json/**/*.json')`
  - Live state: inventory, quest progress, process progress, achievements
  - Source: `frontend/src/utils/dchatKnowledge.js`
- This summary is **not chunked** and uses fixed caps (e.g., `MAX_ITEMS`, `MAX_QUESTS`) with
  truncation. It is a single plain-text system message.

### Sources + citations
- There is no citation schema in the response, and the UI renders assistant text verbatim.
  - `frontend/src/pages/chat/svelte/Message.svelte`
- The system prompt for **dChat** explicitly says to avoid guessing and to say "I don't know," but
  other personas do not include that guardrail.
  - `frontend/src/data/npcPersonas.js`

### Telemetry + errors
- Error handling is user-visible (assistant message) plus `console.error`.
  - `frontend/src/pages/chat/svelte/OpenAIChat.svelte`
  - `frontend/src/utils/openAI.js` (`describeOpenAIError`)
- There is no persistent telemetry for chat requests/responses beyond test hooks.

---

## Problem statement

1) **Discoverability gap:** Players and QA cannot see what context was provided to the model, so
   it is hard to verify whether an answer was grounded in game data or guessed.
2) **Hallucination risk:** QA policy expects explicit grounding and "I don't know" behavior when
   context is missing, but only the default persona prompt enforces that.
3) **QA mismatch:** The QA checklist calls for RAG coverage of docs/routes/release notes; the
   current knowledge summary does not include those sources.

---

## Goals

- Make the *actual* context visible in the chat UI (discoverability).
- Ensure every persona inherits a shared grounding rule set.
- Provide a minimal citation mechanism that works with the current client-only architecture.
- Keep changes small, client-side, and compatible with the existing OpenAI flow.

## Non-goals

- Server-side retrieval or a vector database.
- Full-doc indexing in v3 (docs/changelog/sitemap ingestion is out of scope unless explicitly
  added as a new source).
- Streaming responses or tool calling changes.

---

## Consistency with QA policy (v3)

QA expectations for hallucination risk are documented in `docs/qa/v3.md`:

> "RAG includes `/docs` markdown sources" and "RAG includes a route/map index" (9.4.1).  
> "System prompt explicitly forbids inventing items, quests, processes, or routes" (9.4.1).  
> "If context is missing, model responds with uncertainty + asks a clarifying question" (9.4.4).

**Where we currently match:**
- The OpenAI flow already injects a system prompt and a knowledge summary system message.
- Error handling is user-visible and polite, aligning with the general QA principle that chat
  must fail gracefully.

**Where we currently diverge:**
- The knowledge summary does **not** include docs/routes/changelog sources; it is limited to
  items/quests/processes + live state.
- Only the default persona prompt (dChat) contains a "don't guess" instruction.

**Design alignment in this spec:**
- Introduce a **shared grounding prefix** applied to all personas in `openAI.js` to satisfy the
  "never invent game facts" requirement.
- Expose the **knowledge summary in the UI** so QA can verify coverage.
- Add a **minimal citation format** tied to known sources (items/quests/processes/route docs) so
  QA can see what an answer was grounded on.

**Optional QA doc update (small):**
- If we do not add docs/changelog as sources in v3, update QA 9.4.1 to reflect the current
  knowledge summary boundaries and track doc-ingestion as a v3.1 item.

---

## Proposed design (repo-consistent)

### 1) Make context visible in the chat UI

**User-facing change:** Add a "Context" panel in the chat UI that shows what the model sees.

**Implementation sketch (client-only):**
- Refactor `buildDchatKnowledge()` to optionally return **structured sections** instead of a
  single string.
  - New helper: `buildDchatKnowledgeSections(gameState)` returning an array like:
    ```ts
    type KnowledgeSection = {
        label: string;
        entries: string[];
        sourceRefs: Array<{ type: 'item' | 'quest' | 'process' | 'state'; id: string }>;
    };
    ```
- `buildDchatKnowledge()` can keep returning a string for the prompt by joining sections
  deterministically.
- Add a collapsible context panel to `OpenAIChat.svelte` that renders sections and counts, with a
  "Copy context" button for QA.

**Why this fits the repo:**
- No server changes.
- Uses existing game state and data imports already used by `dchatKnowledge.js`.
- Makes the current "RAG" layer explicit without adding new dependencies.

### 2) Grounding rules shared across personas

**User-facing change:** None directly, but responses should be more cautious.

**Implementation sketch:**
- Add a **base guardrail prompt** in `frontend/src/utils/openAI.js` that is prepended to every
  persona system prompt, e.g.:
  - "Never invent items, quests, processes, or routes. If the context does not include the
    answer, say you don't know and point to the docs or ask a clarifying question."
- Keep persona voice in `npcPersonas.js`; the guardrail is appended or prepended in `GPT5Chat()`.

### 3) Minimal citations for answers

**User-facing change:** Assistant messages can include a "Sources" footer when citations are
available.

**Implementation sketch:**
- Update the guardrail prompt to instruct: "When you use specific facts, add citations in the
  format `[@type:id]` (e.g., `[@quest:welcome/howtodoquests]`)."
- Add a light post-processor in `OpenAIChat.svelte` to parse citations from assistant text and
  render a sources row. (Keep the raw text intact for copy/paste.)
- Convert citations into links when possible:
  - quest → `/quests/[pathId]/[questId]` when path/ID are known
  - process → `/processes/[processId]`
  - item → `/inventory/item/[itemId]`
  - docs routes only if we explicitly add them as sources

**Note:** This is *not* true retrieval; it is a structured way to expose the sources the model was
provided in its context.

### 4) Minimal telemetry (QA-facing only)

**User-facing change:** None.

**Implementation sketch:**
- Add a small in-memory ring buffer on `window.__DSpaceChatTelemetry` that records:
  - timestamp, persona id, model, counts of knowledge entries, response length, error type
- Keep this **QA-only**: no API key, no message text, no user data.
- Optionally gate logging behind the QA cheats toggle if we want it hidden in normal gameplay.

---

## Implementation plan

### Stage 1 — Context visibility (discoverability)
**Changes**
- Add structured knowledge sections in `dchatKnowledge.js`.
- Render a collapsible context panel in `OpenAIChat.svelte`.

**Acceptance criteria**
- QA can see the exact inventory/quests/processes context sent to the model.
- Context panel renders on `/chat` with no errors and respects hydration.

**Testing**
- Unit: extend `frontend/tests/openAI.test.ts` or add new tests for the section builder.
- E2E: extend `frontend/e2e/chat-rag-context.spec.ts` to assert the context panel content.

### Stage 2 — Shared grounding rules + citations
**Changes**
- Add guardrail prompt shared across personas in `openAI.js`.
- Parse citations and render a "Sources" row in `Message.svelte` or `OpenAIChat.svelte`.

**Acceptance criteria**
- Non-dChat personas also use the "don't invent" rule.
- When the model includes citations, the UI renders them cleanly.

**Testing**
- Unit: verify prompt composition in `tests/gpt5ChatResponses.test.ts`.
- E2E: extend `chat-message-flow.spec.ts` or add a new test to verify citations rendering.

### Stage 3 — Minimal telemetry
**Changes**
- Add a QA-only telemetry buffer in the OpenAI path.

**Acceptance criteria**
- Telemetry contains no secrets or raw chat content.
- QA can introspect telemetry from the browser console when needed.

**Testing**
- Unit: verify telemetry records are created without including message text.

---

## Failure modes checklist

- **Retrieval mismatch:** The context panel does not match the system message sent to OpenAI.
- **Stale knowledge:** Quest/process JSON changes but knowledge summary is outdated in a running
  session.
- **Prompt injection:** User tries to override the guardrail; ensure the base system prompt remains
  first.
- **Missing sources:** Citations refer to non-existent routes or IDs.
- **No context:** Empty knowledge summary → model should respond with uncertainty, not guesses.

---

## Appendix: File touchpoints (planned)

- `frontend/src/utils/dchatKnowledge.js` — structured sections + summary builder
- `frontend/src/utils/openAI.js` — shared guardrail + prompt assembly + optional telemetry
- `frontend/src/pages/chat/svelte/OpenAIChat.svelte` — context panel + citation parsing
- `frontend/src/pages/chat/svelte/Message.svelte` — citation rendering (if kept close to message UI)
- `frontend/src/data/npcPersonas.js` — unchanged (persona voice stays here)

