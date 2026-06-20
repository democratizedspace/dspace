# DSPACE v3.1 token.place Chat Integration Design

## Goal and non-goals

DSPACE v3.1.0 should make `/chat` work immediately for fresh users with no auth, no
OpenAI API key, and no per-token cost concern. The default chat provider must be
token.place API v1. OpenAI remains supported only as an explicit opt-in provider selected from
`/settings` with the user's own API key.

This document is planning-only for the staged implementation sequence below. It should make the
later implementation work safe without changing production behavior yet.

Non-goals and hard constraints:

- Do not use token.place API v2.
- Do not add streaming; API v1 is non-streaming and rejects `stream: true`.
- Do not use the token.place npm package or add a token.place runtime dependency.
- Do not send, store, or request a token.place API key.
- Do not use legacy token.place/backend `/api/chat`, token.place/backend `/chat`, relay
  sink/source/faucet, or other legacy relay paths. This does not prohibit the DSPACE `/chat`
  UI route.
- Do not reintroduce OpenAI as the default provider during rollback.

## Current DSPACE Chat state

The v3.0.1-era chat implementation is split between an OpenAI-first NPC chat and a simpler
parallel token.place panel:

- `frontend/src/pages/chat/index.astro` renders `TokenBadge` and `Integrations` inside the Chat
  page shell.
- `frontend/src/pages/chat/svelte/Integrations.svelte` currently loads the saved OpenAI key,
  always renders `OpenAIAPIKeySettings` and `OpenAIChat`, and only conditionally renders
  `TokenPlaceChat` when `isTokenPlaceEnabled()` returns true. When token.place is disabled it
  shows a banner saying token.place is coming in v3.1.
- `frontend/src/pages/chat/svelte/OpenAIChat.svelte` owns the full production NPC chat UI:
  persona selector, welcome messages, avatars, save-snapshot hints, debug payload UI,
  docs-RAG build metadata, spinner/error banners, shared chat stores, and response source display.
- `frontend/src/utils/openAI.js` owns the mature message-building/RAG/player-state pipeline:
  `buildChatPrompt()`, persona system messages, `PlayerState` snapshots, curated knowledge pack,
  docs RAG, context source merging, response validation/sanitization, OpenAI error summaries,
  and `GPT5ChatV2()`.
- `frontend/src/pages/chat/svelte/TokenPlaceChat.svelte` is a simpler parallel chat UI with a
  fixed dChat persona. It currently calls `tokenPlaceChat()` and does not preserve the full
  OpenAIChat persona/debug/docs-RAG UX.
- `frontend/src/utils/tokenPlace.js` currently treats token.place as opt-in via
  `VITE_TOKEN_PLACE_ENABLED` or `state.tokenPlace.enabled`, defaults to
  `https://token.place/api`, and posts to the legacy `${baseUrl}/chat` path expecting
  `{ reply }`.
- `frontend/src/utils/tokenPlaceErrors.js` maps disabled, network, provider, and unknown errors,
  but does not yet cover API v1 structured errors such as content policy and rate limits.
- `frontend/src/pages/chat/svelte/OpenAIAPIKeySettings.svelte` currently lives on `/chat` and
  saves the key to `state.openAI.apiKey`.
- `frontend/src/utils/settingsDefaults.js` currently normalizes only
  `showChatDebugPayload` and `showQuestGraphVisualizer`; there is no `settings.chatProvider`.
- `frontend/src/utils/gameState/common.js` already normalizes persisted `settings` through
  `normalizeSettings()`, so adding a chat provider setting belongs there rather than in ad hoc UI
  state.
- `frontend/src/pages/settings.astro` currently hosts logout, QA cheats, quest graph, legacy
  upgrade, and data reset panels, but not chat provider selection or OpenAI key management.
- `frontend/__tests__/tokenPlace.test.js` tests the legacy opt-in flag, legacy `/chat` endpoint,
  `{ reply }` parsing, and disabled-by-default behavior. Those tests should be replaced or
  updated in the client-layer phase.
- Relevant Playwright coverage currently assumes OpenAI by default in specs such as
  `frontend/e2e/chat-message-flow.spec.ts`, `frontend/e2e/chat-rag-context.spec.ts`, and
  `frontend/e2e/chat-persona-switching.spec.ts`. `frontend/e2e/token-place-chat-banners.spec.ts`
  covers the existing opt-in token.place panel and banners.

