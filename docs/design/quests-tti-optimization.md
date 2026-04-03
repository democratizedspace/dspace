# `/quests` Time-to-Interactive Optimization (v3.0.1)

## 1) Problem statement

The `/quests` page currently delays meaningful rendering on slower devices because list rendering is
coupled to expensive client-side readiness work and large eagerly loaded datasets.

Observed in current code:

- `frontend/src/pages/quests/index.astro` eagerly imports every built-in quest JSON file at SSR
  build/render time (`import.meta.glob(..., { eager: true })`) and passes full quest payloads into
  `<Quests client:load ...>`. This means the page payload and hydration props scale with full quest
  content, not list-card needs.
- The same route also builds the full quest graph (`buildQuestGraph`) in the route module, even
  though graph visualization is optional and gated by user settings.
- `frontend/src/pages/quests/svelte/Quests.svelte` waits for `ready` from
  `frontend/src/utils/gameState/common.js` before setting `mounted = true`, so no quest list content
  is rendered until persisted state readiness completes.
- After mount, per-quest classification calls `questFinished()` and `canStartQuest()` repeatedly,
  each of which calls `loadGameState()` (deep clone), multiplying state-clone cost by quest count.
- Custom quest enumeration (`listCustomQuests`) runs in `onMount` and can contend with other
  IndexedDB work.

With current quest corpus size (~248 built-in quests / ~1.6 MB raw quest JSON), this path is already
heavy and worsens as built-in + custom quests grow.

## 2) Goals

1. Show meaningful `/quests` content much earlier, especially on low-end devices.
2. Preserve correctness during fast path (no transiently wrong “startable/continue” affordances).
3. Make full-state load and classification strictly cheaper than current implementation.
4. Preserve offline-first behavior and existing persistence model.
5. Keep v3.0.1 scope focused and implementation-ready.

## 3) Non-goals

- Rewriting quest detail/chat route architecture.
- Replacing IndexedDB/localStorage persistence stack.
- Building a full responsive-image system with many breakpoints.
- Solving every possible quest-page scalability issue (e.g., infinite scrolling for thousands of
  cards) in v3.0.1.

## 4) Current state / bottleneck analysis

### 4.1 SSR/build-time + hydration payload bottlenecks

- `index.astro` currently ships full quest objects to the client list component, despite list cards
  mainly needing id/title/description/image/path metadata.
- Graph data is built on the route even when the visualizer is disabled.

### 4.2 Client critical-path bottlenecks

- `Quests.svelte` gates all content on `await ready`.
- `loadGameState()` returns `structuredClone(gameState)`; repeated classification via
  `questFinished`/`canStartQuest` causes many deep clones.
- Current classification path runs helper calls per quest rather than one pass over state snapshot.

### 4.3 Storage + custom content bottlenecks

- `ready` in `gameState/common.js` reads persisted state and writes meta snapshot/checksum before
  signaling readiness.
- `listCustomQuests()` depends on custom-content IndexedDB reads (`getQuests()`), currently started
  during list mount.

### 4.4 Quest-card image/perceived performance bottlenecks

- `Quest.svelte` renders `<img src={quest.image}>` at fixed card dimensions (desktop 200x200), but
  source quest images can be larger; decode/downscale cost can hurt low-end devices.
- Current cards reserve image area reasonably, but late image decode can still cause visible pop-in.

## 5) Option set

| Option                                                              | TTI/Perceived impact    | Complexity | Correctness risk | Offline-first | Scaling with more quests |
| ------------------------------------------------------------------- | ----------------------- | ---------: | ---------------: | ------------: | -----------------------: |
| A. Build-time quest list manifest (summary dataset)                 | High                    |     Medium |              Low |        Strong |                   Strong |
| B. Snapshot-based authoritative progress for list classification    | High                    |     Medium |          Low-Med |        Strong |                   Strong |
| C. Single-pass classifier (avoid per-quest deep clone/helper calls) | High                    |     Medium |              Low |        Strong |                   Strong |
| D. Defer custom-quest loading off initial paint                     | Medium                  |    Low-Med |              Low |        Strong |                   Strong |
| E. Defer graph build/load until enabled                             | Medium                  |    Low-Med |              Low |        Strong |            Medium-Strong |
| F. Pragmatic image derivatives + fixed box + fade-in                | Medium (perceived)      |     Medium |              Low |        Strong |                   Medium |
| G. List virtualization                                              | Low-Med (current sizes) |   Med-High |              Med |        Strong |                   Strong |

### Option notes

- **A (manifest)**: convert built-in list input from full quest JSON to generated minimal summary.
  Reduces transfer/parse/hydration work.
