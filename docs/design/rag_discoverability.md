# DSPACE v3 Design: RAG Discoverability + Hallucination Mitigation (Chat)

**Status:** Draft
**Audience:** Maintainers + contributors working on chat UX and AI integrations
**Scope:** `/chat` + `/dchat` knowledge grounding, sources visibility, and QA alignment

## Why this exists

Players use chat to answer questions about quests, items, processes, and game rules. Today the
assistant only receives a compact summary of game data, and the UI cannot show what sources were
used. QA has explicit requirements around grounding, safe uncertainty, and RAG coverage, so this doc
aligns the chat implementation with those requirements and keeps the plan consistent with how the
codebase actually works.

## Goals

- Make **retrieval/grounding discoverable** to players (show what the assistant used).
- Reduce hallucinations by **tightening prompts** and **scoping context** to real sources.
- Keep changes **repo-consistent** (client-side chat, no new server dependency required).
- Provide QA with **repeatable checks** and minimal telemetry for debugging.

## Non-goals

- Building a server-side vector database or embeddings pipeline.
- Replacing the existing OpenAI client flow.
- Changing chat UI layout beyond the additions needed for sources/grounding.

---

## Current architecture (as-is)

### Chat UI + message flow

- `/chat` and `/dchat` render `Integrations.svelte`, which mounts `OpenAIChat.svelte` (OpenAI is
  the default; token.place is hidden unless enabled).
  【F:frontend/src/pages/chat/index.astro†L1-L7】
  【F:frontend/src/pages/dchat/index.astro†L1-L18】
  【F:frontend/src/pages/chat/svelte/Integrations.svelte†L1-L41】
- Messages are stored in a Svelte store (`messages`) and counted via `countTokens`; there is no
  structured metadata for sources or citations today.【F:frontend/src/stores/chat.js†L1-L26】
- The message renderer (`Message.svelte`) accepts only markdown text and renders HTML; it has no
  UI for citations/sources.【F:frontend/src/pages/chat/svelte/Message.svelte†L1-L75】

### Model call path

- The OpenAI client is created **in the browser** using `openai.responses.create` and is fed a
  system prompt plus the user/assistant message history.【F:frontend/src/utils/openAI.js†L1-L189】
- Persona prompts live in `npcPersonas.js`, and the active persona is chosen in the chat UI. The
  prompt already asks the assistant to say “I don’t know” when unsure, but it does not require
  citing sources or forbid invented URLs/items explicitly.
  【F:frontend/src/data/npcPersonas.js†L1-L41】
- The `OpenAIChat.svelte` component handles errors by rendering a friendly fallback message (via
  `describeOpenAIError`) and logs to the console; there is no telemetry or source metadata
  captured with the message.
  【F:frontend/src/pages/chat/svelte/OpenAIChat.svelte†L68-L121】
  【F:frontend/src/utils/openAI.js†L45-L137】

### “RAG” today = knowledge summary, not retrieval

- `buildDchatKnowledge` composes a **summary string** from:
  - Inventory counts (from local game state)
  - Canonical items (`frontend/src/pages/inventory/json/items/index.js`)
  - Canonical processes (`frontend/src/generated/processes.json`)
  - Canonical quests (`frontend/src/pages/quests/json/**/*.json`)
  - Quest + process progress, achievements
  - The summary is **truncated and capped** (MAX_ITEMS/QUESTS/PROCESSES).
    【F:frontend/src/utils/dchatKnowledge.js†L1-L266】
- There is **no retrieval layer**, no chunking of `/docs` content, and no vector store. The system
  prompt simply prefixes this summary as “DSPACE knowledge base.”
  【F:frontend/src/utils/openAI.js†L166-L194】

### Telemetry + error visibility

- Server-side logging exists for HTTP routes (`logServerError`), but chat runs client-side and only
  logs to `console.error` on failures.
  【F:frontend/src/utils/serverLogger.ts†L1-L57】
  【F:frontend/src/pages/chat/svelte/OpenAIChat.svelte†L96-L121】
- `/config.json` exposes a `telemetry.enabled` flag, but chat does not consume it today.
  【F:frontend/src/utils/runtimeEndpoints.ts†L20-L49】

**Bottom line:** the current chat “RAG” is a fixed summary string with no citations, and it does
not include `/docs` or route knowledge. Any improvements must start by introducing a **retrieval
index** and a **sources UI** that can be driven entirely from the client.

---

## Consistency with QA policy

The QA checklist for v3 explicitly requires grounding, uncertainty, and doc coverage. Key
statements we must align with:

- “Goal: reduce ‘confident but wrong’ game answers... context coverage, and clear ‘I don’t know’
  behavior when the answer is not in context.”【F:docs/qa/v3.md†L572-L573】
- “RAG includes `/docs` markdown sources ... and a route/map index ... and release notes/changelog
  for v3.”【F:docs/qa/v3.md†L574-L579】
- “System prompt explicitly forbids inventing items, quests, processes, or routes that are not in
  context; require ‘check docs’ or ask a clarifying question instead.”【F:docs/qa/v3.md†L581-L583】
- “If context is missing, model responds with uncertainty + asks a clarifying question or suggests
  the exact doc page to consult.”【F:docs/qa/v3.md†L615-L616】

**Alignment plan:**

