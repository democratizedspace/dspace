# DSPACE v3.1 token.place Chat integration design

## Goal and non-goals

DSPACE v3.1.0 should make `/chat` work immediately for fresh users with no auth, no API
key, and no per-token cost concern. The default chat provider will be **token.place API v1**.
OpenAI remains available only as an explicit opt-in provider configured from `/settings` with the
user's own OpenAI API key.

This design is intentionally documentation-only for Prompt 1. Later prompts should change runtime
code. Do not change production behavior in this step beyond adding this design document.

Non-goals and hard constraints:

- Do **not** use token.place API v2.
- Do **not** add streaming. API v1 is non-streaming and rejects `stream: true`.
- Do **not** use a token.place npm package or SDK.
- Do **not** store, request, or send a token.place API key.
- Do **not** call legacy token.place routes such as `/api/chat`, `/chat`, relay sink/source paths,
  or any local relay compatibility endpoint.
- Do **not** make OpenAI the default fallback if token.place fails; users may opt into OpenAI from
  Settings if they have a key.

## Sources inspected

DSPACE source files reviewed for the current architecture:

- `frontend/src/pages/chat/index.astro`
- `frontend/src/pages/chat/svelte/Integrations.svelte`
- `frontend/src/pages/chat/svelte/OpenAIChat.svelte`
- `frontend/src/pages/chat/svelte/TokenPlaceChat.svelte`
- `frontend/src/pages/chat/svelte/OpenAIAPIKeySettings.svelte`
- `frontend/src/utils/openAI.js`
- `frontend/src/utils/tokenPlace.js`
- `frontend/src/utils/tokenPlaceErrors.js`
- `frontend/src/utils/settingsDefaults.js`
- `frontend/src/utils/gameState/common.js`
- `frontend/src/pages/settings.astro`
- `frontend/__tests__/tokenPlace.test.js`
- `frontend/e2e/chat-message-flow.spec.ts`
- `frontend/e2e/token-place-chat-banners.spec.ts`
- `frontend/e2e/settings-page.spec.ts`

External token.place sources reviewed:

- `https://github.com/futuroptimist/token.place`
- `README.md`
- `static/index.html`
- `api/v1/routes.py`
- `tests/integration/test_dspace_chat_alias.py`
- `https://token.place`

## Current DSPACE Chat state

### Runtime layout

- `frontend/src/pages/chat/index.astro` renders the Chat page shell, `TokenBadge`, and the Svelte
  `Integrations` component.
- `frontend/src/pages/chat/svelte/Integrations.svelte` is currently a composition layer, not a
  provider selector. It loads game state, renders the OpenAI API key settings form, always renders
  `OpenAIChat`, and conditionally renders `TokenPlaceChat` only when `isTokenPlaceEnabled()` says
  token.place is enabled.
- `frontend/src/pages/chat/svelte/OpenAIChat.svelte` is the complete NPC chat experience today. It
  owns the full persona UI, welcome message behavior, debug payload panel, prompt/RAG comparison
  controls, PlayerState summary, error banners, message history, token counting, and context source
  rendering.
- `frontend/src/pages/chat/svelte/TokenPlaceChat.svelte` exists as a simpler parallel chat UI. It
  has its own message box/history, a default dChat welcome message, simple token.place error
  banners, and calls `tokenPlaceChat()`. It does not yet preserve the full OpenAI NPC/persona/debug
  experience.
- `frontend/src/pages/chat/svelte/OpenAIAPIKeySettings.svelte` currently lives under `/chat` via
  `Integrations.svelte`. It reads/writes `state.openAI.apiKey` and reloads the page after saving.
- `frontend/src/pages/settings.astro` currently owns session/data settings such as logout, QA
  cheats, quest graph toggles, legacy save upgrade, and data reset. It does not yet expose Chat
  provider selection or OpenAI key management.

### Prompting and provider utilities

- OpenAI prompt construction, PlayerState summarization, docs RAG, persona handling, response
  validation, fallback model handling, and OpenAI error summaries live in
  `frontend/src/utils/openAI.js`.
- `openAI.js` currently includes v3 provider-reality text that says chat uses OpenAI and token.place
  is deferred to v3.1. Prompt 4 or later must update that wording when token.place becomes default.
