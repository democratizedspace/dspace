# API v1 local client contract qualification — November 2, 2026

## Source and scope

Clean source SHA: `2183f59dfea5e8d7378e4de4423630f591831175` (main, including merged PR #4864).
The working tree was clean before this run. Only this evidence and checklist documentation change
afterward. No runtime, test, dependency, configuration, or workflow implementation changes are included.

Executed by Codex on Windows, Node 22.23.4, pnpm 9.0.0, Vitest 3.2.4/jsdom; completed
**2026-11-02 06:43 UTC**. Existing cached Node/pnpm were used; no new tooling was installed.
Dependencies were populated offline with the frozen lockfile, SHA256
`baf3657d87634e1386d5480eac4e73f5c99b93c0f427d355001e0d32effc0379`, unchanged afterward.

This qualifies three internal client implementation criteria using source inspection and mocked
transport tests with real local cryptographic operations. It is not browser, provider-candidate,
live relay, relay-state/logging, deployment, privacy-network, or release-owner sign-off. The overall
Local API v1 contract sign-off remains **partial**.

## Execution and isolation

From the clean checkout, using the already cached executables:

```powershell
& $qaNode $qaPnpm install --offline --frozen-lockfile --ignore-scripts --reporter=append-only
$guardPath = (Resolve-Path '..\api-contract-socket-guard.cjs').Path
$env:NODE_OPTIONS = "--require=$guardPath"
& $qaNode scripts/write-build-meta.mjs
& $qaNode scripts/build-docs-rag-index.mjs
& $qaNode scripts/run-vitest.mjs run --config vitest.config.mts --maxWorkers=1 frontend/__tests__/tokenPlace.test.js frontend/__tests__/tokenPlaceErrors.test.js frontend/__tests__/tokenPlacePolling.test.js
```

`$qaNode` was cached Node 22.23.4; `$qaPnpm` was cached pnpm 9.0.0's `bin/pnpm.cjs`.
An initial setup invocation used a nonexistent `scripts/generate-build-meta.mjs` and stopped before
tests; it was corrected to the repository's `build:meta` script target above. No test failure was
suppressed. Generated build metadata and 824 docs-RAG chunks stayed ignored.

The task-local socket guard below was loaded in the test process and inherited by workers. A
preflight `assert.throws(() => net.connect({host: 'token.place', port: 443}), /socket guard blocked/)`
passed before a connection could be opened. It allows only loopback TCP and local pipe IPC.
Both transport suites replace `fetch` with fixtures; no live token.place relay was contacted.
This guard is execution instrumentation outside the repository, not application code:

```javascript
const net = require('node:net');
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const options = first && typeof first === 'object' ? first : {};
  if (options.path || (typeof first === 'string' && !/^\d+$/.test(first))) {
    return originalConnect.apply(this, args);
  }
  const host =
    options.host || (typeof args[1] === 'string' ? args[1] : 'localhost');
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error(`Local QA socket guard blocked outbound TCP to ${host}`);
  }
  return originalConnect.apply(this, args);
};
```

## Results and acceptance mapping

**3 files passed / 133 tests passed**, duration 27.42 seconds:

| Existing suite                                 | Passed | What the result establishes locally                                                                                                          |
| ---------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/__tests__/tokenPlace.test.js`        | 111    | Mocked relay client contract, local encryption/decryption, envelope validation, response extraction, model default, and negative/error cases |
| `frontend/__tests__/tokenPlacePolling.test.js` | 18     | Mocked polling deadlines, stalled/late work, cancellation, and timer cleanup                                                                 |
| `frontend/__tests__/tokenPlaceErrors.test.js`  | 4      | Error-summary classification, including structured server errors taking precedence over fetch wording                                        |

Immutable inspected sources: [client implementation](https://github.com/democratizedspace/dspace/blob/2183f59dfea5e8d7378e4de4423630f591831175/frontend/src/utils/tokenPlace.js),
[contract assertions](https://github.com/democratizedspace/dspace/blob/2183f59dfea5e8d7378e4de4423630f591831175/frontend/__tests__/tokenPlace.test.js),
[polling assertions](https://github.com/democratizedspace/dspace/blob/2183f59dfea5e8d7378e4de4423630f591831175/frontend/__tests__/tokenPlacePolling.test.js),
and [error assertions](https://github.com/democratizedspace/dspace/blob/2183f59dfea5e8d7378e4de4423630f591831175/frontend/__tests__/tokenPlaceErrors.test.js).

| Section 2 criterion                                                                                                                        | Exact evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Disposition                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Local pre-encryption envelope includes protocol, version, request id, client public key, and `api_v1_request`                              | `runRelayAttempt` builds those fields before `encryptTokenPlaceEnvelope` (source lines 1107–1123); `buildApiV1Request` supplies model/messages/empty options plus routing (1078–1086). “decrypted API v1 request uses empty options and excludes metadata” decrypts the dispatched request and asserts Qwen, messages, and `{}` options (test lines 402–420).                                                                                                                                   | Checked: local construction only                                    |
| Decrypted response envelope is validated before use                                                                                        | `validateTokenPlaceResponseEnvelope` rejects protocol/version/request-id/client-key mismatches (source 1001–1025); `runRelayAttempt` decrypts then validates before returning the API response (1171–1192). “decrypted envelope validation rejects unsafe/mismatched shapes” checks each mismatch and missing response (test 1605–1631). “never acknowledges an invalid decrypted response” exercises encrypted integration fixtures, rejects them, and asserts no acknowledgement (1381–1396). | Checked: structural validation, not cryptographic integrity         |
| Assistant text is extracted from the supported API response shapes only after decryption and validation                                    | Validated `attempt.apiResponse` reaches `extractTokenPlaceAssistantText` (source 1299–1341). “parses API v1 response.message assistant text and compatibility helper returns string” and “parses OpenAI-compatible choices assistant text” exercise encrypted mocked replies; precedence and malformed/empty/stub/raw-array rejection tests cover extraction (test 1027–1073). Invalid-envelope integration cases reject before a result is returned.                                           | Checked: local extraction ordering and accepted shapes              |
| Route sequence, retrieval, timeout cleanup, ciphertext-only routing, and zero-auth transport                                               | Existing mocked route, polling, cancel, key/secret canary, and deterministic ciphertext-collision tests pass.                                                                                                                                                                                                                                                                                                                                                                                   | Partial evidence only; candidate/browser/network criteria stay open |
| UI behavior, browser-held keys, usage display, relay-owned plaintext exclusion, metadata safety outside the client, and live compatibility | No real browser, relay, compute node, provider logs/state, or deployed target was inspected. Error classifier tests do not establish UI clarity or retry UX.                                                                                                                                                                                                                                                                                                                                    | Open                                                                |

## Model and security boundaries

The API v1 default is **`qwen3-8b-instruct`**. Per the owner's Qwen-only correction, this is a list of
one supported model, not meaningful provider model choice. The test “uses default model and model
override” establishes client string selection only; arbitrary override strings are not provider
availability evidence. The legacy test named “accepts production Llama to Qwen relay resolution”
uses mocked metadata: obsolete Llama handling does not establish current provider support, and
the encrypted request retains the requested Llama identifier. This run neither sends such a request
to a provider nor recommends Llama as an operator option.

The client trusts the compute public key supplied by the configured relay over HTTPS. Local key
normalization and cryptographic round trips do **not** independently authenticate compute identity.
Requests use AES-CBC; decoder tests cover CBC compatibility and explicit AES-GCM response shapes.
These are synthetic formats, not observed formats from a selected provider candidate. CBC lacks
authenticated integrity; protocol/request-id/client-key checks are not a substitute. Existing
accepted-security-scope language and all deployed/privacy/staging gates remain unchanged.

No fresh full aggregate, browser suite, production-mode build, package/artifact test, live service
test, staging run, or human sign-off was performed for this milestone. Historical Windows aggregate
failures from #4864 remain failures, not evidence of a pass here. Candidate-dependent checks must
be rerun against the selected candidate/artifact before their corresponding gates can close.

## Documentation validation

After writing this evidence and updating the checklist, `qaDocsContentAlignment.test.ts` and
`qaDocsLinkFreshness.test.ts` passed **9/9 tests** under the same socket guard. The prescribed
six-document Prettier check plus this evidence file, `node scripts/link-check.mjs` (all local
Markdown links), and `git diff --check` passed. Only three of the existing 189 checkbox lines
change state; the remaining criteria and accepted security scope are unchanged. Other sign-off
rows remain `Not started`.