## token.place API v1 relay E2EE contract

Implementation should use browser `fetch` calls to token.place API v1 relay E2EE routes:

- Production origin: `https://token.place`
- Staging origin: `https://staging.token.place`
- Compute selection: `GET /api/v1/relay/servers/next`
- Ciphertext dispatch: `POST /api/v1/relay/requests`
- Ciphertext retrieval: `POST /api/v1/relay/responses/retrieve`
- Optional timeout cleanup, if supported by token.place: `POST /api/v1/relay/requests/cancel`

DSPACE `/chat` must not send the default prompt as plaintext directly to
`/api/v1/chat/completions`. The intended browser flow is relay-blind:

1. Generate and hold a browser client keypair for the DSPACE `/chat` request. Keep the client
   private key in browser memory for decrypting the matching response.
2. Fetch a compute node from `GET /api/v1/relay/servers/next`.
3. Normalize the returned `server_public_key` into the public-key format expected by the browser
   encryption helper. Reject missing, malformed, or unsupported public keys before building a relay
   request.
4. Generate a `request_id` and build a plaintext envelope in browser memory:

```json
{
    "protocol": "tokenplace_api_v1_relay_e2ee",
    "version": 1,
    "request_id": "dspace-generated-request-id",
    "client_public_key": "browser-client-public-key",
    "api_v1_request": {
        "model": "llama-3.1-8b-instruct",
        "messages": [
            { "role": "system", "content": "..." },
            { "role": "user", "content": "..." }
        ],
        "options": {
            "metadata": { "client": "dspace", "provider": "token.place" }
        }
    }
}
```

5. Encrypt that envelope with the selected compute node public key.
6. Dispatch only ciphertext plus safe routing metadata to `POST /api/v1/relay/requests`. The relay
   request payload must not include plaintext `model`, `messages`, `PlayerState`, docs grounding,
   raw inventory, save data, OpenAI keys, token.place credentials, or other secrets.
7. Poll `POST /api/v1/relay/responses/retrieve` with `client_public_key` and `request_id` until an
   encrypted response is available, the request times out, or the user aborts.
8. If timeout or abort cleanup is supported, call `POST /api/v1/relay/requests/cancel` with safe
   request routing identifiers only.
9. Decrypt the returned response envelope in the browser with the DSPACE `/chat` client private
   key.
10. Validate the decrypted response envelope before using it: `protocol` must be
    `tokenplace_api_v1_relay_e2ee`, `version` must be `1`, `request_id` must match the request,
    and `client_public_key` must match the browser key used for retrieval.
11. After validation, extract assistant text from
    `api_v1_response.choices[0].message.content`. Preserve structured
    `api_v1_response.error`, status/type/code/param/message, `usage`, and safe echoed metadata for
    UI summaries and tests when present.

Security invariant: token.place relay-owned state, logs, diagnostics, queues, and routing records
must remain ciphertext-only plus safe routing metadata. They must not receive plaintext DSPACE
prompt messages, `PlayerState`, docs grounding, raw inventory, save data, OpenAI keys, token.place
credentials, Authorization values, or other secrets. Only the selected compute node should be able
to decrypt the API v1 chat request envelope, and only the DSPACE browser client should be able to
decrypt the response envelope.

API v1 chat semantics inside the encrypted envelope:

- API v1 is non-streaming. Do not include `stream: true`; if a future helper accepts options, force
  or omit `stream` rather than passing user-provided streaming options through.
- Prefer model `llama-3.1-8b-instruct` for DSPACE compatibility. token.place's public integration
  test sends a DSPACE-style request with this model and asserts the same response model and a
  non-empty `choices[0].message.content`; token.place exposes
  `llama-3.1-8b-instruct` from the API v1 models endpoint as the canonical launch model.
- API v1 returns structured OpenAI-style errors as `{ error: { message, type, param?, code? } }`
  inside the decrypted `api_v1_response`. The client should preserve status/type/code/message for
  UI summaries and tests.
- API v1 validates `model` and `messages`; validation failures should stay classified as
  structured provider errors internally after decrypting the response envelope.
