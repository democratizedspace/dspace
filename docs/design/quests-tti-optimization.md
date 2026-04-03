# `/quests` time-to-interactive optimization (v3.0.1)

## 1) Problem statement

The `/quests` page currently delays meaningful rendering behind client hydration and full game-state
readiness, then performs repeated per-quest state checks that scale poorly as quest count grows.
On slower devices, this causes a noticeably late first useful paint of quest content and a heavier
post-hydration main-thread burst.

Today, `frontend/src/pages/quests/index.astro` eagerly imports every built-in quest JSON module and
passes the full payload into the Svelte list component. `frontend/src/pages/quests/svelte/Quests.svelte`
then waits for `ready` from `frontend/src/utils/gameState/common.js` before rendering any list
content and classifies each quest via repeated helper calls (`questFinished` / `canStartQuest`)
that each re-read cloned game state. This architecture is correct but not TTI-efficient.

v3.0.1 needs a concrete architecture that shows meaningful, correct quest list content much sooner
while preserving offline-first behavior.

## 2) Goals

1. Show meaningful `/quests` content significantly earlier, especially on older/slower devices.
2. Preserve correctness: never transiently show incorrect "Start/Continue"-style availability.
3. Reduce full-state load and classification work versus current implementation.
4. Preserve offline-first behavior (including IndexedDB-unavailable fallback behavior).
5. Scale better with larger built-in quest sets and growing custom quest counts.
6. Keep scope practical for v3.0.1 implementation.

## 3) Non-goals

- Rewriting quest dialogue runtime logic.
- Re-architecting all game-state storage in v3.0.1.
- Building a full responsive image system with many manual asset sizes.
- Replacing custom-content storage model.
- Large quest graph visualizer redesign.

## 4) Current state / bottleneck analysis

### 4.1 Current `/quests` data path

1. **SSR/build step (`index.astro`)**
   - Uses `import.meta.glob('./json/*/*.json', { eager: true })` and maps all modules to `quests`.
   - Builds graph data for `QuestGraphVisualizerGate` in the same route file.

2. **Client (`Quests.svelte`)**
   - `onMount` does `await ready` before `mounted=true`, so no list content is rendered until
     storage init resolves.
   - Then synchronously loads state with `loadGameState()` and subscribes to state updates.
   - Then asynchronously loads custom quests (`listCustomQuests()`).
   - Reactive classification loops all built-in + custom quests and calls:
     - `questFinished(quest.id)`
     - `canStartQuest(quest)`
   - `questFinished` and `canStartQuest` read `loadGameState()`, and `loadGameState()` returns
     `structuredClone(gameState)`, amplifying repeated work.

3. **Rendering (`Quest.svelte`)**
   - Quest tile image uses a full `src={quest.image}` `<img>` with fixed card dimensions
     (200x200 desktop, flexible mobile), no explicit loading/decoding hints, and no list-specific
     derivative selection.

### 4.2 Why this hurts TTI

- **Hard gate on `ready`**: no quest cards until IndexedDB/local fallback initialization completes.
- **Large payload in initial props**: full quest JSON for list view even though list needs only
  small metadata (id, title, description, image, dependencies/path).
- **Classification inefficiency**: repeated helpers re-clone state and re-evaluate requirements per
  quest; cost scales with quest count and updates.
- **Custom quest enumeration on hot path**: custom quest loading begins during initial mount.
- **Potential UX jank risk for future incremental rendering** unless space is reserved up front.

### 4.3 Scale signal from repository state

- Built-in quest corpus currently contains **248** canonical quest JSON files under
  `frontend/src/pages/quests/json/*/*.json`, so brute-force per-quest repeated checks are already
  non-trivial and will worsen as content grows.

## 5) Option set

| Option | TTI / perceived impact | Complexity | Correctness risk | Offline-first fit | Scale with more quests |
|---|---|---:|---:|---:|---:|
| A. Build-time quest list manifest (built-ins) | High | Medium | Low | High | High |
| B. Snapshot-based authoritative progress for fast classification | High | Medium | Medium (if snapshot semantics weak) | High | High |
| C. Single-pass classifier (no repeated clones/helper calls) | High | Medium | Low | High | High |
| D. Defer custom quest enumeration | Medium-High | Low-Med | Low | High | High |
| E. Defer non-essential graph work from critical path | Medium | Low | Low | High | Medium |
| F. Build-time quest-list image derivative + reserved layout/fade | Medium (perceived) | Medium | Low | High | Medium-High |
| G. List virtualization | Low-Med (current card count likely manageable) | Medium-High | Medium | High | High |
| H. Micro-tuning only (loading attrs, minor CSS) | Low | Low | Low | High | Low |

### Option notes

