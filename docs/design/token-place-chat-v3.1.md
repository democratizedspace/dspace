# token.place Chat integration design for DSPACE v3.1.0

## Goal and non-goals

DSPACE v3.1.0 should make `/chat` usable immediately for a fresh browser profile: no auth, no
OpenAI API key, and no per-token billing concern. The default Chat provider must be
**token.place API v1**. OpenAI remains available only as an explicit opt-in provider configured in
`/settings` with the user's existing client-side OpenAI API key.

This document is intentionally an implementation plan only. Prompt 1 must not change production
runtime behavior beyond adding this design document.

Hard constraints for v3.1 Chat:

- Use direct HTTPS `fetch` requests to token.place API v1.
- Production token.place origin: `https://token.place`.
- Staging token.place origin: `https://staging.token.place`.
- Endpoint: `POST /api/v1/chat/completions`.
- Request body includes `model` and `messages`.
- Response parser reads OpenAI-compatible `choices[0].message.content`.
- Use non-streaming requests only.
- Prefer model `gpt-5-chat-latest` for DSPACE compatibility unless the current token.place API v1
  contract identifies a better DSPACE-specific default.
- Do not store, request, or send a token.place API key. The DSPACE token.place integration is
  zero-auth.
- Do not send an `Authorization` header to token.place.
- Do not use `/api/chat`, `/chat`, legacy relay endpoints, API v2, streaming, or a token.place npm
  package.

## Current-state summary of DSPACE Chat

Inspection of the current DSPACE implementation shows a two-track Chat page that still defaults to
OpenAI:

- `frontend/src/pages/chat/index.astro` renders the Chat page shell and hydrates
  `Integrations.svelte`.
- `frontend/src/pages/chat/svelte/Integrations.svelte` currently renders the OpenAI API-key form,
  always renders `OpenAIChat.svelte`, and conditionally renders `TokenPlaceChat.svelte` only when
  `isTokenPlaceEnabled()` returns true. This is a parallel-rendering model, not a single selected
  provider model.
- `frontend/src/pages/chat/svelte/OpenAIChat.svelte` contains the complete NPC chat experience:
  persona selection, welcome messages, player-state and docs RAG prompt construction, debug payload
  UI, save-snapshot hints, context-source metadata, loading states, and OpenAI error banners.
- `frontend/src/utils/openAI.js` owns the current prompt/RAG logic. It builds the DSPACE system
  prompt, player-state summary, docs RAG context, model fallback behavior, response validation, and
  user-facing OpenAI error summaries.
- `frontend/src/pages/chat/svelte/TokenPlaceChat.svelte` exists, but it is a simpler parallel UI. It
  does not preserve the full NPC/persona/debug/context-source behavior in `OpenAIChat.svelte`.
- `frontend/src/utils/tokenPlace.js` currently treats token.place as feature-flagged/disabled by
  default and posts to a legacy `${baseUrl}/chat` path. It returns `data.reply`, not
  `choices[0].message.content`.
- `frontend/src/utils/tokenPlaceErrors.js` already centralizes token.place user-facing error copy,
  but later prompts should expand it for API v1 structured errors, network failures, rate limits,
  and content-policy failures.
- `frontend/src/pages/chat/svelte/OpenAIAPIKeySettings.svelte` stores the OpenAI API key in
  `gameState.openAI.apiKey`, but the component is currently mounted on `/chat`.
- `frontend/src/pages/settings.astro` currently owns account/session settings and debug toggles but
  does not yet render Chat provider settings or OpenAI key management.
- `frontend/src/utils/settingsDefaults.js` normalizes settings booleans only. It does not yet
  normalize a Chat provider choice.
- `frontend/src/utils/gameState/common.js` persists game state in IndexedDB/localStorage and imports
  `normalizeSettings()`, making it the right persistence path for `settings.chatProvider`.
- `frontend/__tests__/tokenPlace.test.js` currently asserts the legacy token.place `/chat` path and
  feature flag behavior. Those tests should be replaced or migrated in prompt 2.
- Current Playwright chat specs stub OpenAI through `window.__DSpaceOpenAIClient` and validate the
  existing OpenAI chat UI, error states, persona behavior, RAG metadata, and remote smoke behavior.
  Later prompts should preserve these checks while adding token.place-default coverage.

## token.place API v1 contract

The token.place public launch contract describes API v1 as the active production API for the 0.1.x
line, with non-streaming relay/client-server inference paths. The landing page documents
`POST /api/v1/chat/completions` as a non-streaming chat-completion endpoint and states that API v1
rejects `stream: true`. The token.place README also says API v1 is non-streaming, API v2 is outside
the active API v1 runtime contract, and deprecated legacy relay endpoints must not be used.

The DSPACE integration should use this plaintext OpenAI-compatible API v1 shape:

```http
POST https://token.place/api/v1/chat/completions
Content-Type: application/json
```

```json
{
  "model": "gpt-5-chat-latest",
  "messages": [
    { "role": "system", "content": "...DSPACE NPC/persona/RAG prompt..." },
    { "role": "user", "content": "Hello!" }
  ]
}
```

Expected response parsing:

