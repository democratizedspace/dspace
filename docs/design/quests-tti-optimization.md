# `/quests` TTI optimization design (v3.0.1)

## 1) Problem statement

The `/quests` page currently delays meaningful content until client hydration and persisted game
state readiness complete. On slower devices, this creates a visible blank/late-populating page and
scales poorly as built-in and custom quest counts grow.

Current implementation hotspots are concentrated in:

- Eager loading of full built-in quest JSON payloads in SSR and serialization into hydrated props
  (`import.meta.glob(..., { eager: true })` in `frontend/src/pages/quests/index.astro`).
- Gating visible quest UI on `await ready` in `Quests.svelte`, where `ready` waits for persistence
  reads and validation in `gameState/common.js`.
- Per-quest availability checks that repeatedly call `loadGameState()` (which `structuredClone`s
  the full state each time), through `questFinished()`/`canStartQuest()` in `gameState.js`.
- Eager custom quest enumeration (`listCustomQuests()`) before list rendering in `Quests.svelte`.

Together, these form an avoidable critical path and increase both CPU and memory pressure on older
hardware.

## 2) Goals

- Show meaningful `/quests` content significantly earlier (target: before full persisted state
  readiness).
- Preserve correctness: never show incorrect optimistic affordances (especially start/continue).
- Make full-state path strictly faster than current implementation.
- Keep offline-first behavior intact.
- Scale better with more built-in quests and custom quests.
- Improve perceived performance for quest-card images as a secondary optimization.

## 3) Non-goals

- Rewriting quest dialogue/runtime systems.
- Introducing server-backed quest-state authority (must remain offline-first/local-first).
- Building a full responsive-image matrix for v3.0.1.
- Redesigning quest taxonomy, card layout, or major visual language.

## 4) Current state / bottleneck analysis

### 4.1 Built-in data load is heavier than list needs

`index.astro` eagerly imports all built-in quest JSON modules and passes full quest objects into
`<Quests client:load quests={quests}>`. That means list render receives entire dialogue graphs and
metadata that are not required for first list paint (title/description/image/id/path are enough).

### 4.2 Initial list visibility is blocked on persistence readiness

In `Quests.svelte`, all actionable/visible content is inside `{#if mounted}` and `mounted` is set
only after `await ready` from `gameState/common.js`, then custom quests are loaded.

This defers first meaningful content to:

1. IndexedDB/localStorage reads + migration/validation-ready path (`ready`), then
2. custom quest enumeration (`listCustomQuests()`), then
3. classification loop.

### 4.3 Classification does repeated full-state cloning

`loadGameState()` returns `structuredClone(gameState)` in `gameState/common.js`.
`questFinished()` and `canStartQuest()` call `loadGameState()` in `gameState.js`; `canStartQuest()`
also invokes `questFinished()` for prerequisites.

So quest list filtering performs many full clones per render cycle (per quest, plus prerequisite
checks), multiplying cost with quest count.

### 4.4 Correctness edge in current defensive fallback

`safeCanStartQuest()` in `Quests.svelte` returns `true` on error, which is optimistic and can
transiently show quests as available when authoritative state evaluation failed. That violates the
v3.0.1 correctness constraint.

### 4.5 Custom quests and graph concerns are mixed into the same mount path

`Quests.svelte` loads custom quests on mount and also subscribes to state for quest graph visibility
settings. While the visualizer chunk is lazy imported by `QuestGraphVisualizerGate.svelte`, the
list path still pays orchestration overhead early.

### 4.6 Current image rendering is simple but not tuned for low-end decode cost

`Quest.svelte` renders card images with fixed CSS box sizes (`200x200` desktop, responsive on
mobile) but no explicit lazy decoding hints and no smaller list-specific derivative. Many quest
images in `frontend/public/assets/quests` are larger than card display size, implying avoidable
decode/downscale work on slower devices.

### 4.7 Scale context

Current built-in quest corpus is large (248 quest JSON files, ~1.56 MB raw JSON total in this
checkout), with average ~7.16 dialogue nodes per quest. Carrying full payloads into list-path work
is unnecessary for first-interactive list rendering.

## 5) Option set

