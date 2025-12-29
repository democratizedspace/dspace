# Quest Dependency Graph Visualizer (v3)

## Context

We want an in-game visualization of all quests and their dependency relationships, rooted at `howtodoquests.json`, to support QA and game balance. The dependency graph is a DAG in the ideal case, but authoring mistakes can create cycles; the tool must detect and surface these issues.

Placement: add this visualizer **between the Active Quests area** (currently unlabeled in UI) and the **Completed Quests** section on `/quests`.

The visualizer must work on:
- Mobile (narrow screens, limited horizontal space)
- Desktop, including ultrawide monitors (wide screens, lots of nodes per level)
- Keyboard-first navigation (arrow keys) + on-screen controls

## Goals

1. **Accurate dependency graph** rooted at `howtodoquests.json`, showing all downstream quests.
2. **Deterministic ordering** of nodes/edges so QA comparisons don’t feel random.
3. **Two complementary views**:
   - **Navigator view**: level-based, pointer-driven, scalable to small screens
   - **Map view**: full interactive DAG visualization (desktop-friendly)
4. **QA diagnostics**:
   - Unreachable quests (not downstream of root)
   - Missing dependency references
   - Cycles (graph is not a DAG)
   - “Multi-parent” nodes highlighted clearly
5. **Fast enough** that adding this does not trash /quests performance.

## Non-goals (for v1)

- Editing quest dependencies in the UI.
- Perfect “minimal edge crossing” for every graph; “good and stable” beats “mathematically optimal.”
- Rendering *every* node on screen at once on mobile.

## Data Model

We represent quests as nodes and `requiresQuests` relationships as directed edges:

- Node: a quest JSON file (canonical key = stable unique string)
- Edge: `A -> B` if quest B lists A in `requiresQuests`

Root:
- `howtodoquests.json` is the single root node for the main progression DAG.

Important: `requiresQuests` entries may be any of:
- a filename (`howtodoquests.json`)
- a relative path under the quests json folder (`welcome/howtodoquests.json`)
- (optionally) a quest internal id field (if present)

We must normalize and resolve these to the canonical key.

### Canonical node key

Use the quest file’s path relative to `frontend/src/pages/quests/json/`, e.g.:
- `welcome/howtodoquests.json`
- `aquaria/log-water-parameters.json`

Store also:
- `basename`: `howtodoquests.json`
- `group`: first folder segment, e.g. `welcome`, `aquaria`, `hydroponics`
- `title`: from quest JSON (fallback to basename)
- `requires`: resolved canonical keys
- `requiredBy`: reverse adjacency list

## Graph Build + Validation

### Build steps

1. Load all quest JSON definitions from `frontend/src/pages/quests/json/**/*.json`.
2. Build a resolver index:
   - `byCanonicalPath[canonicalKey] = node`
   - `byBasename[basename] = [canonicalKey...]` (note: may be ambiguous)
   - `byQuestId[id] = canonicalKey` (if quest JSON has `id`)
3. For each node, resolve `requiresQuests[]`:
   - If entry matches canonicalKey: use it
   - Else if matches a canonicalKey after normalization: use it
   - Else if matches `byQuestId`: use it
   - Else if matches basename uniquely: use it
   - Else mark as **missing** or **ambiguous** dependency
4. Build `requiredBy` reverse edges.
5. Compute downstream set from root via DFS/BFS:
   - `reachableFromRoot`
   - `unreachable` = all - reachableFromRoot
6. Detect cycles on the reachable subgraph:
   - Standard DFS recursion stack
   - Record cycle path(s) as diagnostics
7. Compute a stable “depth” for Navigator view:
   - If no cycles: topological order + `depth[node] = max(depth[parent] + 1)`
   - If cycles exist: still compute a “best effort” depth by ignoring back-edges chosen deterministically (see below), but ALWAYS surface cycle diagnostics.

### Deterministic cycle breaking (for layout only)

