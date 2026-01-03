# OpenAI Responses content-type mismatch on chat

## Summary
Chat requests to the OpenAI Responses API failed with HTTP 400 after users saved their API key. The
client sent message content blocks using the legacy `text` type instead of the supported
`input_text` type, so OpenAI rejected every request.

## Impact
- Users who connected a valid OpenAI key saw every chat request fail before producing a reply.
- The chat UI displayed the generic error response and did not progress the conversation.

## Detection
- Manual validation on https://staging.democratized.space/chat after entering an API key and
  sending "hi!".
- Browser console showed `Invalid value: 'text'. Supported values are: 'input_text', 'input_image',
  'output_text', 'refusal', 'input_file', 'computer_screenshot', and 'summary_text'.`

## Root cause
The chat client formats OpenAI messages for the Responses API. A previous implementation used
`{ type: 'text', text: ... }` content entries. The Responses endpoint now requires `input_text` for
incoming message content, so the request schema validation failed with a 400 error.

## Resolution
- Updated the chat payload formatter to emit `input_text` content blocks for all roles.
- Added a regression test to pin the Responses API format expected by the client.
- Manually validated the chat flow end-to-end with a staging API key after the fix.

## Verification
- Unit: `npm test -- openAI.test.ts` now covers the expected `input_text` payload shape.
- Manual: submitted "hi!" in `/chat` with a valid OpenAI key and confirmed a successful assistant
  reply with no console errors.
