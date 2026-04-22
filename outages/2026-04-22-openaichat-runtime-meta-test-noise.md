# OpenAIChat runtime build metadata test noise

## Symptom
Test stderr repeatedly logged runtime metadata fetch failures with `ECONNREFUSED` from `OpenAIChat.svelte`.

## Root cause
When `fetch('/build-meta.json')` fails in test contexts, `fetchRuntimeBuildMeta` warned even though the fallback behavior is intentional.

## Fix
Added a targeted test-environment guard so failed runtime metadata fetches do not emit warnings in test mode.

## Verification
`npm run test:root`
