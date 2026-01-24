# DSPACE v3 Design: RAG Discoverability + Hallucination Mitigation (Chat)

**Status:** Draft (grounded to current v3 code)
**Audience:** Maintainers + contributors working on `/chat` and AI QA
**Scope:** RAG discoverability + hallucination mitigation for DSPACE chat (OpenAI path)

## Why this exists

The chat assistant is live in v3, but today it acts on a lightweight, client-side
knowledge summary. Users cannot see *what* was included in the prompt, and QA has
explicit requirements around grounding, safe refusal, and doc coverage.
This design tightens the spec to match the current architecture and defines
minimal, repo-consistent steps to add discoverability and reduce hallucinations.

## Goals

- Make the RAG context visible to users and QA (what the model “knows” for a reply).
- Improve grounding and safe-refusal behavior without adding a new server stack.
- Align behavior with QA policy in `docs/qa/v3.md`.
- Stay within current chat architecture (client-side OpenAI, no vector DB).

## Non-goals

- A new backend RAG service or vector store.
- Rewriting the chat UI or persona system.
- Full semantic search across the codebase.

---

## Current Architecture (as-is)

### Chat UI + client execution
- `/chat` is an Astro page that hydrates the chat UI via Svelte components
  (`frontend/src/pages/chat/index.astro`, `Integrations.svelte`,
  `OpenAIChat.svelte`).【F:frontend/src/pages/chat/index.astro†L1-L8】【F:frontend/src/pages/chat/svelte/Integrations.svelte†L1-L40】【F:frontend/src/pages/chat/svelte/OpenAIChat.svelte†L1-L118】
- Chat runs **entirely in the browser**. API keys are stored in game state
  and the OpenAI client is instantiated client-side with
  `dangerouslyAllowBrowser: true`.【F:frontend/src/pages/chat/svelte/OpenAIAPIKeySettings.svelte†L1-L71】【F:frontend/src/utils/openAI.js†L161-L163】

### Prompting + message construction
- The system prompt is sourced from `npcPersonas` (default `dchat`), with a
  fallback system prompt and welcome message if missing.【F:frontend/src/data/npcPersonas.js†L1-L33】【F:frontend/src/utils/openAI.js†L33-L57】
- The request payload uses the OpenAI **Responses API** and maps each chat
  message to `input_text` / `output_text` content blocks before calling
  `openai.responses.create(...)`.【F:frontend/src/utils/openAI.js†L14-L30】【F:frontend/src/utils/openAI.js†L151-L208】

### What “RAG” means today
- Retrieval is **not vector-based**. Instead, the app builds a *summary string*
  via `buildDchatKnowledge(...)` and injects it as a system message
  (`"DSPACE knowledge base:\n..."`).【F:frontend/src/utils/openAI.js†L170-L179】
- Knowledge sources are built locally in `frontend/src/utils/dchatKnowledge.js`:
  - Inventory snapshot from game state (localStorage/IndexedDB).【F:frontend/src/utils/dchatKnowledge.js†L63-L89】【F:frontend/src/utils/gameState/common.js†L95-L176】
  - Static items catalog (`frontend/src/pages/inventory/json/items/index.js`).【F:frontend/src/utils/dchatKnowledge.js†L1-L4】【F:frontend/src/utils/dchatKnowledge.js†L90-L117】
  - Processes list (`frontend/src/generated/processes.json`).【F:frontend/src/utils/dchatKnowledge.js†L1-L4】【F:frontend/src/utils/dchatKnowledge.js†L119-L130】
  - Quest metadata via `import.meta.glob` over quest JSON.
    Includes titles, descriptions, prereqs, rewards.【F:frontend/src/utils/dchatKnowledge.js†L21-L57】【F:frontend/src/utils/dchatKnowledge.js†L132-L170】
  - Quest progress, process progress, and achievements from game state.
    (Achievements derived via `evaluateAchievements`.)【F:frontend/src/utils/dchatKnowledge.js†L5-L6】【F:frontend/src/utils/dchatKnowledge.js†L172-L226】
- The knowledge summary is **size-capped** (e.g., `MAX_ITEMS`, `MAX_QUESTS`)
  and text is truncated to `MAX_DESCRIPTION_LENGTH` for determinism.
  There is no chunking or per-doc citation mapping today.【F:frontend/src/utils/dchatKnowledge.js†L6-L20】【F:frontend/src/utils/dchatKnowledge.js†L90-L170】