| Option | Expected TTI / perceived impact | Complexity | Correctness risk | Offline-first fit | Scale behavior |
|---|---|---:|---:|---:|---:|
| A. Build-time quest list manifest (built-ins) | High | Medium | Low | Strong | Strong |
| B. Lightweight authoritative progress snapshot for list classification | High | Medium | Low-Medium (if snapshot schema wrong) | Strong | Strong |
| C. One-pass classifier over in-memory snapshot + quest summaries | High | Medium | Low | Strong | Strong |
| D. Defer custom quest loading off critical path | Medium-High | Low-Medium | Low | Strong | Strong |
| E. Defer/non-block graph-related work from list path | Medium | Low | Low | Strong | Medium |
| F. List virtualization | Medium at high counts | Medium-High | Medium | Strong | Strong |
| G. Pragmatic image derivative + reserved layout + fade-in | Medium perceived | Medium | Low | Strong | Strong |
| H. Attribute-only image tuning (`loading`, `decoding`, fetch priority) | Low-Medium | Low | Low | Strong | Medium |

### Option details

1. **A — Build-time manifest**
   - Generate a lightweight built-in quest summary artifact (id, title, description, image,
     requiresQuests, path/tree metadata) during build.
   - `/quests` SSR and hydration use this summary, not full dialogue payloads.

2. **B — Lightweight progress snapshot**
   - Extend lightweight persisted snapshot in `gameState/common.js` (currently checksum/dUSD/time)
     with list-safe quest progress indicators sufficient for authoritative `completed` and
     conservative `unknown` vs `available` gating.

3. **C — One-pass classifier**
   - Replace per-quest repeated helper calls with one in-memory pass over summaries + snapshot/full
     state object, with no repeated structuredClone per quest.

4. **D — Defer custom quests**
   - Render built-in summaries immediately; load/merge custom quests asynchronously after initial
     list content is visible.

5. **E — Graph deferral hardening**
   - Ensure list rendering is independent from graph data/settings wiring; graph remains strictly
     optional follow-up work.

6. **F — Virtualization**
   - Consider only if quest count materially exceeds current levels or if profiling still shows
     render bottlenecks after A+B+C+D.

7. **G — Build-time image derivative (secondary)**
   - Generate one list-card-sized derivative per quest image at build time; keep canonical source
     image as truth. Use fixed image box reservation + fade-in to avoid layout shift/pop-in.

8. **H — Attribute tuning**
   - Add native loading/decoding hints and explicit dimensions as low-scope improvements.

## 6) Recommended design (v3.0.1)

### Recommendation summary

Adopt **A + B + C + D** as the primary architecture, with **G + H** as secondary perceived-performance
enhancements, and keep **F** deferred.

### 6.1 Build-time quest list manifest

Create a generated artifact (proposed location: `frontend/src/generated/quests/listManifest.json`)
from `frontend/src/pages/quests/json/**/*` containing only list-required fields:

- `id`, `title`, `description`, `image`
- `requiresQuests` (normalized)
- tree/path metadata (for stable sorting/grouping and route link derivation)
- optional precomputed compact fields used by list rendering only

`/quests/index.astro` should import this manifest (or generated module) instead of eager full quest
payloads.

### 6.2 Fast-path rendering from stable data

`Quests.svelte` should render initial cards immediately from manifest-provided built-in summaries,
without waiting for `ready`.

### 6.3 Snapshot-first authoritative classification

Extend lightweight persisted snapshot in `gameState/common.js` to include minimal authoritative
quest progress fields for list-safe classification (e.g., completed quest IDs and in-progress quest
step IDs/checksum-bound marker).

Rules:

- If snapshot is present and validated against checksum semantics, `completed` can be shown.
- `startable/continue` is shown only when requirements can be evaluated authoritatively.
- If uncertain (snapshot missing/stale/partial), render neutral state (`status withheld`) instead
  of optimistic availability.

### 6.4 Single-pass classifier

Introduce a list classifier utility that:

- accepts quest summaries + snapshot/full state,
- computes per-quest status in one pass with memoized prerequisite completion lookup,
- avoids repeated `loadGameState()` calls and repeated cloning.

