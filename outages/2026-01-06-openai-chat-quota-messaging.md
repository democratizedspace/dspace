# OpenAI chat shows billing and key errors inline

## Summary
Players hitting OpenAI quota or invalid key errors only saw a generic failure message in the chat
panel while details were hidden in the browser console. This made it unclear that adding credits or
fixing the key would resolve the issue.

## Impact
- Chat responses failed silently for users without OpenAI billing credits.
- Users with invalid keys received no actionable guidance in the UI.

## Detection
- Browser console showed repeated `429` responses with `insufficient_quota`.
- Manual reproduction on staging with a zero-credit key.

## Root cause
The chat UI only rendered a static fallback string on errors and did not map common OpenAI error
codes (quota exhaustion, invalid key, rate limiting) to user-friendly messages.

## Resolution
- Added centralized OpenAI error describer to translate common API errors into actionable text.
- Surfaced the friendly error in the chat panel banner and chat history.
- Added unit coverage for the error describer and an integration test for the chat UI.

## Verification
- Unit tests cover quota, invalid key, rate limit, server, network, and default paths.
- Svelte integration test renders the quota error in the chat UI after a failed send.