- **B (progress snapshot)**: extend lightweight persisted snapshot so early list state can safely
  show only statuses known to be authoritative (e.g., completed).
- **C (single-pass classifier)**: compute availability/completion from one loaded snapshot instead of
  repeated `loadGameState()` clones.
- **D (defer custom quests)**: show built-in list immediately; merge custom cards after background
  load with non-layout-shifting placeholder region.
- **E (graph deferral)**: avoid route-level graph construction unless needed; pair with existing
  graph visualizer toggle behavior.
- **F (image derivatives)**: build one generated list-card variant (not hand-maintained multi-size
  assets) plus opacity transition.
- **G (virtualization)**: valuable later for very large lists, but not primary v3.0.1 lever vs data
  path fixes.

## 6) Recommended design (v3.0.1)

Recommend **A + B + C + D + E** as primary architecture, with **F** as secondary supporting
optimization.

### 6.1 Build-time built-in quest list manifest

Add a generated artifact for `/quests` list usage only, containing stable safe-to-render fields:

- `id`, `title`, `description`, `image`, `path/tree`, `requiresQuests`, optional quest-list image
  derivative path.

Implementation direction:

- Generate during build/dev script from `frontend/src/pages/quests/json/**/*`.
- Store under a generated location already used for similar artifacts (e.g.
  `frontend/src/generated/quests-list-manifest.json`).
- `index.astro` consumes manifest rather than eager-importing full built-in payloads for list cards.

### 6.2 Fast-path render model (safe neutral first)

Initial render source priority:

1. SSR/build-time manifest (always available) for card metadata.
2. Lightweight authoritative progress snapshot (new/extended) for only statuses that are safe.
3. Full game state hydration for final classification.

Rules:

- Safe immediately: title/description/image/path/tree metadata.
- Safe immediately if authoritative snapshot says so: completed status.
- Unsafe until full state confirms: startable/continue/availability-dependent affordances.
- Uncertain state shown as neutral (e.g., “Checking availability…”), not optimistic CTA.

### 6.3 Extend lightweight progress snapshot

`gameState/common.js` already persists lightweight metadata (`checksum`, `dUSD`).
Extend to include list-safe quest progress summary, e.g.:

- `completedQuestIds` (or compact equivalent),
- optional minimal progression hints needed for conservative classification.

Snapshot must be authoritative and atomically updated alongside normal saves to avoid drift.

### 6.4 Single-pass quest classification engine

Introduce a dedicated list classifier utility:

- Input: manifest entries + one in-memory state snapshot (+ custom quest subset when loaded).
- Output per quest: `completed | available | unavailable | unknown` (+ reason metadata).
- Execute once per relevant state update; avoid calling `questFinished`/`canStartQuest` per card.

This removes repeated deep clones from the hot path.

### 6.5 Defer custom quests and graph work

- Render built-in manifest list immediately.
- Load custom quests after initial paint/idle tick; merge with fade-in and reserved space container.
- Defer quest graph dataset/build import until visualizer is enabled (and keep it absent otherwise).

### 6.6 Secondary image optimization (pragmatic)

Given card image display target (`200x200` desktop in `Quest.svelte`), generate one smaller
quest-list derivative per quest image at build time (e.g., ~256 square WebP/AVIF/JPEG fallback as
needed by existing pipeline).

Principles:

- Generated from canonical source images; no hand-managed size variants committed.
- Fixed image box remains reserved to prevent layout shift.
- Apply subtle opacity fade on `img` load to reduce perceived pop-in.

## 7) UX / correctness strategy for initial vs reconciled render

### 7.1 State phases

1. **Phase A (Immediate)**: render manifest cards + neutral action/status placeholders.
2. **Phase B (Snapshot-enhanced)**: mark only authoritative-safe states (e.g., completed).
3. **Phase C (Full-ready)**: apply full classification; enable start/continue affordances.

### 7.2 Correctness guardrails

- Never show “start/continue” during A/B unless required dependencies are definitively known.
- If any required input missing/uncertain, render neutral unavailable/unknown state.
- Prefer delayed enablement over temporary false-positive affordance.

### 7.3 Non-janky reconciliation

- Reserve vertical space for status/action row on initial render.
- Reconciliation should change opacity/text/icon only, not card height.
- Custom-quest section reserves container space before async merge.

## 8) Data model / storage implications

### 8.1 New generated manifest

- Build artifact: quest-list summary dataset for built-ins.
- Generated from canonical quest JSON, not manually edited.

### 8.2 Lightweight snapshot extension

- Extend persisted lightweight snapshot schema in `gameState/common.js`.
- Keep backward compatibility: missing new fields => neutral classification fallback.
- Keep checksum/version semantics coherent with existing meta model.

