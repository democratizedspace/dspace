# DSPACE v3.1 token.place Chat integration design

## Goal and non-goals

DSPACE v3.1.0 should make `/chat` work immediately for fresh users with no sign-in, no API key, and no per-token cost concern. The default Chat provider will be **token.place API v1**. OpenAI remains available only as an explicit opt-in provider configured from `/settings` with the player's own OpenAI API key.

This design does not change production behavior yet. It is a plan for prompts 2-7 and intentionally avoids implementation beyond this document.

Hard non-goals for v3.1 Chat:

- Do not use token.place API v2.
- Do not add streaming. API v1 requests must be non-streaming and must not send `stream: true`.
- Do not install or use a token.place npm package.
- Do not send or persist a token.place API key, bearer token, or `Authorization` header.
- Do not use legacy token.place paths such as `/api/chat`, `/chat`, relay sink/source paths, or the current DSPACE `https://token.place/api/chat` compatibility shape.
- Do not make OpenAI the default fallback again.

## Current DSPACE Chat state

The current implementation has two parallel Chat paths rather than one provider-selected NPC chat experience:

- `frontend/src/pages/chat/index.astro` renders `TokenBadge` and `Integrations` inside the Chat page.
- `frontend/src/pages/chat/svelte/Integrations.svelte` loads the saved OpenAI key, always renders `OpenAIAPIKeySettings`, always renders `OpenAIChat`, and conditionally renders `TokenPlaceChat` only when `isTokenPlaceEnabled()` returns true. When token.place is disabled, it shows a banner that Chat currently works with an OpenAI key and that token.place will power v3.1.
- `frontend/src/pages/chat/svelte/OpenAIChat.svelte` contains the full DSPACE NPC chat UI: persona selection, welcome messages, player-state summary, prompt-debug panel, docs RAG metadata, save-snapshot hint, OpenAI error banners, and context-source display. It calls `buildChatPrompt()` and `GPT5ChatV2()` from `openAI.js`.
- `frontend/src/utils/openAI.js` owns the mature prompt/RAG/player-state logic. `buildChatPrompt()` builds system/persona messages, player state, DSPACE knowledge, docs RAG excerpts, debug messages, and `contextSources`. `GPT5ChatV2()` then sends those messages through the OpenAI client and returns `{ text, contextSources }`.
- `frontend/src/pages/chat/svelte/TokenPlaceChat.svelte` exists, but it is a simpler parallel UI with its own message history, static dChat persona, and no full OpenAIChat debug/persona/RAG surface. It calls `tokenPlaceChat()` and displays token.place-specific error banners.
- `frontend/src/utils/tokenPlace.js` currently gates token.place behind `tokenPlace.enabled` or `VITE_TOKEN_PLACE_ENABLED`, defaults its base URL to `https://token.place/api`, POSTs to `${baseUrl}/chat`, sends only `{ messages }`, and parses `data.reply`. That is a legacy shape and is not the v3.1 target.
- `frontend/src/utils/tokenPlaceErrors.js` already maps disabled, network, provider, and unknown token.place failures into UI summaries, but it will need structured API v1/content-policy/rate-limit handling.
- `frontend/src/utils/settingsDefaults.js` currently normalizes `showChatDebugPayload` and `showQuestGraphVisualizer` only.
- `frontend/src/utils/gameState/common.js` initializes and validates state with `settings: { ...DEFAULT_SETTINGS }`; every saved state goes through `normalizeSettings(state.settings)`.
- `frontend/src/pages/settings.astro` renders Settings panels for logout, QA cheats, quest graph, legacy save upgrade, and data reset. It does not own Chat provider selection or the OpenAI key yet.
- Existing tests cover the legacy token.place client (`frontend/__tests__/tokenPlace.test.js`), token.place error banners when token.place is manually enabled (`frontend/e2e/token-place-chat-banners.spec.ts`), OpenAI prompt/error behavior, and chat debug Settings flows that assume the full `OpenAIChat.svelte` panel exists.

## token.place API v1 contract for DSPACE

Use the public token.place API v1 launch contract as the integration target:

- Production origin: `https://token.place`.
- Staging origin: `https://staging.token.place`.
- Endpoint: `POST /api/v1/chat/completions`.
- Transport: direct browser `fetch` over HTTPS for now.
- Request body: OpenAI-compatible JSON including `model` and `messages`.
- Response parsing: OpenAI-compatible `choices[0].message.content`.
- Streaming: API v1 is non-streaming; never send `stream: true`.
- Default model: prefer `gpt-5-chat-latest` for DSPACE compatibility because token.place documents DSPACE compatibility aliases, including `gpt-5-chat-latest`. If a later prompt inspects current API docs or `/api/v1/models` and finds a better DSPACE-specific stable alias, document and test that override before changing it.

