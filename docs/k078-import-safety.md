# K078 import and credential safety

Implements approved phases A–C against proposal/main commit `20ba6f4513a3c84ea928bfdc70269a6bd7861672`. Fresh main matched that base. Phase D remains deferred.

## Import contract

Raw game objects, UTF-8 JSON, base64 JSON, file input and embedded custom content share pure preparation. Schema 1 envelopes and sparse legacy records are explicit adapters. Numeric process durations remain seconds; supported textual durations remain compatible. Wrong types, duplicate JSON keys, prototype keys, cycles, accessors, unsupported versions, colliding normalized IDs and invalid references reject before writes. Errors contain bounded codes and structural paths, never submitted values.

Provisional caps: 24 MiB transport, 16 MiB JSON, depth 64, 100,000 nodes, 256 ordinary object keys, 10,000 map entries/array elements, 2,000 entities and image records, 64 KiB ordinary strings, 256-byte IDs, 2,048-byte URLs, 2 MiB per raster/8 MiB aggregate encoded raster bytes, and 4 million pixels per raster/16 million total. Each image occurrence counts. New custom-content exports keep item/quest raster data only in image records, avoiding duplicate entity payloads while preserving the same import budgets. Unit tests inject small caps to exercise boundaries without stress allocations. These caps are policy defaults, not measured universal device safety thresholds.

Static PNG, JPEG, GIF and WebP receive structural metadata validation before browser rendering; animation and SVG reject. This does not replace a complete codec decoder. Routes are canonical internal routes; remote images require HTTPS, or same-origin URLs. Credentials in URLs, controls, backslashes and protocol-relative URLs reject. Literal angle-bracket defenses remain. Existing tiny PNG test fixtures had invalid IDAT CRCs and were replaced with generated synthetic images.

Imported provider configuration and credential authority cannot replace destination credentials. Export filtering covers the entire game/custom-content envelope using the existing known-sensitive-field policy. That policy matches substrings (including `auth`), so extension fields such as `author` are also omitted. K078 preserves that filtering contract; narrowing it requires a separate reviewed policy change.

## Commit and recovery contract

Game state, backup and metadata commit in one IndexedDB transaction. Custom items, processes, quests and revision metadata commit in a separate transaction. Completion events provide receipts; request success alone does not. Preparation finishes and required schemas are preflighted before mutation. Import never runs custom-content migrations.

Managed operations use immutable queued snapshots and a Web Lock shared by compatible tabs. Transactions compare game checksum/credential epochs or custom-content revision plus preflight rows. Missing lock support fails closed for managed imports and credential operations. Startup and ordinary gameplay retain an explicit credential-free localStorage fallback without IndexedDB writes. Startup reads existing IndexedDB progress without migrations and compares existing save timestamps so IDB-only saves and newer fallback progress survive reload. A tab that enters fallback stays there for ordinary saves and game-only imports until reload; credential Save and custom-content imports require reload, while targeted Clear remains available. Startup after storage or lock support returns reconciles newer fallback progress through a checked game transaction while retaining durable credentials, epochs and the existing backup. A second-database failure reports the game commit as partial; localStorage mirror failure reports committed databases honestly. There is no cross-database crash atomicity.

Recovery is explicit, bounded, sanitized and in memory only. Partial game recovery refuses intervening changes. When both databases committed, recovery repairs mirrors rather than undoing custom content. Reload or Clear discards recovery. No persistent undo store or generation database is added. Ordinary game-only localStorage fallback is explicitly best effort, propagates errors and excludes credentials.

## Clear contract

The managed inventory is runtime state and registered credential drafts; localStorage `gameState`, `gameStateBackup`, `gameStateLite`, `gameStateChecksum`; and IndexedDB `dspaceGameState` stores `state/root`, `backup/root`, `meta/root`. Owned legacy `gameState` and `payload` wrappers are traversed and checksums regenerated. Unrelated provider fields and unrelated origin data remain intact.

Clear first durably increments the selected provider epoch and records a pending/cleared intent in owned metadata. Scrubbing and readback must finish before reporting complete. Interrupted Clear remains incomplete and gates new requests; retry is explicit. Ordinary saves, rollback, reset and legacy seeding respect authority. Deliberate later credential saving advances authority. Cached prompt/retry and multi-request GitHub paths recheck launch authority. Already issued requests cannot be recalled.

Close or reload older incompatible DSPACE tabs before relying on Clear: their writers do not participate in these locks/epochs. Clear removes managed local copies; it does not revoke provider credentials or search unrelated origin stores.

## Regression and compatibility evidence

`frontend/tests/k078ImportSafety.test.ts` names A01–A06, B01–B06 and C01–C06, with additional table-driven limit/media/fault cases. `k078Coordinator.test.ts` exercises the real coordinator, partial recovery, mirror repair, immutable saves, export filtering, reload/rollback and cached OpenAI prompts. All data and credentials are synthetic; network calls are denied or mocked.

`node scripts/k078-browser-validation.mjs` exercises genuine IndexedDB transactions in Chromium, Firefox, WebKit and Chromium with a 128 MiB V8 heap cap and 4x CPU throttling. It includes a second compatible tab, stale-write rejection and deliberate later credential saving. It writes exact-head/dirty-state evidence under ignored `artifacts/`. The generated compatibility cases contain 1, 100, 1,000 and 2,000 entities (largest about 252 KB), not maximum-size production saves.

Precommit measurements on ESPC: 2,000-entity preparation/commit took about 32/89 ms Chromium, 12/68 ms Firefox, 14/30,342 ms WebKit, and 135/322 ms constrained Chromium. WebKit Windows transaction latency is a material limitation. Browser main-process peak working set and available sampled JS heap are recorded separately; neither measures whole-device or all-renderer peak memory. Unsupported heap observations remain null. The harness must pass again at the final commit; these preliminary numbers are not final-head certification.

Repository-wide validation also encounters baseline failures on ESPC (Windows command/path assumptions and unavailable Helm/build output). An untouched worktree at the proposal base reproduced 45 failures in eight selected baseline suites. Root build additionally invokes `spawn('npm')`, which fails on Windows; direct frontend build reached client compilation then exited with a native access violation. These limitations do not justify skipping final-head GitHub CI. The PR remains draft until applicable reviews and exact-head CI pass.
