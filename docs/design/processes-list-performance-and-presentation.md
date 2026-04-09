# `/processes` list performance and presentation design (`v3.0.1`)

## Problem statement

The current `/processes` route appears to render a detail-grade interactive process experience for
_every_ list row, then waits for client hydration before showing it. This likely inflates time to
meaningful content, increases main-thread/JS work, and makes dense lists harder to scan.

For `v3.0.1`, we need a narrowly scoped, low-risk patch plan that improves:

- first meaningful list paint,
- hydration and ongoing render cost,
- perceived responsiveness,
- visual clarity of dense process lists,

without adding new product functionality or changing gameplay semantics.

---

## Current-state analysis (with code anchors)

### Route and hydration model

- `/processes` route is Astro SSR but mounts a single client-loaded Svelte component:
  `frontend/src/pages/processes/index.astro` renders `<Processes client:load />`.
- This means list content is gated on client-side load/hydration rather than having SSR-visible row
  content by default.

### List implementation currently mounts detail view per row

- `frontend/src/pages/processes/Processes.svelte` imports built-in `processes.json`, then after
  mount reads custom processes from IndexedDB wrapper `db.list(ENTITY_TYPES.PROCESS)`.
- It merges built-in + custom process arrays and renders:
  - one `.process-row` per process,
  - and for each row mounts `ProcessView` using `slug` only (`<ProcessView slug={processId} />`).
- Therefore the list view does _not_ pass already-available process objects into row rendering.

### `ProcessView` does detail-page responsibilities even when used in list

`frontend/src/pages/process/[slug]/ProcessView.svelte` is oriented around process detail actions:

- resolves built-in/custom process by `slug`,
- computes `canBuyRequired`, `disableBuy`, and item prices,
- performs inventory mutation flow (`buyRequired`) and toast UI,
- conditionally renders **Buy required items** CTA,
- always mounts `<Process ... processId={slug} ... />`.

This is reasonable for `/processes/:processId` detail route, but expensive/noisy when repeated for
hundreds of list rows.

### `Process` component is high-interactivity and timer-heavy

`frontend/src/components/svelte/Process.svelte` includes runtime behavior meant for active process
interaction:

- lifecycle controls (start/cancel/pause/resume/collect/instant finish),
- multiple timers/intervals:
  - `updateState` every `100ms`,
  - state sync every `3000ms`,
- reactive `beforeUpdate(updateState)` calls,
- per-instance runtime create-item computation,
- requirement metadata loading via `getItemMap`,
- requirement pulse animation logic and scroll-into-view logic,
- nested child components (`CompactItemList`, `ProgressBar`, `RemainingTime`, multiple `Chip`s).

On a full `/processes` list, this can multiply into a large number of mounted reactive trees and
intervals.

### `CompactItemList` also starts per-instance polling

`frontend/src/components/svelte/CompactItemList.svelte`:

- starts a `setInterval(..., 1000)` to refresh counts,
- loads item metadata (`getItemMap`) and image/object URL lifecycle,
- renders images and count placeholders per item entry.

Each `Process` can mount this up to three times (requires/consumes/creates), further amplifying list
cost.

### Data volume context (measured)

Measured in-repo on 2026-04-09:

- `frontend/src/generated/processes.json` contains **311** processes.
- File size is **315,281 bytes** (raw JSON on disk).
- **166** processes include an `image` field.

These are factual measurements from a local script. They are not runtime benchmarks.

### Related custom-content and management paths

- `frontend/src/utils/customcontent.js` `db.list(ENTITY_TYPES.PROCESS)` returns persisted custom
  processes + fallback store records.
- `/processes/manage` currently mounts `Process` for each row too
  (`frontend/src/pages/processes/svelte/ManageProcesses.svelte`), indicating list/detail concerns
  are blurred in multiple surfaces.
- `ProcessPreview.svelte` already exists as a lightweight summary-ish component, which is a useful
  precedent for low-risk list simplification.

---

## Observed bottlenecks and rough edges