- Content moderation can return `error.type = "content_policy_violation"` and
  `error.code = "content_blocked"`.
- Rate limits and daily quotas may surface as HTTP 429 provider errors in the decrypted response
  envelope. Preserve response status even when parsing fails.
- Metadata behavior is limited to safe API v1 request/response JSON echo behavior inside the
  encrypted envelope. DSPACE may include safe, non-secret metadata such as
  `{ client: "dspace", provider: "token.place" }` plus a local conversation id if useful. Metadata
  must not contain OpenAI keys, token.place credentials, player inventory details, raw save data,
  or any secret. Do not treat metadata as arbitrary telemetry, analytics, auth, or billing
  metadata beyond safe request/response correlation.

Forbidden integration targets:

- No plaintext default DSPACE `/chat` request to `/api/v1/chat/completions`.
- No legacy token.place/backend `/api/chat`.
- No bare token.place/backend `/chat`.
- No deprecated legacy `/sink`, `/source`, `/faucet`, `/retrieve`, or `/next_server` fallbacks.
- No API v2 routes such as `/api/v2/chat/completions` or `/v2/chat/completions`.
- No streaming/SSE code paths.
- No token.place npm package integration.
- No token.place `Authorization` header or token.place API key field.

## Proposed DSPACE data model

Add one provider-selection field under persisted settings:

```ts
type ChatProvider = 'token-place' | 'openai';

settings: {
    chatProvider: ChatProvider;
    showChatDebugPayload: boolean;
    showQuestGraphVisualizer: boolean;
}
```

Normalization rules:

- `settings.chatProvider` allowed values are exactly `token-place` and `openai`.
- Missing, null, unknown, or invalid `settings.chatProvider` normalizes to `token-place`.
- The default in `DEFAULT_SETTINGS` should be `chatProvider: 'token-place'`.
- Keep `state.openAI.apiKey` as the OpenAI key storage location for backwards compatibility.
- Do not migrate or rename existing OpenAI keys in v3.1; simply continue reading/writing
  `openAI.apiKey` from the new settings panel.
- Treat old `state.tokenPlace.enabled` and `VITE_TOKEN_PLACE_ENABLED` behavior as legacy only.
  Those flags must not disable default v3.1 Chat. The client-layer phase can keep compatibility
  helpers for old tests if needed, but provider selection should not depend on
  `tokenPlace.enabled`.
- The token.place origin/base URL is authoritative from deployment runtime SSR configuration
  (`DSPACE_TOKEN_PLACE_URL`) when `/chat` is rendered. The existing `VITE_TOKEN_PLACE_URL` and
  legacy `state.tokenPlace.url` remain compatibility fallbacks for local/build and saved-state
  override scenarios. Default to `https://token.place`; staging should configure
  `DSPACE_TOKEN_PLACE_URL=https://staging.token.place`, and production should omit the override or
  configure `DSPACE_TOKEN_PLACE_URL=https://token.place`.
- Normalize token.place URL values before appending API v1 relay route paths: accept
  origin-style values such as `https://token.place`, strip trailing slashes, tolerate legacy
  `https://token.place/api` or `https://token.place/api/v1` by normalizing them to the origin,
  and never produce duplicated API path segments such as `/api/api/v1/relay/requests`.
- There must be no `tokenPlace.apiKey`, token.place credential form, or token.place
  `Authorization` header.
- Recommended optional deployment model override: `DSPACE_TOKEN_PLACE_CHAT_MODEL`, defaulting to
  `llama-3.1-8b-instruct`. `VITE_TOKEN_PLACE_CHAT_MODEL` remains the local/build compatibility
  fallback. Do not make the model a user-facing key-management setting in v3.1.

## Post-staging runtime routing correction

The first staging smoke test exposed build-time Vite routing as insufficient for immutable-image
promotion: a DSPACE image built with the production `VITE_TOKEN_PLACE_URL` continued to call
`https://token.place` when deployed to staging. Runtime SSR props are now the authoritative
DSPACE deployment configuration for token.place URL/model. `/config.json` reports the same public
origin/model, and `/chat` passes them into the hydrated provider-aware panel without an extra
client-side config fetch.

