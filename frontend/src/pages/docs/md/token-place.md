---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE ships with a token.place integration for in-game chat. In v3.1, fresh chat defaults to
the zero-auth token.place API v1 path, while users with an existing OpenAI API key continue to use
the OpenAI-backed flow.

## How it works

- The chat client calls `tokenPlaceChat` (see `frontend/src/utils/tokenPlace.js`), which posts
  OpenAI-compatible `messages` and `model` fields to `/api/v1/chat/completions` without sending
  credentials or an `Authorization` header.
- The default origin is `https://token.place`. Deployments can point to a custom token.place
  origin with `VITE_TOKEN_PLACE_URL`, and legacy saved `tokenPlace.url` values are still honored
  for compatibility.
- Token.place is the default v3.1 chat provider. Legacy `VITE_TOKEN_PLACE_ENABLED` and
  `state.tokenPlace.enabled` values are ignored by provider enablement so old saved disabled
  flags cannot block fresh default token.place chat.
- Users with an existing OpenAI API key still use the OpenAI-backed flow, and the OpenAI key
  settings remain available separately (see
  `frontend/src/pages/chat/svelte/OpenAIChat.svelte`).

## Local URL override

Use `VITE_TOKEN_PLACE_URL` only to point local development at another token.place origin:

```bash
VITE_TOKEN_PLACE_URL=$TOKEN_PLACE_API_URL npm run dev
```

The URL preference order is `tokenPlace.url` (legacy saved game state), then
`VITE_TOKEN_PLACE_URL`, then `https://token.place`.
