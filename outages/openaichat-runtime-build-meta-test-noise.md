# OpenAIChat runtime build metadata fetch noise

## title
OpenAIChat runtime build metadata fetch noise

## symptom
Chat debug metadata tests emitted fetch-failure warnings when runtime endpoint was unreachable.

## root cause
Tests cover runtime metadata fallback paths and trigger component warn logging by design.

## fix
Added test-local console.warn suppression in ChatDebugBuildInfo spec while preserving behavior assertions.

## verification
- npx vitest run -c vitest.config.mts frontend/src/pages/chat/svelte/__tests__/ChatDebugBuildInfo.spec.ts
