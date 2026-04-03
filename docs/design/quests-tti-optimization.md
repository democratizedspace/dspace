# `/quests` TTI optimization design (v3.0.1)

## 1) Problem statement

`/quests` currently delays meaningful content on slower devices because it combines three heavy paths
before the user sees useful quest-list state:

1. **Large eager built-in quest payload delivery/hydration** from
   `frontend/src/pages/quests/index.astro` (`import.meta.glob('./json/*/*.json', { eager: true })`),
   which currently includes all built-in quest JSON records (248 at time of writing).
2. **Blocking UI on persisted game state readiness** in `Quests.svelte` (`await ready` before
   `mounted = true`), which means no list cards are rendered until IndexedDB/localStorage readiness
   work completes.
3. **Per-quest repeated full-state reads and prerequisite checks** via `questFinished()` and
   `canStartQuest()`, each calling `loadGameState()`, which `structuredClone`s the full state every
   call.

This makes `/quests` vulnerable to growth in built-in quests, custom quests, and persisted state
size. It also creates correctness pressure: naive "show something early" approaches could surface
transiently wrong "Start" affordances.

## 2) Goals

- Show meaningful quest-list content significantly sooner on `/quests`, especially on low-end
  devices.
- Preserve correctness: no transient incorrect startability/continuation affordances.
- Reduce total work of full-state readiness vs current implementation.
- Preserve offline-first behavior (works from local assets + local persistence).
- Keep implementation scope practical for v3.0.1.

## 3) Non-goals

- Rewriting quest detail (`/quests/[id]`) runtime flow.
- Replacing IndexedDB/localStorage persistence architecture.
- Building a broad responsive-image system with many manually managed variants.
- Solving every possible list scaling problem (e.g., full virtualization) in v3.0.1.

## 4) Current state / bottleneck analysis

### 4.1 Eager built-in quest payload + graph prep on page load

- `frontend/src/pages/quests/index.astro` eagerly imports all built-in quest JSON files and passes
  the full objects into `<Quests client:load quests={quests}>`.
- The same file also always builds graph data (`buildQuestGraph`) for the visualizer path.
- Result: large JS/object payload and hydration cost on every `/quests` visit, even if the user only
  needs the card list.

### 4.2 Initial render gated by persisted state readiness

- In `frontend/src/pages/quests/svelte/Quests.svelte`, `onMount` performs `await ready` before
  setting `mounted = true`.
- Because all content is gated by `{#if mounted}`, users get no meaningful list until persisted
  state load finishes.

### 4.3 Repeated expensive classification path

- Quest classification loops all quests and calls:
  - `safeQuestFinished()` -> `questFinished()` -> `loadGameState()`
  - `safeCanStartQuest()` -> `canStartQuest()` -> `questFinished()` and
    `getUnmetQuestRequirements()` -> `questFinished()` per prerequisite.
- `loadGameState()` in `frontend/src/utils/gameState/common.js` returns `structuredClone(gameState)`.
- Net effect: repeated full-state clones and repeated requirement traversal across the list.

### 4.4 Custom quest enumeration is on initial interaction path

- `Quests.svelte` currently loads custom quests in `onMount` via `listCustomQuests()`.
- `listCustomQuests()` calls custom IndexedDB-backed listing (`db.list(quest)`), so custom content
  enumeration competes with early list readiness.

### 4.5 Image behavior

- `Quest.svelte` renders `<img src={quest.image}>` with a fixed 200x200 desktop card area.
- Built-in quest images are currently 512x512 JPEGs.
- Browser downscales every list image at runtime. On slower devices, decode + resize + many visible
  images can contribute to slower visual stabilization/pop-in.

## 5) Option set

| Option | TTI / perceived perf impact | Complexity | Correctness risk | Offline-first fit | Scale with quest growth |
|---|---|---:|---:|---:|---:|
| A. Build-time quest list manifest (summary-only) | High | Medium | Low | Strong | Strong |
| B. Snapshot-based authoritative progress for list classification | High | Medium | Low-Medium (if snapshot semantics are narrow and explicit) | Strong | Strong |
| C. Single-pass availability/completion classifier (avoid per-quest clones/calls) | High | Medium | Low | Strong | Strong |
| D. Defer custom quest enumeration from critical path | Medium | Low-Medium | Low | Strong | Strong |
| E. Defer graph work from critical path | Medium | Low-Medium | Low | Strong | Medium-Strong |
| F. List virtualization | Medium (for very large lists) | Medium-High | Low | Strong | Strong |
| G. Build-time list-card image derivative + reserved layout + fade-in | Medium (perceived + device decode savings) | Medium | Low | Strong | Strong |
| H. Minor image attrs only (`loading`, `decoding`) | Low-Medium | Low | Low | Strong | Medium |