- **A** directly removes heavy built-in payload from initial list rendering path.
- **B** allows safe early "completed" indication without full hydrate if snapshot is authoritative.
- **C** removes repeated `loadGameState()` cloning and repeated helper chaining.
- **D** keeps custom content correctness while unblocking built-in list first paint.
- **E** is mostly already aided by graph-visibility gating, but can be tightened to avoid any
  unnecessary early graph-related costs.
- **F** addresses image decode/downscale/pop-in on slow hardware; worthwhile but secondary.
- **G** is likely unnecessary for v3.0.1 if we fix upstream data/state bottlenecks first.

## 6) Recommended design (primary v3.0.1 approach)

### Recommendation summary

Implement **A + B + C + D**, with **F** as a bounded supporting optimization and **E** as hygiene.

### 6.1 Build-time built-in quest list manifest

Introduce a generated quest-list manifest optimized for `/quests` list rendering, containing only
stable list-safe fields, e.g.:

- `id`
- `title`
- `description` (possibly trimmed if needed)
- `image` (or list derivative path)
- `tree/path` metadata
- `requiresQuests` (normalized)

Do **not** include full dialogue payload in this list manifest.

Use this manifest in `frontend/src/pages/quests/index.astro` instead of eager full quest payload
for list cards.

### 6.2 Fast-path render from stable data (not blocked on full state)

Render initial quest cards immediately from SSR/build-time manifest data.

Initial status model:

- Always safe immediately: title/description/image/tree metadata.
- Show **neutral availability state** initially when authoritative data is not ready.
- Do not show startable/continue affordances until authoritative classification is available.

### 6.3 Authoritative lightweight progress snapshot for safe early classification

Extend existing lightweight persisted metadata concept in
`frontend/src/utils/gameState/common.js` (currently checksum/dUSD/lastUpdated) to include a compact,
authoritative quest-progress subset needed for safe list-level status, e.g.:

- set/list of finished quest IDs
- optional minimal current-step presence marker if needed for "in progress"

This snapshot must be updated atomically alongside normal state writes and be valid offline (IDB +
localStorage fallback path).

### 6.4 Single-pass classification pipeline

Replace repeated per-quest helper calls on cloned full state with one classifier pass:

- Inputs: manifest quest array + authoritative progress snapshot (+ resolved full state later).
- Outputs per quest: `completed | available | locked | unknown` (or similar internal enum).
- Use set lookups and dependency checks in one traversal.

This avoids repeated `loadGameState()` cloning and repeated nested helper invocations.

### 6.5 Defer custom quests off critical path

Do not block initial built-in list render on `listCustomQuests()`.

Load custom quests asynchronously after initial meaningful render; insert custom quest section/cards
with reserved space and fade-in (no pushdown of already rendered content).

### 6.6 Keep graph-related work off critical path

Continue to gate quest graph visualizer rendering by setting and visibility as today, but ensure
list fast path does not perform graph work that is unnecessary before user reaches the visualizer.

### 6.7 Secondary image optimization (bounded scope)

Add a **single generated quest-list derivative size** (e.g., one list-card target) from canonical
quest images at build-time, consumed by `/quests` list cards.

Rationale based on current card layout:

- Desktop quest tile image is rendered around 200x200 in `Quest.svelte`.
- Serving oversized originals can increase decode/downscale cost and memory pressure on slower
  devices.

Use fixed image box reservation + opacity fade-in to avoid layout shift/pop-in.

## 7) UX / correctness strategy for initial vs reconciled render

### 7.1 Safe-to-show matrix

| Data / affordance | Initial fast path | After authoritative snapshot | After full state |
|---|---|---|---|
| Title / description / image / tree | Show | Show | Show |
| Completed badge/state | Neutral unless snapshot says completed | Show if snapshot authoritative | Reconcile if needed |
| Startable / continue affordance | **Withhold** | Show only if definitively known | Show final |
| Locked state due to prerequisites | Neutral/unknown unless definitively provable | Show when classifier can prove | Show final |

### 7.2 Reconciliation behavior

- Reserve status area height in every card from first render.
- Transition status content via opacity/fade, not element insertion that changes layout.
- Keep card dimensions stable between initial and reconciled states.
- Custom quest insertion should use pre-reserved section space or append below fold with smooth
  reveal; no pushing down already visible top content.

## 8) Data model / storage implications

1. Add quest-progress mini-snapshot shape to lightweight persistence metadata.
2. Ensure snapshot writes occur on quest progress mutations (`finishQuest`, quest step updates as
   needed) via existing save pipeline.
3. Maintain compatibility with IndexedDB-unavailable fallback (`localStorage` / in-memory behavior)
   so fast classification still works offline.
4. Version snapshot schema defensively (optional version field) for forward compatibility.

## 9) Asset / image pipeline implications

