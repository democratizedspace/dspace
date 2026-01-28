---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE includes an optional integration with the
[token.place](https://token.place) API. The integration exists today but is **disabled by default**,
so OpenAI remains the default provider unless you explicitly opt in.

The integration calls `POST <baseUrl>/chat` and expects a JSON response with a `reply` field. The
default base URL is `https://token.place/api`, but you can override it with an environment variable
or a saved game setting.

## Opt-in paths

- **Environment variable**: set `VITE_TOKEN_PLACE_ENABLED=true`. You can also point to a custom URL
  with `VITE_TOKEN_PLACE_URL`.
- **Game settings**: save `tokenPlace.enabled=true` in your game state. Optionally pair this with a
  custom `tokenPlace.url`.

```bash
VITE_TOKEN_PLACE_ENABLED=true VITE_TOKEN_PLACE_URL=https://my-token-place/api npm run dev
```

You can clear the saved URL (or the opt-in flag) by resetting your game state.

The `tokenPlaceChat` helper accepts an optional `AbortSignal` and surfaces descriptive service
errors when the provider is enabled.