### Current error + uncertainty behavior
- The `dchat` system prompt explicitly tells the model to say “I don’t know”
  when unsure and to suggest docs or Discord; the welcome message also warns
  that responses may be wrong.【F:frontend/src/data/npcPersonas.js†L6-L19】
- Request failures are caught in the UI and surfaced with user-facing error
  messages via `describeOpenAIError(...)` and a default fallback message.
  Errors are logged to the console only.【F:frontend/src/utils/openAI.js†L45-L138】【F:frontend/src/pages/chat/svelte/OpenAIChat.svelte†L69-L104】

### What is *not* present
- No ingestion of `/docs` markdown or `docs/ROUTES.md` into chat context.
- No citation schema, source IDs, or UI affordance to show sources.
- No server-side telemetry or RAG logs (beyond `console.error`).

---

## Consistency with QA policy (docs/qa/v3.md)

QA expectations we must align to:

1) **Failure mode UX** — QA requires chat “work, or fail politely”.
   > “chat must either work, or fail *politely* with clear errors and no broken UI.”【F:docs/qa/v3.md†L532-L535】

   **Alignment:** current UI already shows fallback error strings on failures.
   This design keeps that behavior and adds clearer grounding indicators
   without changing the basic flow.【F:frontend/src/pages/chat/svelte/OpenAIChat.svelte†L69-L104】【F:frontend/src/utils/openAI.js†L45-L138】

2) **RAG coverage** — QA expects `/docs` + routes + changelog grounding:
   > “RAG includes `/docs` markdown sources ...” and
   > “RAG includes a route/map index (ex: `docs/ROUTES.md` ...)”【F:docs/qa/v3.md†L574-L579】

   **Alignment:** this is **not true today**. The current RAG context only
   includes inventory/items/quests/processes/achievements. This design adds
   a concrete plan to ingest docs/changelog/route indices (client-side)
   and surfaces them as discoverable sources.

3) **Safe refusal + grounding** — QA requires explicit “I don’t know” behavior
   and grounding when specifics are cited:
   > “If context is missing, model responds with uncertainty + asks a clarifying
   > question or suggests the exact doc page to consult.”【F:docs/qa/v3.md†L613-L615】
   > “When it does cite specifics ... those match retrieved docs/content.”【F:docs/qa/v3.md†L617-L617】

   **Alignment:** the `dchat` system prompt already instructs safe refusal but
   is not tied to explicit sources. This design extends the prompt to require
   source-backed citations and includes a UI section that exposes which sources
   were used.

**Optional QA doc update (small):** once the docs + routes ingestion ships,
update the QA checklist to note that RAG context is client-built and capped
by summary limits (so QA tests can use the same scope).

---

## Design updates: RAG discoverability + hallucination mitigation

### 1) Make RAG context visible (discoverability)

**User-facing affordance:** add a “Knowledge sources” drawer beneath the
assistant response, listing the context sections included in the prompt.
This is the lowest-scope way to show “what the model saw.”

**Source list (initial):**
- Inventory highlights (from save)
- Items catalog (static)
- Quests list + prereqs + rewards (static)
- Quest progress (from save)
- Achievements (from save)
- Processes + process progress (static + save)

**Proposed data shape:**
```ts
// frontend/src/utils/dchatKnowledge.js (new export)
export function buildDchatKnowledgeContext(gameState): {
  summary: string; // existing summary string
  sources: Array<{
    id: string;          // e.g. "inventory", "items", "quests"
    label: string;       // human-friendly name
    kind: 'state' | 'static' | 'docs';
    count?: number;      // how many entries were included
  }>;
}
```

**UI wiring:**
- Add a lightweight “Sources” section in `Message.svelte` or a new
  `ChatSources.svelte` component rendered for assistant messages only.
- The section renders the `sources[]` list from the chat response object.

**Repo landing points:**
- `frontend/src/utils/dchatKnowledge.js` (return a structured context)
- `frontend/src/utils/openAI.js` (return both `answer` + `sources`)
- `frontend/src/pages/chat/svelte/OpenAIChat.svelte` + `Message.svelte`
  (render sources for assistant responses)

### 2) Add structured citations (minimal, model-facing)

Today the chat returns **text only** (`GPT5Chat` returns `output_text`).
To make citations enforceable we need a structured response.

**Proposed response shape:**
```ts
type ChatResponse = {
  answer: string;
  citations: Array<{
    sourceId: string;    // matches buildDchatKnowledgeContext sources
    details?: string;    // optional short locator (quest id, item id, doc slug)
  }>;
};
```

