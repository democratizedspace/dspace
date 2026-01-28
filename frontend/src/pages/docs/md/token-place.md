---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE ships with a token.place integration for in-game chat, but it is **disabled by default** so
local and staging environments keep using OpenAI until you opt in.

## How it works

- The chat client calls `tokenPlaceChat`, which posts to `${baseUrl}/chat`.
- The default base URL is `https://token.place/api`.
- The integration is enabled only when an explicit opt-in flag is set.

## Opt-in options

Token.place can be enabled in two ways:

- **Environment variable**: set `VITE_TOKEN_PLACE_ENABLED=true`. You can also point to a custom URL
  with `VITE_TOKEN_PLACE_URL`.
- **Game settings**: save `tokenPlace.enabled=true` in game state (for example, via a settings
  toggle). Optionally pair this with a custom `tokenPlace.url`.

```bash
VITE_TOKEN_PLACE_ENABLED=true VITE_TOKEN_PLACE_URL=https://my-token-place/api npm run dev
```

The environment flag takes precedence over game state. If you set
`VITE_TOKEN_PLACE_ENABLED=false`, token.place stays disabled even if game state is enabled.

You can clear the saved URL (or the opt-in flag) by resetting your game state.
