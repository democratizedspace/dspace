# OpenAIChat runtime build-meta noise

## title
OpenAIChat runtime build-meta noise

## symptom
Chat integration tests emitted runtime metadata fetch failures (`ECONNREFUSED`).

## root cause
OpenAIChat fetches `/build-meta.json` on mount; some tests rendered chat without fetch stubs.

## fix
Stubbed global fetch in chat integration test setup to keep runtime metadata fetch in controlled test state.

## verification
`npm run test:root -- frontend/src/pages/chat/svelte/__tests__/Integrations.spec.ts`
