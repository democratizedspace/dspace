---
title: 'v3.1 Release Preparation'
slug: 'v3-1-release-preparation'
tagline: 'v3.1 token.place Chat default — release preparation'
summary: >-
    Planned v3.1 makes token.place API v1 the default Chat provider while OpenAI remains optional. November 1, 2026 is tentative; release readiness takes priority.
---

DSPACE v3.1 is in release preparation, with a tentative target of **November 1, 2026**.
Readiness takes priority over the date. These notes describe the candidate behavior, not a
completed release or production promotion.

The [August 1 entry](/docs/changelog/20260801) remains archived unchanged. This page supersedes
its release timing, transport, and configuration claims for current planning; the archived date is
not evidence of production promotion.

## token.place is the default Chat provider

The v3.1 candidate makes [token.place](/docs/token-place) the default provider for NPC Chat.
Fresh players can open [/chat](/chat), pick a persona, and ask for quest, item, process, or
save-aware help without signing in and without bringing an API key.

The browser uses token.place API v1 relay E2EE: it selects compute with
`GET /api/v1/relay/servers/next`, encrypts a `tokenplace_api_v1_relay_e2ee` envelope for that
compute node, dispatches ciphertext with `POST /api/v1/relay/requests`, then polls
`POST /api/v1/relay/responses/retrieve`. It decrypts and validates the response locally before
reading `api_v1_response.message.content` or `api_v1_response.choices[0].message.content`.
The relay receives ciphertext plus safe routing metadata, not plaintext prompts or save context.

- DSPACE does not request or store token.place credentials. Token.place requests send neither those
  credentials nor an Authorization header.
- API v1 is non-streaming: the reply appears after the full completion is ready.
- The browser estimates context needs and selects an appropriate compute tier; a qualifying 8K
  context overflow can retry once on the 64K tier.
- Cross-repository compatibility and token.place transport hardening still require candidate QA
  and staging evidence before release.

## OpenAI remains optional

Choose OpenAI from [/settings](/settings), save your own key there, and return to [/chat](/chat).
The key remains in the existing client-side DSPACE storage path; token.place requests do not use
it. Without an explicit OpenAI selection, token.place remains the v3.1 default.

The default token.place origin is `https://token.place` and the default model is
`qwen3-8b-instruct`. Operators can override them at runtime with `DSPACE_TOKEN_PLACE_URL` and
`DSPACE_TOKEN_PLACE_CHAT_MODEL`; `/config.json` exposes the public configuration to the client.
`VITE_TOKEN_PLACE_URL` and `VITE_TOKEN_PLACE_CHAT_MODEL` remain local/build fallbacks.

## QA and rollout gates

Maintainers should use the [v3.1 QA checklist](https://github.com/democratizedspace/dspace/blob/main/docs/qa/v3.1.md).
Release readiness requires fresh candidate checks, token.place compatibility and privacy evidence,
observability dashboards and alerts, staging scrape and soak evidence, immutable image/chart
coordinates, and rollback instructions. Historical checks and implemented source behavior do not
replace a rerun against the selected candidate.

Staging must pass before separately approved production promotion. The tentative date does not
authorize deployment or make OpenAI the default again.