> **Legend:**
>
> - **Measured fact:** directly observed in code or command output.
> - **Informed hypothesis:** likely impact inferred from architecture; needs instrumentation to
>   quantify.

### Performance bottlenecks

1. **List rows instantiate detail/runtime component trees** (**measured fact**).
   - `/processes` renders `ProcessView` per row, which renders `Process` per row.

2. **Timer fan-out across many mounted rows** (**measured fact + informed hypothesis**).
   - `100ms` and `3000ms` intervals in each `Process` instance likely create unnecessary background
     CPU wakeups for offscreen/inactive rows.

3. **Per-row requirement and item metadata work** (**measured fact + informed hypothesis**).
   - Requirement checks, `getItemMap` loads, and count polling occur even when the user may just be
     scanning titles.

4. **Hydration-gated list visibility** (**measured fact**).
   - `Processes.svelte` uses `mounted` gating and shows only loading state pre-mount.

5. **Potential duplicate lookup work** (**measured fact + informed hypothesis**).
   - `Processes.svelte` has process objects but still keys rows by id and asks `ProcessView` to
     resolve by slug again.

### Presentation / UX rough edges (list-relevant)

1. **Oversized per-row UI density** (**measured fact**).
   - List rows currently include full action controls and requirement/consume/create blocks, making
     scanability poor for large catalogs.

2. **List-level CTA duplication/noise** (**measured fact**).
   - “Buy required items” appears in each row via `ProcessView`; this is detail-oriented and can
     overwhelm list context.

3. **Late content reveal from loading gate** (**measured fact**).
   - Users initially see “Loading processes...” rather than immediate SSR list scaffold.

4. **Fixed toast behavior from row context** (**measured fact + informed hypothesis**).
   - Toast is fixed-position and row-triggered; repeated row actions on dense lists can feel noisy
     and spatially disconnected.

---

## Goals

1. Reduce `/processes` initial and ongoing list-page rendering cost with minimal-risk changes.
2. Improve perceived responsiveness (faster meaningful content and less reactive churn).
3. Improve visual clarity and scanning for dense process catalogs.
4. Preserve current gameplay semantics and detail-page behavior.
5. Keep offline-first and SSR-safe guarantees.

## Non-goals

- New search/filter/sort/pagination product features.
- Process schema migrations (unless absolutely required; currently not required).
- Rewriting process runtime engine or game-state model.
- Broad architecture rewrite of all process-related pages.
- Changing process semantics (requirements, consume/create, timing, buy behavior rules).

---

## Constraints and risks

### Constraints

- Patch line `v3.0.1`: bugfix/small-improvement scope.
- Design-only in this PR; no production behavior changes.
- Must remain compatible with custom process loading (`customcontent.js`).
- SSR safety required (no unguarded browser API access in server path).

### Risks

1. **Behavior drift risk** if list simplification accidentally changes actionable controls users
   currently rely on.
2. **Custom-process compatibility risk** if summary shape handling assumes built-in-only fields.
3. **State freshness risk** if lightweight list rendering and detail rendering diverge.
4. **QA scope creep risk** if plan tries to include featureful discoverability upgrades.

---

## Candidate approaches considered

### A) Keep current architecture, tune micro-optimizations only

Examples:

- minor memoization,
- throttle intervals,
- small CSS cleanup.

**Pros**

- Lowest code movement.

**Cons**

- Does not address core issue (detail components mounted for every list row).
- Likely insufficient impact for large list sizes.

### B) Introduce lightweight list row component for `/processes`

Create a dedicated row component that renders summary data only (title, duration, compact
requirements snapshot, link to detail page), with no process runtime controls/timers.

**Pros**

- Directly removes biggest likely cost multipliers.
- Clear separation of list vs detail responsibilities.
- High-confidence patch-safe change if detail route remains unchanged.

**Cons**

- Requires deciding which controls are list-appropriate vs detail-only.

### C) Keep `ProcessView` on list but add lazy/expand-on-demand mounting