If cycles exist, pick a deterministic set of “feedback edges” to ignore for depth/layout:
- For each detected cycle, remove the edge whose `(fromKey + '->' + toKey)` is lexicographically greatest.
This is only for computing depth and/or layout; the UI must still show “Cycle detected” and list the involved quests.

## UI: Two-Mode Visualizer

### Mode A: Navigator (default on mobile)

Purpose: scalable navigation without needing to render the entire DAG at once.

Concepts:
- **Focused node**: a single selected quest.
- **Current shelf**: all quests at the focused node’s computed depth, horizontally scrollable.
- **Parent shelf**: direct parents of the focused node (quests it requires).
- **Child shelf**: direct children of the focused node (quests that require it).

Why shelves instead of “previous/next level”?
Because multi-parent DAGs can have parents many levels above the focused node; showing “depth-1 only” hides real parents.

Layout:
- Column stack:
  1) Parent shelf (horizontal)
  2) Current depth shelf (horizontal, contains the focused node highlighted)
  3) Child shelf (horizontal)

Each shelf:
- Scrollable row with scroll-snap
- Deterministic ordering:
  1) group (folder) asc
  2) title asc
  3) canonicalKey asc

Node card:
- Title (primary)
- Group tag (e.g. “aquaria”)
- Badges:
  - “multi-parent” if requires length > 1
  - “root” for howtodoquests
  - “unreachable” if not in reachableFromRoot (shown in diagnostics view; not in main root flow)
  - optional “completed/unlocked/locked” (if we can read player state)

Interactions:
- ArrowLeft / ArrowRight:
  - Move focus to previous/next node *within the current depth shelf*
  - Auto-scroll focused card into view
- ArrowUp:
  - If focused node has parents: move focus to the first parent (deterministic order)
  - If multiple parents: `Shift+ArrowUp` cycles through parents
- ArrowDown:
  - If focused node has children: move focus to the first child
  - If multiple children: `Shift+ArrowDown` cycles through children
- Enter:
  - “Drill” to children: same as ArrowDown but if multiple children, opens a small chooser overlay
- Escape:
  - Close chooser overlays / clear search
- Ctrl/Cmd+K:
  - Open “Jump to quest” search

On-screen controls:
- A compact control bar pinned to the bottom of the visualizer (NOT the viewport):
  - ◀ ▶ (prev/next in shelf)
  - ▲ (go parent)
  - ▼ (go child)
  - Search icon
  - “Root” button

### Mode B: Map (full DAG)

Purpose: see overall structure, cross-links between quest trees, and “where the spaghetti is.”

Implementation:
- Use Cytoscape.js as the renderer.
- Start with `dagre` layout for hierarchical DAG rendering (smaller + straightforward).
- Provide optional toggle to try ELK layered layout later if needed for complex DAGs.

Rationale:
- Cytoscape supports both dagre and elk layout extensions and is designed for interactive graphs. Dagre is a canonical “hierarchical DAG” layout; ELK layered is a more configurable layered approach. :contentReference[oaicite:2]{index=2}

Map interactions:
- Scroll/pinch to zoom
- Drag to pan
- Click node:
  - Set focused node (syncs Navigator focus)
  - Highlight:
    - direct parents (incoming edges)
    - direct children (outgoing edges)
    - optionally “all ancestors / all descendants” toggle
- Legend / toggles:
  - Show/hide unreachable nodes
  - Show/hide edges
  - Layout: dagre (default) / elk (optional later)

Rendering notes:
- In Svelte, Cytoscape should be dynamically imported inside `onMount()` so it never runs on the server.
- Hydrate the entire visualizer via Astro `client:visible` so it doesn’t load until scrolled into view. :contentReference[oaicite:3]{index=3}

## Astro SSR + Svelte Hydration Integration

