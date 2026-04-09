# `/processes` performance and presentation design for `v3.0.1`

## Problem statement

The `/processes` page currently pays detail-view costs for every list row and withholds all list
content until client-side mount, creating avoidable startup latency, hydration work, and dense-card
UI overhead on a route that should be cheap to scan. `v3.0.1` needs a narrow, low-risk plan that
improves first render and list clarity without introducing new gameplay semantics or broad
architecture changes.

## Current-state analysis (with code anchors)

### Route composition and hydration

- `frontend/src/pages/processes/index.astro` renders `<Processes client:load />`, so the route
  waits for hydration before meaningful list content appears (no SSR list HTML). This is a
  deliberate pattern today, but it raises TTI risk on slower devices.
- In `Processes.svelte`, rows are rendered only when `mounted` becomes `true`; before that, the
  page shows `Loading processes...`.

### List row composition reuses detail-page component

- `Processes.svelte` renders `ProcessView` for every entry in `allProcesses`.
- `ProcessView.svelte` is detail-oriented: it resolves built-in/custom data, computes purchasable
  requirements, and renders a route-level action (`Buy required items`) with toast behavior.
- `ProcessView.svelte` always renders `<Process .../>`, and `Process.svelte` includes
  process-lifecycle actions (`Start`, `Pause`, `Resume`, `Collect`), animated feedback, periodic
  polling, and state reconciliation.

### Per-row runtime work in `Process.svelte`

For each mounted process row, `Process.svelte` currently does substantial live work:

- starts a `setInterval(updateState, 100)` loop on mount,
- starts a second `setInterval(..., 3000)` refresh loop,
- runs `beforeUpdate(updateState)`,
- subscribes to QA cheat stores,
- resolves process metadata (built-in lookup and optional custom lookup),
- may load requirement item maps and image metadata for requirements,
- runs process-state and requirement calculations to drive interactive controls.

This architecture is appropriate for detail pages, but expensive for a long list.

### Data payload shape

- `frontend/src/generated/processes.json` is currently ~315 KB raw JSON and 11,367 lines in this
  checkout (`process_count=311`, measured locally).
- `/processes` imports the full generated JSON in `Processes.svelte` and the full JSON again in
  `ProcessView.svelte` and `Process.svelte`.
- `Processes.svelte` also loads custom processes in `onMount()` via
  `db.list(ENTITY_TYPES.PROCESS)` from `customcontent.js`, then concatenates built-in + custom.

### Presentation rough edges on dense list

- Each row visually appears as a heavy detail card with full controls, making scanning difficult on
  large lists.
- Multiple action areas per row (`Start`, `Cancel/Pause/Resume`, `Buy required items`, etc.) add
  cognitive load where list intent is usually “find and open process”.
- A full-screen loading state appears before any list content because rendering is gated on mount.

## Observed facts vs informed hypotheses

### Measured/confirmed from repository inspection

1. `/processes` uses `client:load` and mounted-gated rendering before list display.
2. List rows mount `ProcessView` (detail component) for every process.
3. `Process.svelte` installs per-instance timers and update hooks intended for live process control.
4. `processes.json` is non-trivial in size (315,281 bytes; 311 entries in this checkout).

### Informed hypotheses (not benchmark claims)

1. Mounting full detail components for all rows likely dominates hydration and main-thread work on
   slower devices.
2. Per-row intervals likely scale poorly as process count grows and can create unnecessary periodic
   updates when most rows are idle/offscreen.
3. Dense action-heavy cards likely reduce perceived responsiveness and scan clarity versus a compact
   summary list.

No runtime performance numbers are claimed here because no browser profiling was run in this PR.

## Goals

1. Reduce `/processes` first meaningful render cost and hydration burden for `v3.0.1`.
2. Keep gameplay behavior unchanged (same process semantics, same detail-route actions).
3. Improve list scan clarity with minor presentation cleanup aligned with performance goals.
4. Preserve offline-first behavior and SSR safety patterns.
5. Keep risk low and patch-release appropriate.

## Non-goals

- No new filtering/search/pagination feature set.
- No process schema migrations unless absolutely necessary (none currently required).
- No broad rewrite of process runtime/state architecture.
- No redesign of process gameplay loops or economics.
- No speculative large caching system.

## Constraints and risks

### Constraints

- `v3.0.1` is patch scope: bugfixes/small improvements only.
- Must preserve compatibility with built-in + custom processes.
- Must remain SSR-safe (browser APIs only in browser-safe paths).
- Must avoid regressions in custom-content flow and core route navigation.

### Risks

- Changing list composition could regress controls expected by current e2e/unit coverage.
- Introducing a new summary data shape could drift from canonical process definitions if not
  generated deterministically.
- Splitting list vs detail responsibilities may surface assumptions currently embedded in
  `ProcessView`/`Process`.

## Candidate approaches considered

| Approach | What changes | Expected impact | Risk for `v3.0.1` | Verdict |
| --- | --- | --- | --- | --- |
| A. Keep list as-is, micro-optimize CSS only | Styling-only cleanup | Low | Low | Insufficient alone |
| B. Keep `ProcessView` rows, add virtualization | Window long list | Medium-high at scale | Medium (behavioral/test complexity) | Defer |
| C. Lightweight list row component + detail route keeps full `ProcessView` | Render summary rows on `/processes`; keep full controls on `/processes/:id` | High on hydration/render cost, medium UX clarity gains | Low-medium | **Recommended** |
| D. Add generated process list manifest (summary fields only) | Reduce list payload and row computations | Medium-high | Medium (build + wiring changes) | Recommended if small slice |
| E. Staged custom-process merge (built-ins first, custom async) | Faster first visible content | Medium | Low | Recommended |
| F. Move “Buy required items” and similar purchase logic to detail-only | Reduces per-row logic/actions | Medium | Low | Recommended |