1. Generate one quest-list derivative variant from canonical quest image sources during build.
2. Store generated artifacts in a deterministic generated path (not hand-maintained duplicate assets).
3. Keep canonical source image references in quest JSON unchanged; manifest can point list view to
   derivative path.
4. UI should use fixed width/height/aspect reservation and optional fade-in to reduce jank.

## 10) Migration / rollout plan

### Phase 0: Instrument + baseline (no behavior change)

- Capture baseline `/quests` timing in dev tooling and Playwright traces (slow CPU/storage cases).

### Phase 1: Manifest + neutral fast path

- Add build-time manifest generation and consume it in `/quests` route.
- Render list metadata immediately with neutral status placeholders.

### Phase 2: Snapshot + single-pass classifier

- Extend lightweight snapshot schema and write path.
- Add classifier pipeline and wire status transitions from unknown → authoritative.

### Phase 3: Deferred custom quests + image derivative

- Move custom quest loading fully off initial path.
- Add generated list-card derivative and non-layout-shifting image reveal.

### Phase 4: Hardening

- Add regression/perf tests and rollout guardrails.

## 11) Risks and mitigations

| Risk | Mitigation |
|---|---|
| Snapshot becomes stale/incomplete and shows wrong state | Treat uncertain state as neutral; only show positive states when snapshot is authoritative; reconcile with full state. |
| Added generated artifacts drift from source quests | Deterministic generation step + CI check that generated manifest/derivatives are up-to-date. |
| Custom quest late load causes visible jump | Reserve section space and use fade-in; avoid inserting above existing cards. |
| Complexity creep from image work | Limit v3.0.1 to one list derivative size and one consumption path. |
| Offline fallback divergence | Test IDB-unavailable and localStorage fallback paths explicitly. |

## 12) Testing strategy (for implementation PR)

### 12.1 Unit tests

1. Manifest generation
   - includes required list-safe fields
   - excludes heavy dialogue payload
   - deterministic ordering
2. Snapshot model
   - write/read round-trip across IDB and fallback
   - authoritative fields updated on quest progress mutation
3. Classifier
   - single-pass classification correctness for:
     - completed
     - locked by dependencies
     - available
     - unknown/neutral when insufficient data
   - no false-positive startable/continue states

### 12.2 Component tests (`Quests.svelte` / `Quest.svelte`)

- Initial render shows meaningful cards before full state readiness.
- Initial status is neutral when uncertainty exists.
- Reconciliation updates status without changing card/container layout metrics.
- Custom quest section appears without pushing down already rendered content.

### 12.3 Playwright coverage

Add/extend `/quests` E2E scenarios for:

1. **Delayed storage readiness** (artificially slow IDB path):
   - meaningful list appears before full ready.
2. **Correctness guard**:
   - no transient incorrect startable/continue affordance before authoritative data.
3. **No layout shift**:
   - key card Y positions stable across status reconciliation.
4. **Custom quest deferral**:
   - built-in list interactive before custom enumeration completes.
5. **Image behavior (if derivative included)**:
   - list card uses derivative path/selection strategy and preserves reserved dimensions.

### 12.4 Performance verification guidance

- Compare baseline vs implementation using Playwright trace + browser performance profiling with
  CPU throttling and storage delay simulation.
- Track at minimum:
  - time to first meaningful quest cards
  - time to first authoritative statuses
  - total scripting time during initial hydration window

## 13) Acceptance criteria

1. `/quests` shows meaningful quest list content before full persisted state readiness completes.
2. Initial list render for built-ins does not depend on eager full built-in quest payloads.
3. Initial list render does not block on full custom quest enumeration.
4. No transient incorrect quest availability/startable/continue affordance is shown.
5. Any post-initial status/UI updates do not push down existing rendered content.
6. Full-state classification path performs less critical-path work than current repeated clone/helper
   approach.
7. Offline-first behavior remains intact (IDB + fallback paths).
8. If image optimization lands in scope, list-card images use generated derivative strategy that
   improves perceived performance without manual duplicated source-asset maintenance.
9. Unit + component + Playwright coverage exists for fast-path correctness and reconciliation.

## 14) Deferred ideas / non-primary work

- Full list virtualization (revisit only if post-optimization profiling still shows DOM pressure).
- Broad responsive image matrix (multiple breakpoints/formats) beyond one pragmatic list derivative.
- Deep quest graph visualizer performance project.

## 15) Open questions

1. Exact authoritative snapshot schema for "in-progress" semantics without over-expanding metadata.
2. Whether completed-only early status is sufficient for v3.0.1, with available/locked finalized
   after full state.
3. Best generated artifact locations and CI enforcement strategy for manifest + image derivatives.
4. Whether list image derivatives should be generated as WebP/AVIF with PNG/JPG fallback in current
   toolchain constraints.
5. Desired quantitative perf guardrails for CI (soft trend checks vs hard thresholds).
