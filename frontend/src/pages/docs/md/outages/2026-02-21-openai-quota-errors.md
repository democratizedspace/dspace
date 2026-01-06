---
title: '2026-02-21 – OpenAI quota errors were opaque'
slug: '2026-02-21-openai-quota-errors'
summary: 'Surface clear chat errors when OpenAI rejects requests for quota, auth, or network issues.'
---

## Summary

Chat requests to OpenAI failed with 429 responses when accounts lacked billing credits, but the
UI only showed a spinner and a generic console error. Players had to open DevTools to discover the
quota failure and resolve it by adding credits.

## Impact

- Players with exhausted OpenAI credits could not see why chat failed.
- Support required extra time to triage what looked like a silent outage.

## Resolution

- Added structured OpenAI error mapping that returns human-readable guidance for quota, auth,
  permission, server, and network failures.
- Updated the chat UI to display the mapped message inline when a request fails.
- Added regression tests covering quota error mapping and UI rendering.

## Prevention / Follow-ups

- Keep extending error mapping as new OpenAI error codes appear.
- Maintain component-level tests for prominent chat failure states.