This correction does not change the token.place API v1 contract, provider selection semantics, or
zero-auth invariants: DSPACE still makes browser HTTPS requests to token.place API v1 relay E2EE
routes, defaults fresh users to token.place, keeps OpenAI as an optional Settings opt-in, sends no
token.place credentials, sends no `Authorization` header, sends only ciphertext to relay-owned
request state, and uses `credentials: 'omit'`.

## Proposed UI and provider flow

`/chat` should show exactly one NPC chat panel:

1. Load normalized settings from game state.
2. If `settings.chatProvider` is missing or invalid, treat it as `token-place`.
3. If provider is `token-place`, submit through the token.place API v1 client.
4. If provider is `openai`, submit through the existing OpenAI client only when
   `state.openAI.apiKey` is present.
5. If provider is `openai` and no key is saved, show a helpful guidance state that links to
   `/settings` and explains that OpenAI requires the user's API key. Do not make a broken OpenAI
   request with an empty key.

UI ownership changes:

- `/chat` does not show the OpenAI API key form.
- `/settings` owns provider selection and OpenAI key management.
- Preserve the mature `OpenAIChat.svelte` NPC/persona/debug UI by refactoring it into a
  provider-agnostic chat panel or wrapper instead of building from `TokenPlaceChat.svelte`'s
  simpler UI.
- The active panel should expose a stable provider marker such as
  `data-provider="token-place"` or `data-provider="openai"` for Playwright tests.
- The persona selector, welcome messages, avatars, save-snapshot hints, debug message payload,
  docs-RAG metadata, source display, and player-state summary should continue to work regardless
  of provider.
- Debug payload should show the DSPACE-owned prompt envelope used for the selected provider without
  implying that relay-owned token.place state received plaintext. For token.place, developer debug
  UI may expose the local pre-encryption `api_v1_request.messages` for troubleshooting, while
  network evidence must show only ciphertext on relay requests.
- token.place responses should pass through the same DSPACE response validation and source-link
  sanitization currently used for OpenAI responses.
- Any reuse or extraction from `buildChatPrompt()` must first audit, update, or remove the current
  `providerRealityLine` text that says v3 chat uses OpenAI and token.place is deferred to v3.1,
  so token.place default requests do not send stale provider-reality instructions.
- Hard shared prompt/RAG requirement: token.place and OpenAI should receive the same DSPACE
  persona, `PlayerState`, curated DSPACE knowledge, docs RAG, and context-source handling by
  reusing or extracting the existing `buildChatPrompt()` path, but only after provider-reality
  guidance is v3.1-accurate and either provider-neutral or provider-aware.
- Test requirement: token.place request payloads and debug prompt payloads must not contain
  "token.place is deferred", "chat uses OpenAI" as a default-provider claim, or equivalent stale
  v3.0 wording.

## Proposed implementation sequence

This sequence keeps each implementation PR reviewable:

1. **Phase 1: token.place API v1 relay E2EE client layer**
    - Replace legacy token.place/backend `/chat` fetch logic with the relay route sequence:
      `GET /api/v1/relay/servers/next`, `POST /api/v1/relay/requests`, and
      `POST /api/v1/relay/responses/retrieve`.
    - Generate a browser client keypair, normalize the compute node `server_public_key`, encrypt the
      `tokenplace_api_v1_relay_e2ee` envelope, and send only ciphertext to relay-owned request
      state.
    - Include `model`, OpenAI-compatible `messages`, and options only inside the encrypted
      `api_v1_request` envelope.
    - Decrypt and validate the response envelope before parsing `api_v1_response.choices[0].message.content`.
    - Preserve structured errors, status, code, type, and param.
    - Add unit tests for success parsing, malformed responses, network failure, HTTP errors,
      content policy, rate limit, URL normalization, model default, abort signal, and absence of
      Authorization/token.place API key headers.
    - Cover the richer `{ text, contextSources, usage, metadata }` return shape, including API v1
      `usage`/`metadata` passthrough from the decrypted `api_v1_response` and DSPACE-owned `contextSources`.

2. **Phase 2: Settings provider configuration**
    - Add `settings.chatProvider` normalization/defaulting.
    - Move OpenAI key management to `/settings` while continuing to store `openAI.apiKey`.
    - Add a settings panel for provider selection: token.place default, OpenAI opt-in.
    - Persist provider preference and key changes through existing game-state storage.

