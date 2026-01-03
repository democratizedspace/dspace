# OpenAI responses payload schema mismatch

## Summary
The chat client called the OpenAI Responses API with `content.type` set to `text`. The API now
requires `input_text` or `output_text`, so every request failed with HTTP 400 and no replies were
rendered.

## Impact
- Chat on staging could not return any OpenAI responses even with a valid API key.
- Players only saw the fallback error message in the chat UI after submitting a prompt.

## Detection
- Manual validation on https://staging.democratized.space/chat after entering a valid key and
  sending "hi!".
- Browser console errors showing `Invalid value: 'text'. Supported values are: 'input_text',
  'input_image', 'output_text', 'refusal', 'input_file', 'computer_screenshot', and
  'summary_text'.`

## Root cause
We were still using the legacy `text` content type when constructing the Responses API payload. The
endpoints now require typed content, and the SDK rejects `text` before the request is processed.

## Resolution
- Map chat roles to the Responses API types (system/user → `input_text`, assistant → `output_text`).
- Updated unit tests to assert the correct content types in the request payload.

## Verification
- Unit tests covering the OpenAI client now assert the request schema.
- Manual validation: add a valid OpenAI key in the chat settings, send a short message (e.g.,
  "hi!"), and confirm the assistant responds instead of logging a 400 error.
