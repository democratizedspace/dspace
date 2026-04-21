# title
OpenAIChat runtime build-meta fetch noise in tests

## symptom
OpenAIChat tests emitted runtime metadata fetch warnings (`ECONNREFUSED`/`fetch failed`).

## root cause
Some tests render chat with fallback runtime metadata probing enabled and intentionally no backend endpoint.

## fix
Added test-local `console.warn` spies in OpenAIChat test suites to suppress expected fetch warnings.

## verification
- `npm run test:root -- frontend/src/pages/chat/svelte/__tests__/ChatDebugBuildInfo.spec.ts frontend/tests/openAIChatDocsRagComparison.test.ts frontend/tests/openAIChatErrorMessages.test.ts`