- Add a retrieval index that **includes `/docs` markdown** and **`docs/ROUTES.md`**, and expose that
  as explicit sources for chat.
- Add a shared **grounding guardrail** that all personas inherit (no invented items/routes; cite or
  ask for docs/save context).
- Extend the UI to show sources so QA can verify responses are grounded.

If we cannot add `/docs` coverage in the short term, we must explicitly flag the gap in QA notes and
avoid claiming full RAG coverage in docs (currently it is missing).

---

## Proposed design (repo-consistent)

### 1) Client-side retrieval index (build-time JSON)

**Why:** The chat flow is client-only today. A build-time JSON index allows deterministic retrieval
without a new backend service.

**Sources to index** (all are already in-repo):

- `/docs` markdown (`frontend/src/pages/docs/md/**/*.md`)
- Routes index (`docs/ROUTES.md`)
- Quests (`frontend/src/pages/quests/json/**/*.json`)
- Items (`frontend/src/pages/inventory/json/items/index.js`)
- Processes (`frontend/src/generated/processes.json`)

**Chunking strategy (simple + deterministic):**

- Markdown docs → strip frontmatter + code blocks, then split into 2–4 sentence chunks (max 600
  chars). Each chunk becomes a `source` with a stable `sourceId` and `url`.
- Quests/items/processes → one chunk per entity (title + description + key fields).
- Route index → one chunk per route line.

**Implementation location:**

- New script: `scripts/build-chat-knowledge-index.mjs`
- Output: `frontend/src/generated/chatKnowledgeIndex.json`
- Loader: `frontend/src/utils/chatRetrieval.js` (new) or extend
  `frontend/src/utils/dchatKnowledge.js` to return `{ summary, sources }`.

### 2) Retrieval in the chat flow

**Minimal change to `GPT5Chat`:**

- Accept a `retrieval` payload with `sources` + `query`.
- Prepend a **context block** that enumerates sources (title + URL + excerpt) and instructs the
  model to only answer from those sources or say “I don’t know.”
- Keep the existing persona system prompt, but prepend a **shared guardrail** string so all
  personas comply with QA requirements.

**Files to touch:**

- `frontend/src/utils/openAI.js` (add shared guardrail + optional retrieval context block)
- `frontend/src/utils/dchatKnowledge.js` (return summary + sources or delegate to new retriever)
- `frontend/src/pages/chat/svelte/OpenAIChat.svelte` (store sources on assistant messages)

### 3) Source visibility in the UI

**Response shape (client-side metadata):**

```ts
type ChatSource = {
    id: string;
    title: string;
    url?: string;
    kind: 'doc' | 'route' | 'quest' | 'item' | 'process';
    excerpt: string;
};

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    sources?: ChatSource[];
};
```

**UI additions:**

- `Message.svelte` renders a “Sources” disclosure below assistant messages when
  `message.sources?.length` is truthy.
- Each source displays `title` + `kind` + clickable `url` when available.
- Keep rendering markdown for message text; sources render outside the markdown block to prevent
  injection.

### 4) Minimal telemetry (opt-in, local-only)

- Respect `telemetry.enabled` from `/config.json` (already supported by
  `frontend/src/utils/runtimeEndpoints.ts`).
- When enabled, store the last N retrieval payloads in an in-memory ring buffer on
  `window.__DSpaceChatTelemetry` and log a `console.info` summary (no user message text by default).
- This provides QA/debug visibility without a new server endpoint.

---

## Implementation plan

### Stage 1 — Retrieval index + guardrail prompt

**Scope:** Build-time index + shared guardrail + retrieval block injected into `GPT5Chat`.

**Acceptance criteria:**

- A deterministic JSON index is generated and imported in the client.
- Prompt includes explicit “never invent items/routes” rules and cites available sources.
- Existing chat E2E still passes.

**Tests:**

- Unit: parser/chunker for docs + route index.
- Extend `tests/gpt5ChatResponses.test.ts` to assert the retrieval context block is present.

### Stage 2 — Sources UI

**Scope:** Store `sources` on assistant messages and render them in `Message.svelte`.

**Acceptance criteria:**

- When retrieval returns sources, the chat UI shows them below the assistant message.
- Sources are clickable and do not interfere with markdown rendering.

**Tests:**

- Unit: `Message.svelte` renders source list.
- E2E: extend `frontend/e2e/chat-rag-context.spec.ts` to assert the sources panel appears.

### Stage 3 — QA hardening

**Scope:** Expand source coverage + add failure-mode checks.

**Acceptance criteria:**

- `/docs` markdown + `docs/ROUTES.md` included in retrieval.
- When a question is out of scope, assistant responds with uncertainty and suggests the correct
  doc page or asks for a save snapshot.

**Tests:**

- Add a small “out-of-scope” prompt fixture to ensure the guardrail fires.

---

## Failure modes checklist

- **Retrieval mismatch:** retrieved sources don’t match the question (bad ranking or chunking).
- **Prompt injection:** user text tries to override the guardrail or source-only rule.
- **Missing source docs:** doc page referenced but not indexed (broken build index).
- **Stale content:** generated index out of date with current docs/quests.

---

## Notes on scope control

This design intentionally sticks to the **client-only architecture** already in use. If we later
add a server-side RAG service, this plan can evolve by swapping the retrieval implementation while
keeping the same UI and message metadata shape.