This should be used both for fast snapshot path and full-state reconciliation path.

### 6.5 Defer custom quest enumeration and merge

Load custom quests after built-in fast path is visible. Merge them in a second phase with reserved
space/transition strategy (see UX section), and classify with neutral defaults until authoritative
state for those entries is available.

### 6.6 Keep graph off critical path

Retain lazy graph visualizer behavior and ensure graph data computation/serialization is excluded
from initial quest-list interactivity path where possible.

### 6.7 Secondary image optimization

Add a build-time generated single list-card derivative (one size, not a full responsive matrix),
and render cards with reserved image bounds + fade-in to reduce decode/downscale jank and visual
pop-in on slower devices.

## 7) UX / correctness strategy for initial vs reconciled render

### Safe immediately on first render

- Quest title, description, image, id/path/tree from build-time manifest.
- Static card shells and navigation links to quest detail routes.
- `completed` badge only if snapshot is authoritative for that claim.

### Must be withheld until authoritative

- `Start` / `Continue` affordances when requirement satisfaction is uncertain.
- Any status derived from missing/possibly stale prerequisites.

### Reconciliation behavior

- Use fixed card dimensions and reserved affordance slots from first paint.
- On reconciliation, transition via opacity/fade/color state changes only.
- No insertion above existing content that pushes cards downward.
- If custom quests arrive later, append in a reserved section or controlled slot that does not
  reflow existing visible cards unexpectedly.

## 8) Data model / storage implications

### Build artifact

- New generated quest-list manifest under `frontend/src/generated/quests/`.
- Build script should validate deterministic sort and normalized requiresQuests.

### Game-state lightweight snapshot

- Extend lightweight snapshot currently written in `gameState/common.js` meta store.
- Snapshot must remain compact and cheap to read.
- Include versioning to allow forward-compatible migration/fallback.

### Classifier inputs

- `QuestListSummary[]` (manifest + custom summary shape)
- `QuestProgressSnapshot` (authoritative lightweight)
- Optional full hydrated state for final reconciliation

## 9) Asset / image pipeline implications

- Add a build-time step to generate one quest-list image derivative per canonical quest image.
- Keep canonical source assets unchanged; derivatives are generated artifacts.
- Quest list cards use derivative path by default; fallback to canonical image on missing derivative.
- Keep existing offline-first service-worker behavior by ensuring generated assets are in static
  build output and included in cache strategy.
- Add explicit image box reservation and fade-in behavior to eliminate layout shift.

## 10) Migration / rollout plan

1. **Phase 1 (foundational data path)**
   - Add manifest generator + wiring in `/quests/index.astro`.
   - Introduce classifier utility and tests.
2. **Phase 2 (snapshot fast path)**
   - Extend lightweight snapshot schema, read path, and fallback behavior.
   - Render neutral/authoritative statuses without waiting for full `ready`.
3. **Phase 3 (critical path trimming)**
   - Defer custom quests and isolate graph work.
   - Remove repeated full-state clone patterns from list classification path.
4. **Phase 4 (perceived-performance polish)**
   - Add list image derivative generation + non-layout-shifting transitions.
5. **Phase 5 (guardrails + perf verification)**
   - Add targeted Playwright and unit regressions for correctness and layout stability.

## 11) Risks and mitigations

- **Risk: stale snapshot shows incorrect completion**
  - Mitigation: bind snapshot trust to checksum/version; fall back to neutral if mismatch.
- **Risk: dual-path complexity (snapshot + full-state reconcile)**
  - Mitigation: single shared classifier function with explicit status enum.
- **Risk: custom quest merge causes jank**
  - Mitigation: reserved section/skeleton and fade-in-only transitions.
- **Risk: generated manifest/derivative drift**
  - Mitigation: generation in standard build/test flow with deterministic checks.
- **Risk: offline cache misses for generated assets**
  - Mitigation: include generated outputs in existing pre-cache/runtime cache strategy tests.

## 12) Testing strategy

### Unit tests

- Manifest generator:
  - deterministic ordering
  - field completeness and normalization
  - excludes dialogue-heavy payload fields