## 6) Recommended design (v3.0.1)

### Recommendation summary

Implement a **two-phase quest list pipeline**:

1. **Fast path (authoritative-safe, immediately renderable)**
   - Render from a **build-time quest list manifest** (summary fields only).
   - Classify only what is provably correct from a **lightweight authoritative progress snapshot**.
   - Show neutral state when availability is unknown.
2. **Reconciled path (full fidelity)**
   - Load full persisted state and custom quests off the critical path.
   - Recompute statuses in one efficient pass (no repeated full-state clones/helper re-entry).
   - Enhance cards non-jankily (opacity/fade/status badge updates, no pushdown).

### 6.1 Build-time manifest for built-in list cards

Add a generated artifact (example name):

- `frontend/src/generated/questListManifest.json`

Fields per built-in quest should include only list-safe metadata:

- `id`, `title`, `description`, `image`, optional `imageList` (if derivatives enabled), `tree`,
  `requiresQuests`, and stable ordering metadata.

The `/quests` page should use this manifest for initial list rendering instead of passing complete
quest JSON blobs from `index.astro`.

### 6.2 Lightweight authoritative progress snapshot for safe fast-path status

Extend the persisted lightweight snapshot in `gameState/common.js` (currently checksum/dUSD/meta)
to include just enough authoritative quest progress for safe list classification, e.g.:

- `finishedQuestIds` (or compact equivalent)
- optional `currentStepByQuestId` only if needed for a conservative "in progress" badge

This snapshot must be written alongside normal `saveGameState` writes and readable without full
state hydration.

### 6.3 Single-pass classifier for list status

Introduce a classifier that accepts:

- manifest quest summaries
- snapshot (fast path) or full state (reconciled path)

And computes statuses in one pass:

- `completed`
- `locked` (unmet prerequisites known)
- `unknown` (insufficient data to assert availability)
- optional `available` only when definitively true

Avoid per-quest calls into `questFinished/canStartQuest` during list classification.

### 6.4 Defer custom quest enumeration and graph work

- Render built-in manifest list immediately.
- Load custom quests after first meaningful paint / idle scheduling and merge incrementally.
- Keep quest graph visualizer code/data out of critical path for base list rendering.
  - Note: current graph builder is in `frontend/src/lib/quests/questGraph.ts` and invoked from
    `index.astro`.

### 6.5 Secondary image optimization (pragmatic)

Add optional build-time generation of **one list-card derivative** per quest image (e.g., 256x256
JPEG/WebP), produced from canonical source images during build.

Use fixed image box reservation + fade-in so late image decode does not shift layout.

## 7) UX / correctness strategy for initial vs reconciled render

### 7.1 What is safe to show immediately

Safe from build-time manifest:

- title, description, image reference, tree/path metadata.

Safe from authoritative lightweight snapshot:

- completion badge only when snapshot explicitly confirms completion.

### 7.2 What must remain neutral until confirmed

Until full authoritative data is available, do **not** show start/continue affordances unless known
true. Use neutral states such as:

- "Checking requirements…"
- muted lock/unknown badge

### 7.3 Reconciliation behavior (pleasant, non-shifting)

When full state/custom data arrives:

- update badge text/icon with opacity/fade transition
- preserve card heights and CTA reserved space
- do not insert late elements that push existing rows downward

## 8) Data model / storage implications

- Extend lightweight snapshot schema in `frontend/src/utils/gameState/common.js`.
- Keep snapshot forward/backward compatible (missing fields => conservative neutral behavior).
- Keep snapshot authoritative scope intentionally small; avoid duplicating full game state.
- Consider compact encoding for finished IDs if size becomes concern, but prioritize correctness and
  simplicity for v3.0.1.

## 9) Asset / image pipeline implications