### 8.3 Classification contract

Define explicit enum for list state (`completed|available|unavailable|unknown`) and keep it local to
quest-list logic to reduce accidental optimistic UI.

## 9) Asset / image pipeline implications

- Add build-time generation step for one quest-list derivative per canonical quest image.
- Manifest records derivative path when available; fallback to canonical image otherwise.
- Keep existing canonical image references and provenance workflows unchanged.

## 10) Migration / rollout plan

1. Introduce manifest generator + reader in `/quests` route.
2. Add new classifier utility + unit tests against current quest dependency semantics.
3. Add lightweight snapshot extension + compatibility handling.
4. Refactor `Quests.svelte` to phased rendering and neutral-first strategy.
5. Defer custom quest loading + graph dataset work.
6. Add optional image derivative pipeline and card fade-in handling.
7. Land behind temporary feature flag if needed; remove after validation.

## 11) Risks and mitigations

| Risk                                          | Impact                 | Mitigation                                                                          |
| --------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| Snapshot drift vs full state                  | Incorrect early labels | Treat snapshot as authoritative only for explicitly safe fields; otherwise neutral. |
| Classifier logic diverges from quest rules    | Availability mismatch  | Share helper logic/constants and add parity tests against current behavior.         |
| Deferred custom quest load feels “missing”    | UX confusion           | Show “Loading custom quests…” placeholder section with reserved space.              |
| Graph deferral breaks visualizer expectations | Feature regression     | Keep existing toggle tests and add explicit lazy-load assertions.                   |
| Image derivative generation failures          | Broken thumbnails      | Manifest fallback to canonical image path; build warnings surfaced in CI.           |

## 12) Testing strategy (for implementation PR)

### 12.1 Unit tests

- Manifest generation: includes all built-ins, deterministic ordering, required fields only.
- Lightweight snapshot read/write + backward compatibility.
- Classifier correctness for:
  - completed,
  - prerequisite-satisfied availability,
  - unknown/neutral when inputs incomplete,
  - parity with current semantics on representative quest fixtures.

### 12.2 Component tests (`Quests.svelte`)

- Fast path renders cards before full `ready` resolution.
- Neutral status shown pre-readiness; no early start/continue controls.
- Post-ready reconciliation updates status without changing card layout height.
- Custom quests appear after async load with non-layout-shifting transition.

### 12.3 Playwright / E2E

- Simulate delayed IndexedDB readiness and assert meaningful quest cards appear early.
- Assert no transient incorrect affordances before authoritative data.
- Validate graph assets/chunks are not requested until visualizer enabled.
- Validate no visible layout shift for late status enhancements (heuristic via bounding-box checks).

### 12.4 Image verification (if derivative option included)

- Test manifest points to derivative when present.
- Confirm rendered card requests derivative asset on `/quests` list.
- Visual regression spot-check on slow emulation for reduced pop-in.

### 12.5 Performance verification

- Add instrumentation around:
  - first meaningful quest-card paint,
  - time to first interactive list controls,
  - full-state-ready timestamp.
- Compare baseline vs new path on throttled CPU/device presets; require clear improvement trend.

## 13) Acceptance criteria

1. `/quests` shows meaningful built-in quest card content before full persisted state readiness.
2. Initial list render does not depend on eager full built-in quest payload loading.
3. Initial render does not block on full custom quest enumeration.
4. No transient incorrect startable/continue affordances appear before authoritative data is ready.
5. Post-initial status/affordance updates do not push down existing content (no card height jump).
6. Full-state load/classification path performs less critical-path work than current implementation
   (including elimination of per-quest repeated full-state clones).
7. Offline-first behavior remains intact (works with persisted local data and without network).
8. If image optimization ships, list-card image delivery improves perceived performance without
   requiring manually duplicated multi-size source assets in repo.
9. Unit + component + Playwright coverage is added for fast path correctness and reconciliation.

## 14) Deferred ideas / non-primary follow-ups

- Full list virtualization/windowing for very large custom quest catalogs.
- Rich responsive image `srcset` matrix across many breakpoints.
- Broader quest graph compute/storage refactors beyond `/quests` list critical path.

## 15) Open questions

1. Should snapshot store only `completedQuestIds`, or also minimal in-progress flags for “continue”
   once proven safe?
2. Preferred generated artifact location/convention for quest list manifest in this repo.
3. Whether graph data should be generated at build as a static artifact for lazy loading.
4. Exact derivative image format policy (single format vs fallback pair) for broad browser support.
5. Performance budget targets to formalize for v3.0.1 gates (device profile + threshold values).