- `frontend/src/utils/tokenPlace.js` currently defaults to `https://token.place/api`, gates use on
  `tokenPlace.enabled`, prepends a simple system message, calls `${baseUrl}/chat`, and expects a
  `{ reply }` response. That is the legacy path and must be replaced with API v1 behavior in Prompt 2.
- `frontend/src/utils/tokenPlaceErrors.js` classifies disabled, network, provider, and unknown
  token.place failures. Prompt 2/5 should expand this for API v1 structured errors, rate limits,
  and content-policy failures.
- `frontend/src/utils/settingsDefaults.js` currently normalizes `showChatDebugPayload` and
  `showQuestGraphVisualizer`. It is the natural place to normalize a new `settings.chatProvider`
  value.
- `frontend/src/utils/gameState/common.js` loads and saves state in IndexedDB/localStorage and
  imports `normalizeSettings()`. Future settings changes should continue using this game-state
  persistence path and keep SSR guards intact.

### Current tests

- `frontend/__tests__/tokenPlace.test.js` documents the current legacy token.place behavior:
  explicit `tokenPlace.enabled` is required, requests go to `/chat`, and responses read `reply`.
  Prompt 2 should update these tests to API v1 expectations.
- `frontend/e2e/chat-message-flow.spec.ts` focuses on the current OpenAI chat panel and stubs the
  OpenAI client through `window.__DSpaceOpenAIClient`.
- `frontend/e2e/token-place-chat-banners.spec.ts` exercises the currently conditional token.place
  panel by seeding `tokenPlace.enabled` and stubbing fetches that include `token.place`.
- `frontend/e2e/settings-page.spec.ts` verifies settings layout and accessibility; Prompt 3/5
  should extend it for provider selection and OpenAI key persistence.

## token.place API v1 contract for DSPACE

DSPACE v3.1 should use token.place API v1 as an OpenAI-compatible HTTP endpoint.

### Endpoints and environments

- Production base origin: `https://token.place`
- Staging base origin: `https://staging.token.place`
- Chat completion path: `POST /api/v1/chat/completions`
- Full production URL: `https://token.place/api/v1/chat/completions`
- Full staging URL: `https://staging.token.place/api/v1/chat/completions`

The implementation should allow deployment configuration to override the token.place base origin
or model, but the default must be production token.place API v1.

### Request shape

Use browser `fetch()` with direct HTTPS POST:

```json
{
  "model": "gpt-5-chat-latest",
  "messages": [
    { "role": "system", "content": "...DSPACE NPC/persona/system prompt..." },
    { "role": "user", "content": "..." }
  ]
}
```

Guidance:

- Prefer `gpt-5-chat-latest` for DSPACE compatibility unless a later current API/docs inspection
  identifies a better DSPACE-specific API v1 default.
- Include `Content-Type: application/json`.
- Do not include `Authorization` for token.place.
- Do not include any token.place API key field.
- Do not include `stream`.
- Keep API v1 requests non-streaming.
- Send the same persona, PlayerState, docs RAG, and guardrail context that OpenAI currently gets,
  adapted to the OpenAI-compatible `messages` shape.

### Response shape

Parse the OpenAI-compatible response:

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "model": "gpt-5-chat-latest",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "...assistant response..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

DSPACE should read `choices[0].message.content`. Missing, empty, or non-string content should be
classified as a provider/payload error and shown through the chat error banner.

### Error behavior

The token.place API v1 routes return OpenAI-style structured errors for validation, unsupported
streaming, model issues, content-policy moderation, quota/rate limits, and server/provider errors.
DSPACE should preserve the structured error type/code/status when possible so UI tests can assert
stable categories.

Minimum categories for v3.1:

- `network`: fetch rejection, DNS/CORS failure, timeout, or abort that prevents a response.
- `provider`: non-OK response or malformed API response that is not more specific.
- `rate_limit`: HTTP 429 or token.place rate/quota error codes.
- `content_policy`: token.place `content_policy_violation` or `content_blocked` errors.
- `unknown`: unexpected client-side exception.

## Proposed DSPACE data model

Add a normalized chat provider preference under game-state settings:

```ts
type ChatProvider = 'token-place' | 'openai';

type Settings = {
  showChatDebugPayload: boolean;
  showQuestGraphVisualizer: boolean;
  chatProvider: ChatProvider;
};
```

Rules:

