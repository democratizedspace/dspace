# OpenAIChat runtime build metadata ECONNREFUSED noise

## Symptom
Test stderr repeatedly contained:
`Failed to fetch runtime build metadata TypeError: fetch failed` with cause code `ECONNREFUSED`.

## Root cause
`OpenAIChat.svelte` logged warnings for expected local test-environment fetch failures when
`/build-meta.json` is unavailable.

## Fix
`fetchRuntimeBuildMeta` now treats `ECONNREFUSED` as expected local-unavailable metadata and returns
`null` silently, while preserving warnings for unexpected network/runtime failures.

## Verification
`npm run test:root`