- Add an Astro wrapper component inserted into the `/quests` page between Active and Completed sections.
- The wrapper renders:
  - A heading: “Quest Graph (QA)”
  - A short description + warning banner if diagnostics exist
  - The Svelte island: `<QuestGraphVisualizer client:visible />`

Hydration choice:
- Default: `client:visible` (hydrate when scrolled into view)
- Optionally: `client:media="(min-width: 1024px)"` to load Map view only on large screens

Astro supports these hydration directives explicitly. :contentReference[oaicite:4]{index=4}

## Styling

Match existing `/quests` aesthetics:
- Dark background container
- Quest cards with bright accent background and rounded corners
- Selected node:
  - thicker border
  - subtle glow
  - ensure high-contrast text
- Diagnostics:
  - warning panel (cycles, missing deps, unreachable count)
  - clickable list to jump focus to the offending node(s)

CSS approach:
- Prefer existing CSS variables/tokens in the app.
- Avoid hardcoding colors; use `var(--accent)`, `var(--bg)`, etc.
- Provide a minimal set of new classnames scoped to the visualizer.

## Diagnostics Panel (QA Power Tools)

Always compute diagnostics; show them collapsed by default.

Diagnostics to report:
- Missing dependency references:
  - quest X requires “Y” but Y not found
- Ambiguous dependency references:
  - “foo.json” matches multiple canonical keys
- Unreachable quests:
  - quests not downstream from root
- Cycles:
  - list cycle paths (canonical keys + titles)

UX:
- Each diagnostic item is clickable:
  - clicking sets focused node to the relevant quest
- Provide “Copy report” button (plain text JSON) for easy QA notes.

## Performance Plan

- Build graph data once (server-side or build-time) and pass to the Svelte component as a single JSON blob.
- Lazy-hydrate (Astro `client:visible`).
- In Navigator mode, render shelves only (small DOM).
- In Map mode, only initialize Cytoscape when Map tab is opened.
- If ELK is used later, consider a Web Worker for layout.

## Implementation Stages

### Stage 1: Graph builder + JSON export
- Implement `buildQuestGraph()` that returns:
  - nodes (canonicalKey, title, group, requires)
  - edges
  - diagnostics
  - depth map (best effort)
- Add unit tests:
  - missing dependency detection
  - cycle detection
  - deterministic ordering

Acceptance:
- Running a dev script prints diagnostics and counts.

### Stage 2: Navigator view (no Cytoscape yet)
- Svelte component renders shelves + keybinds + on-screen controls
- Jump-to search
- Diagnostics panel with jump links

Acceptance:
- You can traverse parent/child relationships with arrows.
- Root starts at howtodoquests.

### Stage 3: Map view (Cytoscape + dagre)
- Add Cytoscape.js + dagre extension
- Render full DAG, sync selection to Navigator

Acceptance:
- Clicking a node updates Navigator focus.
- Layout stable and legible on desktop.

### Stage 4: QA polish + toggles
- Show unreachable/cycle badges
- Optional highlight of completed/unlocked based on player state (if accessible)

### Stage 5: Optional ELK layout toggle
- Only if dagre is insufficient for readability
- Consider bundle size/perf impact

Note: Cytoscape community guidance suggests starting with dagre for DAGs; ELK can do better on complex graphs but is heavier. :contentReference[oaicite:5]{index=5}

## Proposed Files (adjust to repo conventions)

- `frontend/src/lib/quests/questGraph.ts`
  - graph building + diagnostics + depth
- `frontend/src/components/quests/QuestGraphVisualizer.svelte`
  - tabs: Navigator / Map / Diagnostics
- `frontend/src/components/quests/QuestGraphNavigator.svelte`
- `frontend/src/components/quests/QuestGraphMap.svelte`
- `frontend/src/pages/quests/(wherever page is)/...`
  - insert Astro wrapper between Active and Completed sections
- `docs/qa/v3/quest-dependency-graph-visualizer.md`
  - this design doc

