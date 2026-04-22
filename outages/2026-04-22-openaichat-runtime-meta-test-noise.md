# OpenAIChat runtime build metadata test noise

## Symptom
Test stderr repeatedly logged runtime metadata fetch failures with `ECONNREFUSED` from `OpenAIChat.svelte`.

## Root cause
When `fetch('/build-meta.json')` fails in test contexts, `fetchRuntimeBuildMeta` warned even though the fallback behavior is intentional.

## Fix
Replaced broad test-mode suppression with narrow filtering for expected local runtime-metadata fetch failures (`Failed to fetch` / `ECONNREFUSED`) while preserving warnings for unexpected errors.

## Verification
`npm run test:root`
