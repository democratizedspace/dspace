# OpenAI quota errors surfaced to chat users

## Summary
The OpenAI chat panel failed silently when an API key had no remaining credits. The only clues
were 429 errors in the browser console; the UI showed a generic failure message with no billing
guidance.

## Impact
- Players without OpenAI credits were blocked from chat and had no clear remediation steps.
- Support had to request console logs to diagnose quota and billing errors.

## Detection
- Manual staging validation reproduced console 429 errors when using an API key with zero
  credits.
- No user-facing banner appeared to explain the issue.

## Root cause
Quota and billing errors from the OpenAI SDK were caught and replaced with a canned failure
string in the chat UI. We never classified the error codes, so the browser console was the only
place showing the quota problem.

## Resolution
- Added OpenAI error classification that maps quota, billing, invalid key, and permission errors
  to readable strings.
- Surfaced those strings inside the chat panel as an alert and assistant message when calls
  fail.
- Added unit tests for the error classifier and a Svelte component test to ensure quota
  messaging appears.

## Verification
- Added regression tests covering quota/credit exhaustion messaging.
- Manual validation plan: use an API key without credits in chat, send a message, and confirm
  the banner explains the quota issue instead of only logging to the console.