- `settings.chatProvider` allowed values are exactly `token-place` and `openai`.
- Missing, invalid, null, or legacy values normalize to `token-place`.
- `DEFAULT_SETTINGS.chatProvider` should be `token-place`.
- Keep OpenAI API keys in the existing `openAI.apiKey` field for backwards compatibility with
  existing saves.
- Old `tokenPlace.enabled` flags are legacy only. They must not disable default v3.1 Chat. A saved
  `tokenPlace.enabled: false` from v3.0.x must still result in token.place being available by
  default when `settings.chatProvider` is missing or normalized to `token-place`.
- Optional token.place base origin may come from environment configuration or an existing
  `tokenPlace.url` compatibility field, but the normalized client must not require a
  `tokenPlace.enabled` flag.
- There is no token.place API key setting. Do not add a `tokenPlace.apiKey`, `Authorization` header,
  bearer token, secret, or credential migration.

Recommended environment names for later prompts:

- `VITE_TOKEN_PLACE_URL` or existing compatibility `tokenPlace.url` for the base origin, normalized
  to an origin such as `https://token.place` rather than a legacy `/api` base.
- `VITE_TOKEN_PLACE_MODEL` for model override, defaulting to `gpt-5-chat-latest`.

## Proposed UI architecture

### `/chat`

- `/chat` should show one NPC chat panel, not side-by-side OpenAI and token.place panels.
- Fresh users should see the chat panel immediately with `data-provider="token-place"` and be able
  to send a message without configuring auth or a key.
- The OpenAI API key form should be removed from `/chat` and moved to `/settings`.
- The v3.1 chat panel should preserve the full `OpenAIChat.svelte` user experience: NPC personas,
  welcome messages, debug payloads, PlayerState/RAG context, context sources, token counting,
  keyboard behavior, loading state, and error banners.
- Implementation can either refactor `OpenAIChat.svelte` into a provider-agnostic NPC chat panel or
  adapt that component to accept a provider/client abstraction. Avoid continuing two divergent UIs.
- When `settings.chatProvider === 'token-place'`, submit through token.place API v1.
- When `settings.chatProvider === 'openai'`, submit through the existing OpenAI path.
- When OpenAI is selected but `openAI.apiKey` is missing, `/chat` should show a helpful guidance
  state that links users to `/settings` to add a key or switch back to token.place. It should not
  attempt a broken OpenAI request.

### `/settings`

- Add a Chat settings panel to `/settings`.
- Provider selection should offer:
  - `token.place (default, no API key)`
  - `OpenAI (bring your own API key)`
- Persist selection to `settings.chatProvider`.
- Reuse or relocate `OpenAIAPIKeySettings.svelte` so OpenAI key management lives on `/settings`.
- Show the OpenAI key editor only when OpenAI is selected, or show it in a clearly labeled OpenAI
  section that explains it is optional.
- Explain that token.place is zero-auth from DSPACE and that DSPACE does not store or send a
  token.place API key.

## Proposed implementation sequence

This design maps to the requested prompt sequence:

1. **Prompt 1 - Design only**
   - Add this document.
   - Do not change runtime behavior.
2. **Prompt 2 - token.place API v1 client layer**
   - Replace legacy `/chat` client behavior with direct `fetch()` to
     `/api/v1/chat/completions`.
   - Add model/base-origin resolution, OpenAI-compatible response parsing, structured error types,
     and unit tests.
   - Ensure no token.place auth header or API key is sent.
3. **Prompt 3 - Settings configuration**
   - Add `settings.chatProvider` defaults and normalization.
   - Move provider selection and OpenAI key management to `/settings`.
   - Preserve `openAI.apiKey` for backwards compatibility.
4. **Prompt 4 - Unified Chat page**
   - Refactor `/chat` to render one NPC/persona/debug chat UI.
   - Default to token.place.
   - Route OpenAI only when selected in Settings and a key is present.
   - Update provider-reality prompt text in `openAI.js` or the new shared prompt builder.
5. **Prompt 5 - Tests**
   - Add/update unit and Playwright coverage for fresh-user token.place default, OpenAI opt-in,
     persisted settings, missing OpenAI key guidance, and token.place error banners.
6. **Prompt 6 - User-facing docs and QA**
   - Update docs to explain token.place default chat and optional OpenAI.
   - Create the `20260801` changelog entry.
   - Flesh out `docs/qa/v3.1.md` with token.place staging/prod verification.
