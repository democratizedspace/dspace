# OpenAI Responses content type update

## Summary
After entering a valid OpenAI key in /chat, every request to the Responses API failed with
HTTP 400 because the payload used the deprecated `type: "text"` content field.

## Impact
- Staging chat could not generate replies after users typed a message.
- Browser console showed repeated 400 errors from `https://api.openai.com/v1/responses`.

## Detection
- Manual validation of the chat panel in staging after saving an API key.
- Console stack traces pointing to `Integrations.D_6N0tfR.js` and `Invalid value: 'text'`.

## Root cause
The client still serialized messages using `type: "text"`, but the Responses API now requires
`input_text` for prompts and `output_text` for assistant content. OpenAI rejected the request
before the model could run.

## Resolution
- Map system/user messages to `input_text` and assistant context to `output_text` before calling
  `responses.create`.
- Updated the OpenAI unit test to assert the new content shape and keep future regressions from
  reintroducing the old type.

## Verification
- Ran `pnpm vitest run tests/configConsistency.test.ts --config vitest.config.mts`.
- Sent a manual Responses request with the corrected `input_text` payload; the API accepted the
  request shape and returned `invalid_api_key` instead of the previous 400 content-type error.