Render lightweight shell rows first; mount `ProcessView` only when expanded or interacted with.

**Pros**

- Reduces initial mount cost while preserving existing detail component.

**Cons**

- More state choreography and edge-case complexity for patch release.
- Risk of interaction inconsistency versus dedicated detail page.

### D) Add build-time process list manifest + staged custom merge

Generate/import minimal built-in process summary artifact for `/processes` list route and merge
custom processes after initial paint.

**Pros**

- Reduces payload and row prep work for list path.
- Mirrors successful `/quests` optimization pattern.

**Cons**

- Adds build artifact pipeline touchpoints; still moderate complexity.
- Must ensure manifest and canonical process data stay in sync.

### E) Defer broader interaction redesign (search/filter/pagination/virtualization)

**Pros**

- Could provide larger long-term scalability.

**Cons**

- Feature expansion and higher risk; not patch-scope appropriate.

---

## Recommended approach for `v3.0.1`

### Summary

Adopt **B (must-have core)** + **small presentation cleanup (must-have)**. Treat manifest/build-artifact
work as optional and only pull it into implementation if it is clearly low-risk and needed after core
changes are validated.

### Must-have / safest patch-release changes

1. **Split list and detail responsibilities**
   - Introduce a lightweight list-row component for `/processes`.
   - `/processes` must not mount `ProcessView`/`Process` for every row by default.
   - Row should show only summary fields and a clear link/button to detail route
     (`/processes/:processId`).

2. **Move detail-only actions off list critical path**
   - Keep “Buy required items” and runtime process controls on detail route.
   - List page remains browsable/scannable and links to detail for action-heavy operations.

3. **Render meaningful list content immediately (no full-page loading gate)**
   - For `v3.0.1`, built-in rows should come from an **Astro SSR-rendered list scaffold on the
     route**, rather than relying on `<Processes client:load />` alone for first paint.
   - Client code can then enhance the list and merge custom processes asynchronously without
     blocking initial built-in row visibility.

4. **Basic density cleanup for readability**
   - Reduce row chrome and vertical bulk.
   - Keep required metadata concise (title, duration, compact IO counts, custom badge if needed).

### Nice-to-have only (optional for implementation PRs)

1. **Lightweight built-in list manifest (only if clearly needed)**
   - Summary-only shape for list route to reduce payload/prop surface.
   - Skip for `v3.0.1` if the core list-row split + async custom merge already achieves acceptable
     behavior and keeps patch risk lower.

2. **Staged hydration for secondary row details**
   - Keep core row text interactive quickly; defer non-critical extras where possible.

3. **Simple visual stability improvements**
   - Reserve row structure height to reduce perceived jump when custom rows merge.

### Explicit deferrals to `v3.1+`

1. List virtualization/windowing.
2. New search/filter/pagination UX.
3. Cross-route process data architecture overhaul.
4. Advanced caching/indexing systems.
5. Any gameplay semantic changes around requirement purchasing or process controls.

### User-visible contract after implementation

1. `/processes` is summary-first and primarily navigational.
2. `/processes/:processId` retains full runtime controls, including “Buy required items.”
3. No gameplay semantics change; this is presentation/performance shaping only.

---

## Why this recommendation fits `v3.0.1`

- Targets the highest-confidence bottleneck: heavy detail component instantiation in list context.
- Preserves existing detail behavior and game logic (lower regression risk).
- Improves both performance and visual clarity without introducing new user-facing capabilities.
- Aligns with patch-release guidance in `docs/qa/v3.0.1.md` (small improvements, no broad feature
  changes).

---

## Rollout and verification plan

### Implementation slices (2–4 minimal PRs)

1. **Slice 1: list/detail separation (core)**
   - Add lightweight `ProcessListRow` (or equivalent) and migrate `/processes` to it.
   - Keep `/processes/:processId` using existing detail stack.

2. **Slice 2: visibility + merge path cleanup**
   - Remove full-page mounted loading gate.
   - Render built-ins immediately; merge custom rows asynchronously.

