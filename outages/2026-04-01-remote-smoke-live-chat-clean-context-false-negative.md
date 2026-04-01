# Outage: Remote smoke live-chat false negative in clean Playwright sessions

- **Date:** 2026-04-01
- **Component:** frontend/e2e-automation
- **Status:** Resolved

## Root cause

The remote smoke harness validated live chat from a clean Playwright profile. That profile did not
include chat credentials/config that existed in a normal browser session, so chat send/receive took
an auth/config error path and returned an error message.

The smoke assertion expected a new assistant reply and reported:

- Expected: `assistant`
- Received: `error`

Manual validation in a regular browser still showed production chat working, so this was a harness
false negative, not a production outage.

## Resolution

- Added a credential-free default backend for remote smoke live-chat checks.
- In `--chat-mode=live`, the harness now uses a Playwright-scoped OpenAI client mock by default.
- Added an explicit opt-in backend flag (`--chat-live-backend=real`) for real provider requests.

This keeps the smoke focused on the UI contract (send, user message, assistant response, no error
banner) while avoiding machine-specific secret requirements.
