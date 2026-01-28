---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE ships with OpenAI as the default AI provider. The [token.place](https://token.place)
integration already exists in the codebase, but it is **disabled by default** and must be opted
into explicitly.

The API endpoint defaults to `https://token.place/api` and stays disabled to keep staging and local
builds on OpenAI unless you explicitly opt in.

Opt-in paths:

- **Environment variable**: set `VITE_TOKEN_PLACE_ENABLED=true`. You can also point to a custom URL
  with `VITE_TOKEN_PLACE_URL`.
- **Game settings**: save `tokenPlace.enabled=true` in your game state (for example, via a settings
  screen that toggles the integration). Optionally pair this with a custom `tokenPlace.url`.

The environment flag takes precedence over saved game settings when both are present.

```bash
VITE_TOKEN_PLACE_ENABLED=true VITE_TOKEN_PLACE_URL=https://my-token-place/api npm run dev
```

You can clear the saved URL (or the opt-in flag) by resetting your game state.

The `tokenPlaceChat` utility accepts an optional `AbortSignal` and surfaces descriptive service
errors when the provider is enabled.