3. **Slice 3: optional manifest + polish**
   - Add minimal built-in process list manifest if low-risk.
   - Apply row density/layout polish and ensure no noticeable shifts.

### Verification guidance (anchored to `docs/qa/v3.0.1.md`)

- Required baseline checks (for implementation PRs):
  - `npm run lint`
  - `npm run type-check`
  - `npm run link-check`
  - `node run-tests.js` (or documented constrained equivalent per QA checklist)
- Add/adjust tests around:
  - `/processes` list rendering uses lightweight rows (not full `ProcessView` per row),
  - list still includes action buttons (`Create`, `Manage`) and links,
  - custom process merge behavior remains functional,
  - detail route retains buy/start/cancel/collect semantics.
- Optional follow-up for implementation PRs (not required for this design PR):
  - add minimal User Timing marks for `/processes` list-visible and hydration-complete checkpoints,
    then decide if a formal `3.2 /processes TTI performance launch gate` should be added to
    `docs/qa/v3.0.1.md`.

### Launch gates for `v3.0.1`

1. Follow `docs/qa/v3.0.1.md` required checks as the primary go/no-go gate for implementation PRs.
2. Patch-scope gate: no new feature semantics.
3. Functional parity gate:
   - `/processes` remains navigable and shows built-in + custom processes.
   - `/processes/:processId` retains current interactive behavior.
4. Stability gate: no SSR/browser API regressions.

### Regression-risk checklist (implementation PRs)

- `frontend/src/pages/processes/Processes.svelte`: list row wiring, mounted/loading behavior, and
  built-in/custom merge ordering.
- `frontend/src/pages/process/[slug]/ProcessView.svelte`: detail-only controls and “Buy required
  items” remain on detail route.
- `frontend/src/components/svelte/Process.svelte`: runtime controls/interval behavior unchanged for
  detail route usage.
- `frontend/src/utils/customcontent.js` (custom-process merge path): `db.list(ENTITY_TYPES.PROCESS)`
  behavior remains compatible with list rendering.

---

## Acceptance criteria

1. `/processes` no longer mounts detail-grade `ProcessView` for every row.
2. `/processes` shows meaningful built-in list content without waiting for full mounted loading
   state.
3. Custom processes still appear and remain operable via detail pages.
4. No gameplay semantic changes in process runtime actions.
5. Existing core checks and relevant E2E tests pass.
6. Documented deferrals remain out of `v3.0.1` implementation scope.

---

## Open questions and deferred follow-ups

### Open questions (to answer during implementation PR planning)

1. Should list rows include any direct action CTA beyond “View details,” or be strictly navigational
   in `v3.0.1`?
2. Should the lightweight list row show mini IO details (counts only) or only title+duration?
3. Is a generated manifest worth the build complexity for this patch, or is a runtime summary map of
   imported JSON sufficient?

### Explicitly deferred follow-ups (`v3.1+`)

1. Full discoverability improvements (search/filter/sort/pagination).
2. Virtualized lists for very large process catalogs.
3. Shared universal process card architecture across `/processes`, `/processes/manage`, and other
   surfaces.
4. Deeper telemetry/perf dashboards for long-term route performance tracking.

---

## Appendix: inspected files and artifacts

Primary code/files reviewed for this design:

- `frontend/src/pages/processes/index.astro`
- `frontend/src/pages/processes/Processes.svelte`
- `frontend/src/pages/process/[slug]/ProcessView.svelte`
- `frontend/src/components/svelte/Process.svelte`
- `frontend/src/components/svelte/CompactItemList.svelte`
- `frontend/src/components/svelte/ProcessPreview.svelte`
- `frontend/src/pages/processes/svelte/ManageProcesses.svelte`
- `frontend/src/generated/processes.json`
- `frontend/src/utils/customcontent.js`
- `frontend/src/utils/itemResolver.js`
- `docs/design/quests-tti-optimization.md`
- `docs/qa/v3.0.1.md`

Validation command used in this design PR:

- `node scripts/link-check.mjs`