Minimal DSPACE request shape:

```json
{
  "model": "gpt-5-chat-latest",
  "messages": [
    { "role": "system", "content": "...DSPACE persona/RAG prompt..." },
    { "role": "user", "content": "...player message..." }
  ]
}
```

Minimal response extraction:

```js
const text = data?.choices?.[0]?.message?.content;
```

Forbidden token.place integration choices:

- `/api/chat`, `/chat`, `https://token.place/api/chat`, legacy relay endpoints, or any sink/source/retrieve compatibility route.
- `/api/v2/chat/completions`, API v2 model catalog integration, or SSE/token streaming.
- A token.place npm package or OpenAI SDK base-URL shim for token.place in this phase.
- Any token.place auth UX, token.place API key persistence, or `Authorization` header.

## Proposed DSPACE data model

Add a normalized Chat provider setting under existing game-state settings:

```ts
type ChatProvider = 'token-place' | 'openai';

settings: {
  showChatDebugPayload: boolean;
  showQuestGraphVisualizer: boolean;
  chatProvider: ChatProvider;
}
```

Normalization rules:

- `DEFAULT_SETTINGS.chatProvider` is `'token-place'`.
- Missing, null, unknown, or invalid `settings.chatProvider` normalizes to `'token-place'`.
- The only allowed values are `'token-place'` and `'openai'`.
- Keep the saved OpenAI key at `openAI.apiKey` for backwards compatibility with existing users and tests.
- Treat `tokenPlace.enabled` as legacy-only. It may be read for migration diagnostics, but it must not disable v3.1 default Chat and must not be required for token.place Chat.
- Optional token.place base URL can come from an environment variable such as `VITE_TOKEN_PLACE_URL` or from the existing `tokenPlace.url` compatibility field, but the resolved base should be an origin like `https://token.place`, not `https://token.place/api`. Endpoint joining must produce `/api/v1/chat/completions` exactly once.
- Optional model override can come from environment if needed for staging/prod operations, but default remains `gpt-5-chat-latest`.
- There is no `tokenPlace.apiKey`, no token.place credential form, and no token.place `Authorization` header.

## Proposed UI and component architecture

`/chat` should render one NPC chat panel whose provider is selected from normalized settings:

- Fresh users see the full NPC chat panel immediately with `data-provider="token-place"` and can send a message without configuring anything.
- The OpenAI API key form is removed from `/chat`.
- `/settings` owns Chat provider selection and OpenAI key management.
- Provider selection UI copy should make the default clear: token.place is free/no-key by default; OpenAI uses the player's key and may cost money.
- If OpenAI is selected but `openAI.apiKey` is empty, `/chat` should show a helpful guidance state linking to `/settings` instead of attempting a broken OpenAI request.
- The full DSPACE NPC/persona/debug/player-state/docs RAG UI from `OpenAIChat.svelte` should be preserved. Prefer extracting provider transport behind that UI rather than keeping separate OpenAI and token.place chat panels.

Recommended implementation shape:

1. Keep `buildChatPrompt()`, validation, context-source handling, persona prompts, player-state snapshotting, and docs RAG behavior provider-neutral.
2. Add a provider client boundary with a consistent return shape such as `{ text, contextSources }`.
3. Route `settings.chatProvider === 'token-place'` to a new token.place API v1 client using the same prompt payload that OpenAI receives.
4. Route `settings.chatProvider === 'openai'` to the existing OpenAI client only when `openAI.apiKey` is present.
5. Retire or convert `TokenPlaceChat.svelte` once the single NPC panel covers token.place. Avoid two simultaneously visible chat panels.

## Proposed implementation sequence for prompts 2-7

### Prompt 2: token.place API v1 client layer

- Replace the legacy `/chat` client path with a fetch-based API v1 client.
- Build URLs from an origin/base URL and `/api/v1/chat/completions` safely.
- Send `{ model, messages }` with `Content-Type: application/json` and no auth header.
- Parse `choices[0].message.content` and structured OpenAI-style errors.
- Add unit tests for success, malformed response, non-JSON response, network error, content-policy error, rate-limit error, abort signal, model/base URL override, and no `Authorization` header.

### Prompt 3: Settings provider configuration

- Add `settings.chatProvider` defaults and normalization.
- Add a Settings panel for token.place/OpenAI provider selection.
- Move OpenAI key management to `/settings` while preserving `openAI.apiKey` storage.
- Add unit/component tests for default normalization, invalid-value fallback, key persistence, and provider persistence.

### Prompt 4: single Chat page provider selection