3. **Phase 3: Single NPC chat UI**
    - Refactor the full NPC/persona/debug UI into one provider-aware chat panel.
    - Default fresh users to token.place.
    - Use OpenAI only when `settings.chatProvider === 'openai'`.
    - Remove `OpenAIAPIKeySettings` from `/chat`.
    - Retire or reduce `TokenPlaceChat.svelte` to a compatibility wrapper only if needed.

4. **Phase 4: Unit and e2e coverage**
    - Update OpenAI-by-default Playwright tests to select OpenAI in settings when testing OpenAI.
    - Add fresh-user token.place default tests with fetch stubs.
    - Add settings persistence and provider switching tests.
    - Add error banner tests for token.place network/provider/content-policy/rate-limit failures.

5. **Phase 5: User-facing docs and release QA**
    - Update Chat and Settings docs for token.place default and OpenAI opt-in.
    - Create the `frontend/src/pages/docs/md/changelog/20260801.md` changelog entry for the v3.1
      minor release (this is an explicit human-requested minor-release changelog entry, not a
      general license for agents to create or update changelogs).
    - Flesh out `docs/qa/v3.1.md` with staging/prod verification steps and expected results.

6. **Phase 6: Cleanup and hardening**
    - Audit legacy routes and stale flags.
    - Remove dead token.place `/chat` assumptions.
    - Verify staging/prod base URLs, model override, and no credential leakage.
    - Record release-hardening notes and residual risks.

## Risks and mitigations

- **API v1 non-streaming latency:** show the existing spinner, preserve disabled-send behavior while
  a request is in flight, and avoid adding streaming as a quick fix. Consider copy that says
  token.place is thinking when latency exceeds a threshold, but keep the request non-streaming.
- **CORS/network errors:** classify `TypeError`, failed fetch, timeout/abort, and unavailable
  response bodies as network errors with retry guidance. Keep tests using fetch stubs rather than
  live network.
- **Structured provider errors and rate limits:** parse JSON error payloads first, preserve
  `status`, `error.type`, `error.code`, `error.param`, and `error.message`, and map known cases to
  internal classification while rendering only safe user-facing summaries rather than raw relay or
  provider internals. HTTP 429 should be a rate/quota banner. Provider 5xx should be a
  token.place/server unavailable banner. Malformed decrypted HTTP 200 responses missing usable
  `api_v1_response.choices[0].message.content` should be a malformed/provider response banner.
  `content_policy_violation` should explain that token.place blocked the request by policy.
- **Preserving RAG/player-state/persona behavior:** before sharing the existing message-building
  path with token.place, update or remove provider-specific reality guidance such as the
  `providerRealityLine` that says v3 chat uses OpenAI and token.place is deferred to v3.1. Then
  reuse only provider-neutral message-building pieces, or extract them, so token.place receives
  accurate system/persona/player-state/docs-RAG context. Update guardrail tests for the new
  provider reality; token.place default requests and debug/system payloads must not contain stale
  v3 OpenAI-default wording. Do not regress debug payload, source display, or response
  sanitization.
- **No OpenAI key or Authorization header to token.place:** keep token.place and OpenAI client
  functions separate. token.place requests should set only content headers and should never read
  `state.openAI.apiKey`. Unit tests must assert no `Authorization` header and no token.place API
  key field.
- **Legacy `tokenPlace.enabled` saved states:** ignore legacy disabled flags for provider defaulting
  so old users are not accidentally blocked from the new default chat. Keep only URL compatibility
  if safe.
- **Base URL confusion:** store origins, not endpoint paths. The client should tolerate legacy
  `https://token.place/api` by normalizing to `https://token.place` before appending
  API v1 relay route paths, or explicitly document accepted forms in tests.

## Test plan

Unit tests:

- `normalizeSettings()` defaults missing `settings.chatProvider` to `token-place`.
- `normalizeSettings()` preserves `openai` and `token-place` and rejects invalid values back to
  `token-place`.
- token.place client calls `GET /api/v1/relay/servers/next`, `POST /api/v1/relay/requests`, and
  `POST /api/v1/relay/responses/retrieve`.