## Recommended approach (`v3.0.1`)

Adopt **C + E** as must-have, with **D + F** as tightly scoped additions if they fit patch budget.

### 1) Must-have / safest patch-release changes

1. **Introduce a dedicated lightweight list row component** for `/processes`.
   - Include only title, duration, compact requirement/create summaries, and a single primary
     navigation affordance to detail page.
   - Do **not** mount full lifecycle controls for each row.
2. **Keep `ProcessView` as detail-route component** (`/processes/[processId]`) for full interactive
   controls.
3. **Render built-in list content immediately after hydration without waiting on custom fetch**.
   - Keep custom processes as asynchronous merge after initial list render.
4. **Remove list-page “Buy required items” control** from row rendering path.
   - Keep it on detail route only to preserve functionality while reducing list complexity.

### 2) Nice-to-have but patch-plausible

1. **Add a generated process-list manifest** containing list-only fields (id/title/duration + small
   summaries) and consume it on `/processes`.
2. **Avoid repeated full-array lookups** on list path by pre-indexing process metadata where needed
   (e.g., map by id once per page load).
3. **Minor visual density pass** on list cards: tighter spacing, reduced control chrome, consistent
   row height cues to improve scan speed and lower layout work.

### 3) Explicitly deferred to `v3.1+`

1. Full virtualization/windowing with complex interaction retention.
2. New feature-scope list UX (search/filter/pagination controls).
3. Larger architecture changes to process runtime polling model across the app.
4. Advanced image/payload pipeline changes beyond small list-manifest work.

## Why this recommendation fits `v3.0.1`

- It targets a clear bottleneck with minimal semantics risk: list page currently mounts detail
  machinery for every row.
- It preserves existing process behavior by keeping interactive logic on detail routes.
- It limits blast radius to list presentation/composition and optional generated summary wiring.
- It aligns with patch-release scope in `docs/qa/v3.0.1.md` (small improvements, low regression
  risk, clear validation gates).

## Rollout and verification plan

### Pre-merge implementation checks (for future implementation PRs)

1. `npm run lint`
2. `npm run type-check`
3. `npm run link-check`
4. Targeted unit tests for new list-row component behavior.
5. Existing process e2e smoke paths (`/processes`, `/processes/:processId`, manage/create/edit)
   must remain green.

### Patch-line launch gate additions (suggested)

For implementation PR(s), add lightweight instrumentation on `/processes` similar to the `/quests`
TTI gate style, but scoped to this route:

- mark list-hydration-start,
- mark list-visible (built-ins),
- mark custom-merge-complete (optional),
- compare baseline vs optimized candidate on same staging profile.

(Instrumentation and measurement are intentionally out of scope for this design-only PR.)

## Acceptance criteria (for future implementation)

### Functional parity

- Detail route (`/processes/:processId`) still supports full lifecycle controls and required-item
  purchase behavior.
- Built-in and custom processes still appear in `/processes` list.
- No process state semantics change.

### Performance/presentation outcomes

- `/processes` list no longer mounts full `ProcessView` + full `Process` lifecycle controls for
  every row.
- Initial list content appears without waiting for custom process fetch completion.
- List rows are visually compact and primarily navigational, improving scan clarity.

### Safety and quality gates

- SSR safety preserved (no unguarded browser API access introduced).
- Existing automated checks in patch checklist pass.
- Route and link integrity unchanged.

## Recommended implementation slices (2–4 PR-sized chunks)

1. **Slice 1: list/detail separation (must-have)**
   - Add lightweight `/processes` row component and wire `Processes.svelte` to use it.
   - Keep detail page on `ProcessView` unchanged.

2. **Slice 2: staged data merge (must-have)**
   - Render built-ins first; merge custom processes asynchronously after first list paint.
   - Add tests for ordering/merge correctness.

3. **Slice 3: list-manifest optimization (nice-to-have)**
   - Generate and consume process summary manifest for `/processes`.
   - Keep canonical generated process registry as source of truth.

4. **Slice 4: visual density cleanup (nice-to-have)**
   - Tighten row layout and action hierarchy for scan clarity.
   - No new user-facing features.

## Open questions and deferred follow-ups

1. Should list rows show any direct action besides navigation (for example, `Start`) once compact
   mode is introduced, or should all mutation actions be detail-only for consistency?
   - **Proposed for v3.0.1:** detail-only mutations.
2. Do we need manifest generation in `v3.0.1`, or is component separation alone enough for patch
   impact?
   - **Proposed:** land separation first; add manifest only if diff stays small and testable.
3. Should process runtime polling intervals be centralized/shared in `v3.1+` to reduce global timer
   pressure?
   - **Deferred:** yes, evaluate as broader runtime architecture work in `v3.1+`.

## References (code/document anchors)

- `frontend/src/pages/processes/index.astro`
- `frontend/src/pages/processes/Processes.svelte`
- `frontend/src/pages/process/[slug]/ProcessView.svelte`
- `frontend/src/components/svelte/Process.svelte`
- `frontend/src/generated/processes.json`
- `frontend/src/utils/customcontent.js`
- `docs/qa/v3.0.1.md`
- `docs/design/quests-tti-optimization.md`