- Refactor `/chat` to render one NPC chat UI.
- Default to token.place for missing/invalid provider settings.
- Use token.place client for default Chat and OpenAI client only for explicit OpenAI selection.
- Preserve persona, debug payload, player-state, docs RAG, welcome messages, save-snapshot hints, and context sources.
- Add the OpenAI-without-key guidance state.

### Prompt 5: unit and e2e coverage

- Add Playwright fresh-user `/chat` test with token.place fetch stub.
- Add Settings provider persistence test.
- Add OpenAI opt-in regression test with an OpenAI client/fetch stub.
- Add token.place error banner tests for network, provider, content-policy, malformed response, and rate-limit cases.
- Keep existing chat debug and remote smoke tests aligned with one chat panel.

### Prompt 6: user-facing docs and v3.1 QA

- Update user-facing docs to explain token.place default Chat and optional OpenAI.
- Create the `20260801` changelog entry without editing immutable historical changelog files.
- Flesh out `docs/qa/v3.1.md` with fresh-user Chat, Settings persistence, OpenAI opt-in, staging/prod base URL, and rollback checks.

### Prompt 7: release hardening

- Audit and remove legacy route usage such as `/api/chat`, `/chat` token.place calls, and any dead token.place enablement banners.
- Verify staging/prod token.place origins and model overrides.
- Confirm no token.place auth header or key storage exists.
- Run release checks and document staging/prod verification notes.

## Risks and mitigations

- **API v1 non-streaming latency:** keep the spinner and clear pending state; consider copy that requests can take a moment. Do not mitigate by enabling streaming in v3.1.
- **CORS/network failures:** classify fetch failures as network errors, keep messages user-friendly, and test with Playwright fetch stubs.
- **Structured token.place errors and rate limits:** parse OpenAI-style `{ error: { message, type, code } }`; map content-policy failures, 429/rate-limit errors, provider failures, and malformed responses to distinct banners where possible.
- **Preserving RAG/player-state/persona behavior:** reuse `buildChatPrompt()` and the full NPC UI rather than rebuilding a simplified token.place-only UI.
- **No OpenAI secrets to token.place:** assert in unit tests that token.place requests omit `Authorization` and do not include `openAI.apiKey` in body, headers, logs, or debug panels.
- **Legacy `tokenPlace.enabled` disables default Chat:** normalization and provider selection must ignore that legacy flag for v3.1 default behavior.
- **Base URL path duplication:** tests should cover `https://token.place`, `https://token.place/`, and legacy `https://token.place/api` compatibility input so the final URL is still `/api/v1/chat/completions`.
- **OpenAI opt-in regressions:** keep the existing OpenAI prompt tests and add e2e coverage proving OpenAI is only used when Settings selects it and a key exists.

## Test plan

Unit tests:

- `settingsDefaults` normalization defaults missing/invalid `chatProvider` to `'token-place'` and preserves `'openai'`.
- `gameState/common` validates old saves into `settings.chatProvider: 'token-place'` without requiring `tokenPlace.enabled`.
- token.place API v1 client posts to `/api/v1/chat/completions`, includes model/messages, parses `choices[0].message.content`, passes abort signals, and never sends `Authorization`.
- token.place client maps network errors, structured provider errors, `content_policy_violation`, 429/rate-limit responses, non-JSON responses, and malformed success bodies.
- OpenAI client remains isolated and reads only `openAI.apiKey` when provider is `openai`.

Playwright/e2e tests:

- Fresh-user `/chat` defaults to `data-provider="token-place"`, sends to a token.place fetch stub, and displays the assistant reply without API-key setup.
- `/settings` provider selection persists after reload and across navigation to `/chat`.
- OpenAI opt-in uses the OpenAI path only after selecting OpenAI in Settings and saving an OpenAI API key.
- OpenAI selected without a key shows a Settings guidance state and makes no OpenAI or token.place request.
- token.place network/provider/content-policy/rate-limit failures show the correct error banners and clear the spinner.
- Existing chat debug prompt panel remains visible when enabled from Settings.

Verification commands for implementation prompts:

```bash
npm run lint
npm run type-check
npm run link-check
cd frontend && npm run test:e2e -- token-place-chat settings chat
```

Use narrower unit-test commands during development when available, then run repo-standard checks before opening the v3.1 implementation PRs.

## Rollback plan

- Users who need an immediate workaround can select OpenAI in `/settings` and provide their own API key.
- Deployments can override token.place base URL and model for staging/prod incident response.
- If token.place has an outage, show a token.place-specific error banner and Settings guidance for OpenAI opt-in.
- Do not reintroduce OpenAI as the default provider. The v3.1 product contract remains token.place default and OpenAI optional.