- Snapshot schema:
  - read/write/upgrade behavior
  - checksum/version trust gates
- Classifier:
  - completed/available/locked/unknown states
  - prerequisite chains/branches
  - neutral-on-uncertainty guarantees
  - no optimistic startable/continue when uncertain

### Component tests (`Quests.svelte` / card rendering)

- Renders meaningful built-in list before full-state readiness.
- Neutral fast-path status rendering (no incorrect action affordances).
- Reconciliation transitions do not alter layout geometry unexpectedly.
- Custom-quest delayed merge behavior preserves existing layout stability.

### Playwright (E2E)

Add `/quests`-focused coverage for:

- artificially delayed IndexedDB readiness and delayed full-state hydration
- initial content visibility before `ready` completion
- regression: no transient incorrect `startable/continue` affordances before authoritative data
- layout stability checks (bounding-box assertions for key cards before/after reconcile)
- custom quest late-arrival behavior under slow storage

If image derivative strategy is implemented:

- verify quest cards request/use derivative path (or expected fallback)
- verify fixed image box prevents cumulative layout shift during image load

### Performance-oriented verification guidance

- Collect traces on low-end device emulation and one real low-end/mobile target where possible.
- Compare before/after milestones:
  - first meaningful quest list paint
  - time to first interactive card click
  - time to full reconciliation complete
- Ensure full-state load path executes fewer clone-heavy operations than baseline.

## 13) Acceptance criteria

1. `/quests` shows meaningful quest-list content before full persisted-state readiness.
2. Initial built-in list render does not depend on eager full quest payload loading.
3. Initial render does not block on full custom quest enumeration.
4. No transient incorrect quest availability/action affordances are shown.
5. If state is uncertain, UI shows neutral/withheld status rather than optimistic status.
6. Post-initial UI enhancements reconcile via non-layout-shifting transitions (no pushdowns).
7. Full-state reconciliation path does strictly less critical-path work than current implementation
   (including removal of repeated clone-heavy per-quest checks).
8. Offline-first behavior remains intact for built-in list data and progress classification.
9. If image optimization is included, list-card images use generated derivative(s) that improve
   perceived performance without manually duplicating many source asset sizes in-repo.
10. Implementation includes robust unit + component + Playwright coverage for correctness,
    reconciliation behavior, and regressions.

## 14) Deferred ideas / non-primary recommendations

- Full quest-list virtualization (defer unless profiling still indicates DOM/render bottlenecks
  after primary architecture changes).
- Multi-breakpoint responsive image system with many sizes.
- Server-side personalized preclassification (conflicts with offline-first/local authority model).

## 15) Open questions

1. Should lightweight snapshot store only completion + current step, or include additional minimal
   fields for nuanced status chips?
2. What is the exact trust policy between snapshot checksum and current in-memory state checksum on
   first mount?
3. Should custom quests always be sectioned separately (e.g., “Custom quests”) to further isolate
   late-arrival merge behavior?
4. Can graph payload serialization be removed from `/quests` initial HTML when graph toggle is off,
   while preserving current visualizer behavior?
5. Which single derivative target size gives best tradeoff for current card CSS (`200x200` desktop,
   responsive mobile) and common device DPR values?

---

## Appendix: concrete code anchors inspected

- `frontend/src/pages/quests/index.astro`
- `frontend/src/pages/quests/svelte/Quests.svelte`
- `frontend/src/pages/quests/svelte/Quest.svelte`
- `frontend/src/components/quests/QuestGraphVisualizerGate.svelte`
- `frontend/src/lib/quests/questGraph.ts`
- `frontend/src/utils/gameState/common.js`
- `frontend/src/utils/gameState.js`
- `frontend/src/utils/customcontent.js`
- `frontend/src/utils/indexeddb.js`
- `frontend/__tests__/Quests.test.js`
- `tests/customQuestLoader.test.ts`
- `tests/offlineQuestCache.test.ts`
- `frontend/e2e/quests.spec.ts`
- `frontend/e2e/page-structure.spec.ts`
- `frontend/e2e/quest-graph-visibility-toggle.spec.ts`
- `frontend/e2e/svelte-component-hydration.spec.ts`