```js
const text = data?.choices?.[0]?.message?.content;
```

Implementation notes for prompt 2:

- Build the URL by joining a base origin with `/api/v1/chat/completions`; avoid double `/api` or
  legacy `/chat` suffixes.
- Default base origin should be production `https://token.place`, with a staging/environment
  override path for `https://staging.token.place`.
- Send `Content-Type: application/json` only. Do not send OpenAI API keys, token.place API keys, or
  any `Authorization` header.
- Include `stream: false` only if needed for explicitness; never set `stream: true`.
- Validate that `choices[0].message.content` is a non-empty string before returning it.
- Preserve the ability to pass an `AbortSignal` for UI cancellation and tests.
- Map OpenAI-compatible structured error bodies, including `error.message`, `error.type`,
  `error.code`, and HTTP status, into DSPACE token.place error summaries.

The token.place repository currently registers `gpt-5-chat-latest` as a compatibility alias routed
to the API v1 launch model and includes an integration test that posts a DSPACE-style request to
`/api/v1/chat/completions` and asserts `choices[0].message.content`. That supports using
`gpt-5-chat-latest` as DSPACE's v3.1 default model.

## Proposed DSPACE data model

Add a normalized Chat provider setting under existing persisted game state settings:

```js
settings: {
  chatProvider: 'token-place' | 'openai';
}
```

Rules:

- Allowed values are exactly `token-place` and `openai`.
- Missing, null, unknown, misspelled, or legacy values default to `token-place`.
- Keep OpenAI API keys in the existing `openAI.apiKey` field for backwards compatibility.
- Do not migrate, rename, or expose the OpenAI key beyond the existing client-side storage model in
  this v3.1 provider-selection work.
- Treat old `tokenPlace.enabled` flags as legacy compatibility only. They must not disable default
  v3.1 Chat. A saved `tokenPlace.enabled=false` from v3.0.x must not turn `/chat` into a broken or
  disabled page after the v3.1 migration.
- An optional token.place base URL may come from an environment variable and, for compatibility,
  from an existing `tokenPlace.url` state field. The compatibility field should only affect the base
  origin/path; it must not imply enablement and must not include or require credentials.
- There must be no token.place API key field in settings, game state, localStorage, IndexedDB, URL
  params, request headers, or docs examples.

Suggested normalization in `settingsDefaults.js`:

```js
const CHAT_PROVIDER_VALUES = new Set(['token-place', 'openai']);
const normalizeChatProvider = (value) =>
  CHAT_PROVIDER_VALUES.has(value) ? value : 'token-place';
```

`normalizeSettings()` should include `chatProvider: normalizeChatProvider(base.chatProvider)` while
preserving the existing defaults for debug and quest-graph settings.

## Proposed UI

### `/chat`

`/chat` should render one NPC chat panel, not two parallel provider UIs.

- Default provider is `token-place` for fresh users and invalid/missing settings.
- The Chat page should reuse the complete NPC/persona/debug UI behavior currently concentrated in
  `OpenAIChat.svelte` rather than keeping token.place in a reduced separate panel.
- The OpenAI API-key form should not appear on `/chat`.
- When the selected provider is `token-place`, the shared chat UI calls token.place API v1.
- When the selected provider is `openai`, the shared chat UI calls the existing OpenAI path.
- When OpenAI is selected but `openAI.apiKey` is missing, `/chat` should show a helpful guidance
  state linking to `/settings` instead of sending a broken request.
- Provider-specific errors should appear as banners in the same location and style as current chat
  errors.
- The UI should retain `data-testid="chat-panel"` and expose a stable provider marker such as
  `data-provider="token-place"` or `data-provider="openai"` for tests and smoke checks.

### `/settings`

`/settings` should own Chat provider selection and OpenAI key management.

- Add a Chat settings panel with a provider selector:
  - `token.place (default, no API key)`.
  - `OpenAI (bring your own API key)`.
- Persist the selected provider to `settings.chatProvider`.
- Move or reuse `OpenAIAPIKeySettings.svelte` on `/settings`, gated or contextualized so users know
  the key is only needed when selecting OpenAI.
- Keep copy explicit: token.place is zero-auth and DSPACE does not store or send a token.place API
  key.
- If users choose OpenAI without a key, the settings panel should prompt them to add one before
  using `/chat` with OpenAI.

## Proposed implementation sequence for prompts 2-7

1. **Prompt 2: token.place API v1 client layer**
   - Update `frontend/src/utils/tokenPlace.js` to default to API v1, direct HTTPS `fetch`,
     `gpt-5-chat-latest`, OpenAI-compatible response parsing, structured error handling, and no
     token.place auth.
   - Update `frontend/src/utils/tokenPlaceErrors.js` for API v1 error categories.
   - Replace legacy `/chat` and disabled-by-default unit tests in `frontend/__tests__/tokenPlace.test.js`.

2. **Prompt 3: settings data model and `/settings` ownership**
   - Add `settings.chatProvider` defaults/normalization and persistence tests.
   - Add a `/settings` Chat provider panel.
   - Move/reuse OpenAI key management from `/chat` to `/settings` while preserving
     `openAI.apiKey`.