7. **Prompt 7 - Final hardening**
   - Audit legacy token.place routes and feature flags.
   - Remove dead v3.0.x UI paths where safe.
   - Capture staging/prod verification notes and rollback expectations.

## Risks and mitigations

- **API v1 non-streaming latency**: responses may take longer than OpenAI streaming-like UX users
  expect. Keep the spinner prominent, disable duplicate sends while a request is pending, and add a
  timeout/abort path with a clear retry message.
- **CORS/network errors**: browser fetches to `https://token.place` and
  `https://staging.token.place` must be allowed. Add Playwright fetch stubs and staging smoke tests;
  classify failed fetches as `network` without exposing raw stack traces.
- **Structured errors and rate limits**: token.place can return API v1 error bodies for validation,
  model support, content moderation, rate limits, and quota. Parse status/type/code/message, map to
  stable UI categories, and keep raw details available only for debug/test assertions.
- **Preserving RAG/player-state/persona behavior**: the biggest product risk is losing the rich NPC
  behavior currently concentrated in `OpenAIChat.svelte` and `openAI.js`. Refactor prompt building
  into provider-neutral helpers before swapping providers, and add regression tests that inspect the
  outgoing token.place messages for system/persona/PlayerState/RAG content.
- **No credential leakage to token.place**: add a unit test that token.place fetch headers do not
  contain `Authorization`, OpenAI API keys, or any token.place API key. Keep OpenAI keys only in
  `openAI.apiKey` and use them only for the OpenAI provider.
- **Legacy saved flags**: existing saves may contain `tokenPlace.enabled: false` from v3.0.x. Treat
  this flag as legacy so it cannot disable the default v3.1 token.place provider.
- **Provider fallback expectations**: automatic fallback from token.place to OpenAI would surprise
  users and could spend their OpenAI quota. Do not auto-fallback; show an error and let users choose
  OpenAI in Settings.

## Test plan

### Unit tests

- `settingsDefaults` normalization:
  - missing `settings.chatProvider` => `token-place`.
  - invalid `settings.chatProvider` => `token-place`.
  - `openai` persists as `openai`.
  - `token-place` persists as `token-place`.
- token.place API v1 client:
  - POSTs to `https://token.place/api/v1/chat/completions` by default.
  - Uses staging or configured base origin when provided.
  - Sends `model: "gpt-5-chat-latest"` by default.
  - Sends `messages` and no `stream` field.
  - Parses `choices[0].message.content`.
  - Throws a stable provider error for missing choices/message/content.
  - Parses token.place structured errors, including rate limit and content policy.
  - Does not send `Authorization` or any token.place API key.
  - Ignores legacy `tokenPlace.enabled: false` for default availability.

### Playwright/e2e tests

- Fresh-user default Chat:
  - Clear user data.
  - Stub token.place fetch for `/api/v1/chat/completions`.
  - Visit `/chat`.
  - Assert exactly one chat panel with `data-provider="token-place"`.
  - Send a message and assert the assistant reply renders.
- Settings provider persistence:
  - Visit `/settings`.
  - Switch provider to OpenAI and save.
  - Reload `/settings` and `/chat`; assert provider remains OpenAI.
  - Switch back to token.place and assert default panel returns.
- OpenAI opt-in regression:
  - Select OpenAI and save an OpenAI API key.
  - Stub the existing OpenAI client path.
  - Assert `/chat` uses OpenAI only after opt-in.
- Missing OpenAI key guidance:
  - Select OpenAI with no key.
  - Visit `/chat`.
  - Assert a helpful `/settings` guidance state appears and no OpenAI request is attempted.
- token.place error banners:
  - Network/CORS failure => `network` banner.
  - Non-OK provider response => `provider` banner.
  - HTTP 429/rate limit => `rate_limit` banner.
  - `content_policy_violation`/`content_blocked` => `content_policy` banner.
  - Malformed success payload => `provider` banner.

## Rollback plan

- Users who need an immediate alternative can select OpenAI in `/settings` and provide their own
  API key.
- Operators can override the token.place base origin or model if production needs to move between
  `https://token.place`, `https://staging.token.place`, or a temporary compatible endpoint.
- Rollback must not reintroduce OpenAI as the default provider. If token.place has an outage, keep
  token.place as the default, show a clear error, and document the optional OpenAI opt-in path.
- Do not restore legacy `/api/chat` or `/chat` token.place paths as fallback behavior.