**Prompt change:**
- Extend persona system prompts to explicitly require:
  - cite source IDs for factual claims
  - refuse if no source supports the claim

**Implementation detail (minimal):**
- Use the OpenAI Responses API `response_format` with a JSON schema for
  `ChatResponse` (fallback to text if schema fails).
- Parse in `frontend/src/utils/openAI.js` and return `{ answer, citations }`.

**UI:** show citations under the assistant response and map `sourceId`
back to a label from `buildDchatKnowledgeContext`.

### 3) Expand RAG coverage to match QA expectations

**Why:** QA requires `/docs` markdown, route index, and v3 changelog grounding.
Currently none are in the prompt.

**Client-side plan (no new server):**
- Import doc markdown from `frontend/src/pages/docs/md/**/*.md` via
  `import.meta.glob` and summarize a capped subset (title + first paragraph).
- Include v3 release notes from `frontend/src/pages/docs/md/changelog/`.
- Generate a lightweight route index JSON (from `docs/ROUTES.md`) into
  `frontend/src/generated/routes.json` via a small script in `scripts/`.

**New sources:**
- `docs` (markdown summaries)
- `routes` (route index)
- `changelog` (v3 notes)

### 4) Strengthen hallucination mitigation in prompts

Update persona prompts (starting with `dchat`) to explicitly:
- Disallow inventing items/quests/processes/routes.
- Require citing source IDs for factual claims.
- Ask a clarifying question or point to a doc slug if context is missing.

This directly maps to QA’s “never invent game facts” and “ask/point to docs”
requirements.【F:docs/qa/v3.md†L574-L615】

### 5) Minimal telemetry for QA/debug

There is no server-side telemetry today. Keep it lightweight:
- Log a structured debug entry to `console.info` when a response returns,
  containing `{ personaId, model, sourceCounts, citationCount, errorType? }`.
- Gate the log behind a feature flag (e.g. `telemetry.enabled` from `/config.json`)
  if/when client consumption is added. For now, treat it as opt-in dev tooling.

---

## Implementation Plan

### Stage 1 — Structured knowledge + sources (local only)
**Work:**
- Add `buildDchatKnowledgeContext` to return `{ summary, sources }`.
- Update `GPT5Chat` to return `{ answer, sources }` (text response + metadata).
- Render a “Sources” list in the chat UI for assistant messages.

**Acceptance criteria:**
- Chat still works with text-only responses.
- QA can see which knowledge sections were included for a reply.

**Tests:**
- Extend `tests/gpt5ChatResponses.test.ts` to validate sources are returned.
- Extend `frontend/e2e/chat-rag-context.spec.ts` to assert sources UI
  is visible and populated.

### Stage 2 — Docs + routes ingestion
**Work:**
- Import docs markdown from `frontend/src/pages/docs/md/**` and summarize.
- Add `scripts/build-routes-index.mjs` to generate
  `frontend/src/generated/routes.json` from `docs/ROUTES.md`.
- Add new source entries (`docs`, `routes`, `changelog`).

**Acceptance criteria:**
- Prompt includes docs/routes/changelog summary text.
- Sources drawer lists these entries with counts.

**Tests:**
- Unit test docs summarization (caps + deterministic output).
- Add QA probe in E2E (e.g. ask for a route and expect citations to routes).

### Stage 3 — Structured citations + safe refusal enforcement
**Work:**
- Add JSON schema `response_format` for `ChatResponse`.
- Update persona prompts to require citations and “I don’t know” when missing.
- Render citations under assistant messages and map to source labels.

**Acceptance criteria:**
- Assistant replies include citations for factual claims.
- When no source applies, assistant replies with a safe refusal + doc pointer.

**Tests:**
- Extend `frontend/tests/openAIChatErrorMessages.test.ts` with a
  refusal path.
- Add a mock response test asserting schema parsing works.

---

## Failure modes checklist

- **Retrieval mismatch:** citations reference a source that wasn’t included
  in `buildDchatKnowledgeContext`.
- **Prompt injection:** user asks the assistant to ignore citation rules.
- **Missing doc sources:** docs/routes/changelog summarizer fails or returns
  empty; assistant must refuse instead of guessing.
- **Overconfident precision:** model provides numeric values without citations.
- **Stale content drift:** doc summaries are outdated vs shipped v3 docs.

---

## Notes on scope

This design intentionally stays within the client-side chat architecture
and avoids new backend services. The staged approach allows immediate
RAG discoverability improvements (sources drawer) before implementing
full citations or doc ingestion.
