# OpenAI chat fallback for standard API keys

## Summary
Staging chat attempted to call OpenAI with `gpt-5-chat-latest` directly from the browser. Most
API keys used by players did not have access to that model, so every request failed before the
conversation started.

## Impact
- Players connecting their own OpenAI key immediately received the canned failure message from
the chat panel.
- No OpenAI responses were generated, blocking the persona chat experience on staging.

## Detection
- Manual validation on https://staging.democratized.space/chat after submitting an API key.
- Browser console errors showing `model_not_found` from the OpenAI SDK.

## Root cause
The client hard-coded `gpt-5-chat-latest` without a fallback. Keys without access returned
`model_not_found`, causing the Svelte catch block to emit the generic error message.

## Resolution
- Added a guarded fallback stack that retries with `gpt-5-mini` when a model access error is
  returned.
- Set the primary model to `gpt-5.2` to match currently available OpenAI chat endpoints.
- Covered the retry path with unit tests to keep future model churn from regressing chat.

## Verification
- New unit tests simulate a `model_not_found` error and confirm the request retries with the
fallback model and returns a response.
- Manual reproduction plan: enter any valid OpenAI key without GPT-5 access, send a chat
message, and confirm the assistant replies instead of failing.