3. **Prompt 4: one NPC chat UI**
   - Refactor the current OpenAI-centric chat component into a provider-aware shared NPC chat UI.
   - Default to token.place, call OpenAI only when `settings.chatProvider === 'openai'`, and show
     `/settings` guidance when OpenAI lacks a key.
   - Retain persona, RAG/player-state prompt construction, debug payload UI, save-snapshot hints,
     loading states, and context-source behavior where provider-compatible.

4. **Prompt 5: unit and E2E coverage**
   - Add Playwright coverage for fresh-user token.place default, provider persistence in settings,
     OpenAI opt-in, OpenAI-without-key guidance, and token.place error banners.
   - Update existing OpenAI chat specs to run only in OpenAI-selected contexts.

5. **Prompt 6: user-facing docs and release QA**
   - Update docs to describe token.place as the v3.1 default and OpenAI as optional.
   - Create the `20260801` changelog entry.
   - Flesh out `docs/qa/v3.1.md` with token.place default checks, OpenAI opt-in checks, staging/prod
     smoke notes, and rollback guidance.

6. **Prompt 7: cleanup and release hardening**
   - Audit legacy token.place routes and feature flags.
   - Remove dead parallel UI paths only after tests prove shared UI coverage.
   - Verify staging/prod base URL/model overrides and document final smoke evidence.

## Risks and mitigations

- **API v1 non-streaming latency**: Token.place API v1 returns after full generation. Keep the
  current spinner/loading state, consider longer request timeouts in tests, and avoid adding
  streaming UI in v3.1.
- **CORS and network errors**: Surface a clear token.place network banner, keep request payloads
  small enough for browser calls, and test with Playwright fetch stubs before live staging smoke.
- **Structured provider errors and rate limits**: Parse OpenAI-compatible `error` objects and HTTP
  status. Map 429/quota/rate-limit responses separately from provider 5xx and validation failures.
- **Content-policy failures**: Token.place API v1 can reject content before inference. Treat
  `content_policy_violation` as a user-facing content-policy banner, not a generic outage.
- **Preserving RAG/player-state/persona behavior**: Reuse `buildChatPrompt()` and related prompt
  utilities so provider switching changes transport/model only, not DSPACE grounding behavior.
- **No credential leakage to token.place**: Unit-test request headers and body to ensure OpenAI keys
  and `Authorization` headers are never sent when provider is token.place.
- **Legacy saved state disabling chat**: Normalize missing/invalid provider to `token-place` and
  treat `tokenPlace.enabled` as non-authoritative legacy state.
- **Model alias drift**: Keep `gpt-5-chat-latest` configurable through environment/model override so
  deploys can switch if token.place publishes a better DSPACE-specific alias.

## Test plan

Unit tests:

- `settingsDefaults` normalizes `settings.chatProvider` to `token-place` by default and rejects
  invalid values.
- Existing game-state persistence keeps `openAI.apiKey` untouched while adding/updating
  `settings.chatProvider`.
- `tokenPlaceChat()` posts to `/api/v1/chat/completions` with `{ model, messages }`.
- `tokenPlaceChat()` parses `choices[0].message.content`.
- `tokenPlaceChat()` rejects missing/empty choices with a provider-response error.
- `tokenPlaceChat()` maps network errors, structured API errors, 429 rate limits, 5xx provider
  failures, and `content_policy_violation` errors.
- Request assertions prove token.place calls do not include OpenAI keys, token.place API keys, or an
  `Authorization` header.

Playwright/E2E tests:

- Fresh-user `/chat` test stubs `https://token.place/api/v1/chat/completions` and verifies the page
  sends successfully with `data-provider="token-place"` and no API-key form.
- Settings provider persistence test selects OpenAI, reloads, verifies `/chat` reflects OpenAI, then
  switches back to token.place and verifies default behavior returns.
- OpenAI opt-in regression test configures `openAI.apiKey`, selects OpenAI, and verifies existing
  OpenAI persona/RAG behavior still works with the current OpenAI client stub.
- OpenAI selected without a key shows a helpful `/settings` guidance state and makes no provider
  request.
- Token.place error banner tests cover network failure, provider/5xx failure, rate limit, and
  content-policy failure.
- Remote smoke keeps a safe UI-only mode and adds an optional live token.place send/receive mode for
  staging/prod release verification.

Verification commands for this design-only prompt:

```bash
git diff -- docs/design/token-place-chat-v3.1.md
rg -n "api/v1/chat/completions|chatProvider|token-place|openai|streaming|npm package|/api/chat" docs/design/token-place-chat-v3.1.md
cd frontend && npx prettier --check ../docs/design/token-place-chat-v3.1.md
```

## Rollback plan

- Users who need continuity can select OpenAI in `/settings` if they have an OpenAI API key.
- Deployments can override the token.place base URL or model if production token.place needs a
  staging, fallback, or model-alias change.
- Do not reintroduce OpenAI as the default. If token.place has an incident, prefer an explicit
  operational banner, provider guidance, or temporary base URL/model override over silently changing
  the default provider back to OpenAI.