- token.place client defaults the encrypted `api_v1_request.model` to
  `llama-3.1-8b-instruct`.
- token.place client sends ciphertext-only relay request payloads and does not expose plaintext
  `model`, `messages`, `PlayerState`, docs grounding, inventory, save data, or secrets to
  relay-owned state.
- token.place client decrypts and validates the response envelope, then parses
  `api_v1_response.choices[0].message.content`.
- token.place client rejects malformed responses with a provider parse error.
- token.place client maps network failures, aborts, HTTP 429, provider 5xx, and
  `content_policy_violation` payloads.
- token.place client does not include an `Authorization` header, OpenAI API key, or token.place API
  key in headers/body.
- token.place default request payloads and debug/system payload views do not include stale
  provider guidance that says v3 chat uses OpenAI or token.place is deferred to v3.1.
- provider selection helper chooses token.place for fresh/invalid settings and OpenAI only for
  explicit `settings.chatProvider === 'openai'`.
- OpenAI selected without a saved key returns a guidance state instead of calling OpenAI.

Playwright/e2e tests:

- Fresh-user `/chat` renders one `data-provider="token-place"` panel and can send/receive using a
  token.place fetch stub.
- `/chat` does not render the OpenAI key form.
- `/settings` lets users choose token.place or OpenAI and persists the selection across reloads.
- `/settings` manages the existing `openAI.apiKey` field without changing its storage path.
- OpenAI opt-in regression: selecting OpenAI with a saved key uses the existing OpenAI mock hook
  and preserves persona/debug/source behavior.
- OpenAI selected without a key shows the `/settings` guidance state and does not issue a network
  request.
- token.place error banners cover network failure, provider failure, rate limit, and content policy
  responses.
- Existing chat persona, debug navigation, build stamp, and docs-RAG tests are updated to run
  against the provider-aware panel or explicitly opt into OpenAI where needed.

Manual/staging checks for release QA and hardening:

- Staging `/chat` defaults to token.place against `https://staging.token.place` when configured.
- Production `/chat` defaults to `https://token.place`.
- Local/dev tests use fetch stubs or explicit local/test overrides, not live token.place calls in
  CI.
- Browser devtools show `GET https://token.place/api/v1/relay/servers/next`,
  `POST https://token.place/api/v1/relay/requests`, and
  `POST https://token.place/api/v1/relay/responses/retrieve` in production, or the staging
  equivalents, with no token.place `Authorization` header.
- Browser devtools show the `/api/v1/relay/requests` body contains ciphertext only plus safe
  routing metadata; plaintext `model`, `messages`, `PlayerState`, docs grounding, inventory, save
  data, OpenAI keys, token.place credentials, and `stream: true` are absent.
- Browser storage contains no token.place credential.
- OpenAI remains available only after selecting OpenAI and saving an OpenAI key in `/settings`.

## Rollback plan

- Users who need continuity can select OpenAI in `/settings` and use their own key.
- Deployments can override token.place base URL and model if the production endpoint or alias needs
  emergency routing.
- Rollback must not make OpenAI the default again. If token.place has an incident, prefer an
  environment-level token.place base URL/model override, a clear outage banner, or explicit user
  opt-in to OpenAI.
- Keep the v3.1 data model stable so future fixes do not churn saved settings.

## Implementation checklist for later phases

- [ ] token.place default provider is represented as `settings.chatProvider = 'token-place'`.
- [ ] OpenAI opt-in is represented as `settings.chatProvider = 'openai'` plus `openAI.apiKey`.
- [ ] `/chat` renders a single NPC chat UI.
- [ ] `/settings` owns provider selection and OpenAI key management.
- [ ] token.place requests use `GET /api/v1/relay/servers/next`,
      `POST /api/v1/relay/requests`, and `POST /api/v1/relay/responses/retrieve`.
- [ ] token.place relay request payloads are ciphertext-only plus safe routing metadata.
- [ ] token.place responses decrypt and validate the response envelope before parsing
      `api_v1_response.choices[0].message.content`.
- [ ] API v2, streaming, token.place npm package integration, token.place auth/API keys, and
      legacy token.place/backend `/api/chat` or `/chat` endpoints are absent.