- Keep canonical quest images as source-of-truth.
- Generate a single list-card derivative at build time (no manual multi-size asset curation).
- Add manifest mapping from canonical image path to derivative list path.
- In UI, reserve fixed image area and apply fade-in to improve perceived performance.

Given current card rendering at 200x200 and source images at 512x512, one smaller derivative is a
reasonable middle ground for v3.0.1.

## 10) Migration / rollout plan

1. **Phase 1 (infrastructure):** manifest generator + snapshot schema extension + classifier module.
2. **Phase 2 (UI integration):** `/quests` fast path rendering from manifest + neutral-safe status
   model + reconciliation updates.
3. **Phase 3 (critical path trimming):** defer custom quest enumeration + defer graph prep.
4. **Phase 4 (secondary):** list image derivative integration and visual polish.
5. **Phase 5 (guardrails):** add tests and perf verification harnesses.

Use feature flags if needed for staged rollout and quick rollback.

## 11) Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Snapshot drift / stale status | Incorrect early labels | Treat unknown as neutral; only show affirmative statuses when authoritative. |
| Added build complexity | Build fragility | Keep generator deterministic, tested, and small-scope. |
| Custom quest merge order issues | Duplicate/missing cards | Stable dedupe by quest ID and deterministic sort order. |
| Visual jank during reconciliation | Poor UX | Reserve CTA/status space and use opacity transitions only. |
| Over-optimizing images too early | Scope creep | Keep to one derivative variant in v3.0.1. |

## 12) Testing strategy

### Unit tests

- Manifest generation:
  - includes all built-in quests
  - stable ordering
  - required list fields only
- Snapshot read/write:
  - backward compatibility with old snapshot shape
  - authoritative fields persisted with state writes
- Classifier correctness:
  - completed/locked/unknown/available cases
  - prerequisite handling and edge cases
  - no optimistic startability when data is incomplete

### Component tests (`Quests.svelte` and related)

- Fast-path render displays meaningful cards before full `ready` resolution.
- Initial unknown/neutral state is shown where required.
- Reconciliation updates badges/CTAs without card height change.
- No transient incorrect "startable/continue" affordance before authoritative confirmation.

### Playwright / E2E

- Simulate delayed IndexedDB readiness and verify list metadata appears before full state readiness.
- Verify no incorrect early affordances under delayed/full-state mismatch scenarios.
- Verify no layout shift/pushdown for post-initial status upgrades.
- Verify custom quests appear after deferred load without regressing built-in fast path.
- If image derivative is enabled, verify derivative source selection and stable image box behavior.

### Performance verification guidance

- Track:
  - time to first meaningful quest card (title/image placeholder visible)
  - time to authoritative status readiness
  - main-thread scripting during initial `/quests` load
- Compare baseline vs implementation using throttled CPU/device presets in local lab runs.

## 13) Acceptance criteria

1. `/quests` shows meaningful quest-list content before full persisted state readiness completes.
2. Initial built-in list render does not depend on eager full built-in quest payload hydration.
3. Initial render does not block on full custom quest enumeration.
4. No transient incorrect quest availability/start/continue affordance is shown.
5. Post-initial status/UI updates do not push down existing content (no visible layout shift).
6. Full-state load path performs less work than current implementation (eliminate repeated
   per-quest full-state clone/helper churn).
7. Offline-first behavior is preserved.
8. If image optimization is included, list cards use generated derivative strategy that improves
   perceived performance without manually duplicating source assets in-repo.
9. Robust unit + component + Playwright coverage exists for fast path, reconciliation correctness,
   and regression protection.

## 14) Deferred / non-primary ideas

- Full list virtualization for very large quest counts.
- Advanced responsive image set generation across many breakpoints.
- Server-driven remote quest list APIs (not needed for offline-first v3.0.1).
- Broad quest graph subsystem redesign.

## 15) Open questions

1. Snapshot encoding choice for finished quests: plain array vs compact bitset/hash map?
2. Should "in progress" appear in fast path, or remain neutral until full state confirms step data?
3. Should custom quest summaries get their own lightweight persisted index to further reduce startup
   reads?
4. For the visualizer, do we compute graph snapshot at build time and load on-demand only when
   toggle is enabled?
5. What v3.0.1 perf target should we lock for low-end device emulation (e.g., median first
   meaningful card latency threshold)?
