# OpenAIChat runtime build metadata test noise

## Symptom
Chat tests emitted `Failed to fetch runtime build metadata` with `ECONNREFUSED`.

## Root cause
Some chat test suites rendered `OpenAIChat` without stubbing `fetch`, causing real network attempts in jsdom.

## Fix
Stubbed `fetch` in chat error-message tests and suppressed expected `console.warn` output locally.

## Verification
`npm test` no longer shows runtime build metadata fetch warnings.
