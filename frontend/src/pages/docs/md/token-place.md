---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE ships with a token.place integration for in-game chat, but it is **disabled by default**.
The reason is simple: **token.place API v1 is not implemented or live in production yet**, so
there is nothing to safely call today.

## Status and roadmap

- **DSPACE v3 launches with OpenAI only.** The OpenAI API remains the sole supported chat provider
  in v3 production.
- **token.place API v1 is still in progress.** Once the API is finished and deployed to production,
  we will complete the token.place integration work as part of **DSPACE v3.1**.

## How it works

- The chat client calls `tokenPlaceChat` (see `frontend/src/utils/tokenPlace.js`), which posts to
  `${baseUrl}/chat` and returns the `reply` field from the JSON response. If the feature is
  disabled, the helper throws with a message that points back to the opt-in options.
- The default base URL is `https://token.place/api` (the value of `DEFAULT_URL` in
  `frontend/src/utils/tokenPlace.js`).
- The integration is enabled only when an explicit opt-in flag is set via
  `isTokenPlaceEnabled` (see `getEnabledOverride` and `isTokenPlaceEnabled` in
  `frontend/src/utils/tokenPlace.js`).
- The OpenAI API key chat integration is configured separately (see
  `frontend/src/pages/chat/svelte/OpenAIChat.svelte`), so leaving token.place disabled keeps
  chat on the OpenAI-backed flow.

## Opt-in options

Token.place can be enabled in two ways:

- **Environment variable**: set `VITE_TOKEN_PLACE_ENABLED=true`. You can also point to a custom URL
  with `VITE_TOKEN_PLACE_URL`.
- **Game state**: persist `tokenPlace.enabled=true` in saved game state. Optionally pair this with
  a custom `tokenPlace.url`.

```bash
VITE_TOKEN_PLACE_ENABLED=true VITE_TOKEN_PLACE_URL=$TOKEN_PLACE_API_URL npm run dev
```

The environment flag takes precedence over game state (see `getEnabledOverride` and
`isTokenPlaceEnabled` in `frontend/src/utils/tokenPlace.js`). If you set
`VITE_TOKEN_PLACE_ENABLED=false`, token.place stays disabled even if game state is enabled. When
enabled, the URL preference order in `tokenPlaceChat` is `tokenPlace.url` (game state), then
`VITE_TOKEN_PLACE_URL`, then the default URL.

You can clear the saved URL (or the opt-in flag) by resetting your game state.
