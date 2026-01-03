# OpenAI chat content type mismatch

## Summary
The chat panel sent OpenAI Requests using `text` content blocks. The Responses API rejects that
type, so every POST to `/v1/responses` returned HTTP 400 before any assistant output was produced.

## Impact
- Chat remained stuck after sending a message; no assistant replies were rendered.
- Users with valid OpenAI API keys saw repeated 400 errors in the browser console.

## Detection
- Manual validation on https://staging.democratized.space/chat with a working OpenAI key showed
  400s from `/v1/responses`.
- Console stack traces referenced `Invalid value: 'text'. Supported values are: 'input_text'...`.

## Root cause
The Requests payload used the older `text` content type. The OpenAI Responses API expects
`input_text`, so the server rejected the payload.

## Resolution
- Switched request blocks to use `input_text`.
- Added tolerant response parsing that extracts `output_text` whether returned as a top-level
  field or inside `output` content blocks.

## Verification
- Manual test on staging: submit "hi!" in chat, observe a successful assistant reply instead of
  a 400 error.
- Code path exercised by reloading the page and sending multiple messages without errors.
