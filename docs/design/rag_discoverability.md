# DSPACE v3 Design: Discoverability & QA Tooling

**Status:** Draft  
**Audience:** Maintainers + contributors implementing UI + data tooling  
**Scope:** `/docs` full-text search + `/quests` quest dependency graph visualizer (read-only QA tooling)

## Why this exists

DSPACE has two “find the thing” problems:

1) **Docs discoverability:** the `/docs` index can’t surface docs when the search term only appears in the *body* of a doc (e.g., “turbine” not finding a Solar Power doc that mentions it).  
2) **Quest QA & balance:** authors and QA need a way to *see* quest dependencies, verify progression, and detect authoring mistakes (missing deps, unreachable nodes, cycles).

This design covers a pair of features that solve those problems while staying consistent with:
- deterministic outputs (so QA comparisons don’t feel random),
- performance constraints (don’t trash page load / interactivity),
- accessibility (keyboard-first navigation where applicable),
- minimal dependency footprint unless it clearly pays rent.

---

## Shared principles

### Deterministic by default
Any ordering that affects visible results (search results, snippets, node ordering, layout tie-breaks) must be stable across reloads given the same inputs.

### Do heavy work once, then reuse
- Build indices/graphs once per page load (or at build-time), then query in-memory.
- Prefer lazy hydration / dynamic imports for heavyweight client libraries.

### Progressive enhancement
Core pages must remain usable without the enhancement:
- `/docs` should still list docs even if full-text indexing fails.
- `/quests` should still show Active/Completed lists even if the visualizer fails to hydrate.

---

# Part A — `/docs` client-side full-text search

## Problem statement
The `/docs` index currently filters by doc titles and static keywords only. Players cannot find information when the relevant term appears only in the body text. We need **client-side full-text search** over title + body text, with a **contextual snippet**, while preserving existing `has:` operator filtering.  

## Goals
- Queries match **doc titles + body text** by default.
- Preserve `has:` behavior for feature filters.
- Provide a snippet that is:
  - contextual (shows the match in-place),
  - deterministic,
  - updates as the user types,
  - disappears when the input is empty.

## Non-goals
- Server-side search.
- Full-text ranking / BM25 / fuzzy matching (v1 keeps it simple).

## UX specification

### Search scope
- Default queries match doc titles and body text.
- Operators:
  - if a query contains `has:` predicates, **keep existing feature filtering** behavior
  - and **do not show body-text snippets** for those queries.

### Snippets
- Show *one* snippet line under each matched doc link when the query has keywords.
- Snippet shows the **first matching keyword** (deterministic selection) with **up to two words before and after** the match.
- The matched word is bolded.
- Snippet updates as the user types; snippet disappears when input is empty.

## Data + index

### Index construction (in-memory, on `/docs` load)
Build a lightweight search index entry for each doc:
- `title`: existing doc title string
- `bodyText`: doc markdown stripped to plain text
- `features`: existing feature list used by `has:` operator

### Markdown → plain text
A lightweight “stripper” avoids adding parsing dependencies:
- remove fenced code blocks and inline code
- strip markdown links/images but keep their visible text
- remove heading markers, blockquote prefixes, emphasis markers
- remove HTML tags
- collapse whitespace

## Query parsing & matching

### Tokenization
- split query on whitespace
- ignore empty tokens
- lowercase normalize
- separate `has:` operators from “keywords”
- sort keywords alphabetically (for deterministic snippet keyword selection)

### Match rule
A doc matches if:
- **all keywords** appear in *any* searchable value (`title`, existing doc keywords if present, `bodyText`), AND
- **all `has:` operators** exist in the doc’s `features`.

## Snippet extraction (deterministic)
Given a doc `bodyText` and keyword list:
1) Choose snippet keyword = first (alphabetically) keyword that appears in `bodyText`.
2) Tokenize `bodyText` by whitespace into “word tokens”, but only keep tokens whose stripped core has at least one letter/number.
   - stripping means remove leading/trailing non-alphanumeric characters for matching
   - render original token so punctuation remains visible (e.g., `turbine.`)
3) Find the **first** occurrence (left-to-right) of that keyword in the filtered word tokens.
4) Extract up to **two** tokens before and after the match.
5) Render snippet with the matched word bolded.

### Pseudocode (sketch)
~~~text
keywords = sortAlpha(parseKeywords(query))
if keywords empty: no snippet

k = first keyword where bodyLower contains k
words = filterTokens(bodyText)
i = first index where normalize(words[i]) contains k
snippetTokens = words[max(0,i-2) : min(len, i+3)]
render snippetTokens with words[i] bolded
~~~

## Performance considerations
- Index built once per `/docs` page load from local markdown content.
- Search is in-memory across the docs list size (expected small-to-moderate).
- String normalization and keyword sorting are linear in query/doc size.

## Test plan
- Unit tests:
  - query parsing (`has:` extraction + keyword normalization)
  - deterministic keyword selection
  - snippet extraction (punctuation handling, +/-2 window)
- E2E test on `/docs`:
  - term found only in body text yields a result + snippet
  - clearing input removes snippets

---

# Part B — `/quests` Quest Dependency Graph Visualizer (v3)

## Context
We want an in-game visualization of all quests and their dependency relationships, rooted at `howtodoquests.json`, to support QA and game balance. The dependency graph is ideally a DAG, but authoring mistakes can create cycles; the tool must detect and surface these issues.

**Placement:** insert the visualizer **between Active Quests** and **Completed Quests** on `/quests`.

**Platforms:** must work on mobile (narrow) and desktop (including ultrawide), with keyboard-first navigation plus on-screen controls.

## Goals
1) Accurate dependency graph rooted at `howtodoquests.json`, showing all downstream quests.
2) Deterministic ordering of nodes/edges for stable QA comparisons.
3) Two complementary views:
   - **Navigator view** (level-based, scalable to small screens)
   - **Map view** (full interactive graph, desktop-friendly)
4) QA diagnostics:
   - unreachable quests
   - missing dependency references
   - cycles
   - multi-parent nodes clearly highlighted
5) Performance: do not meaningfully degrade `/quests`.

## Non-goals (v1)
- Editing quest dependencies in the UI.
- Perfect “minimal edge crossing” layouts everywhere.
- Rendering every node at once on mobile.

## Data model
- Node: quest JSON file (stable canonical key)
- Edge: `A -> B` if quest `B.requiresQuests` includes `A`
- Root: `howtodoquests.json`

### Canonical node key
Canonical key = quest file path relative to `frontend/src/pages/quests/json/`, e.g.:
- `welcome/howtodoquests.json`
- `aquaria/log-water-parameters.json`

Store per node:
- `canonicalKey`
- `basename`
- `group` (first folder segment)
- `title` (quest title, fallback basename)
- `requires` (resolved canonical keys)
- `requiredBy` (reverse edges)

## Graph build + validation

### Inputs
Load all quest JSON definitions from:
- `frontend/src/pages/quests/json/**/*.json`

### Resolver indices
Build lookup maps:
- `byCanonicalPath[canonicalKey] -> node`
- `byBasename[basename] -> [canonicalKey...]` (can be ambiguous)
- `byQuestId[id] -> canonicalKey` (if quest JSON has `id`)

### Resolving `requiresQuests[]`
Each `requiresQuests` entry may be:
- a filename (`howtodoquests.json`)
- a relative path (`welcome/howtodoquests.json`)
- optionally a quest internal `id`

Resolution order:
1) exact canonicalKey match
2) canonicalKey match after normalization
3) quest id match
4) basename match *only if unique*
5) else: mark dependency as **missing** or **ambiguous**

### Reachability + diagnostics
- Compute `reachableFromRoot` via DFS/BFS from root.
- `unreachable = allNodes - reachableFromRoot`
- Detect cycles on reachable subgraph using DFS recursion stack.
- Record cycle paths for diagnostics output.

### Stable depth for Navigator view
If no cycles:
- topological approach with `depth[node] = max(depth[parent] + 1)`.

If cycles exist:
- compute “best effort” depths by **ignoring deterministic feedback edges** for layout purposes only, but always surface cycle diagnostics.

#### Deterministic cycle breaking (layout only)
For each detected cycle, ignore the edge with lexicographically greatest `(fromKey + '->' + toKey)` when computing depth/layout.

## UI: two-mode visualizer

### Mode A — Navigator (default on mobile)
**Purpose:** scalable exploration without rendering the entire graph.

Core concepts:
- focused node
- parent shelf (direct requires)
- current depth shelf (all quests at focused depth)
- child shelf (direct requiredBy)

Why shelves?
Multi-parent graphs can have parents far above `depth-1`; “depth-1 only” hides real parents.

Shelf ordering (deterministic):
1) group asc
2) title asc
3) canonicalKey asc

Node card:
- title
- group tag
- badges:
  - `multi-parent` if `requires.length > 1`
  - `root` for `howtodoquests.json`
  - optionally: completed/unlocked/locked if player state is accessible

Keyboard navigation:
- ArrowLeft/ArrowRight: move within current depth shelf; scroll-snap into view
- ArrowUp: focus first parent; `Shift+ArrowUp` cycles parents
- ArrowDown: focus first child; `Shift+ArrowDown` cycles children
- Enter: drill to child; if multiple, open chooser overlay
- Escape: close overlays / clear search
- Ctrl/Cmd+K: open “Jump to quest” search

On-screen controls:
Compact control bar pinned to the bottom of the visualizer container (not viewport):
- ◀ ▶ ▲ ▼
- Search
- Root button

### Mode B — Map (full DAG)
**Purpose:** see the whole structure and cross-links, find “spaghetti.”

Renderer:
- Cytoscape.js
- start with `dagre` layout
- optional later: ELK layered layout toggle if needed

Interactions:
- zoom (scroll/pinch), pan (drag)
- click node sets focused node and highlights direct parents/children
- toggles:
  - show/hide unreachable
  - show/hide edges
  - optional: ancestors/descendants highlighting

SSR/hydration constraints:
- dynamically import Cytoscape inside `onMount()` (never run on server)
- hydrate via Astro `client:visible` so it loads only when scrolled into view
- initialize Cytoscape only when Map tab is opened

## Diagnostics panel (QA power tools)
Compute diagnostics always; show collapsed by default.

Report:
- missing dependency references
- ambiguous dependency references
- unreachable quests
- cycles (paths with canonical keys + titles)

UX:
- each diagnostic item clickable → jumps focus to relevant node
- “Copy report” button outputs plain text JSON

## Performance plan
- Build graph once (server-side or build-time) and pass to Svelte as one JSON blob.
- Lazy hydrate (`client:visible`).
- Navigator renders small shelves only.
- Map initializes Cytoscape only when Map tab opens.
- If ELK later, consider a Web Worker for layout.

## Implementation stages
1) Graph builder + JSON export (+ unit tests)
2) Navigator view (+ keybinds, search, diagnostics)
3) Map view (Cytoscape + dagre, selection sync)
4) QA polish (badges, optional player-state overlays)
5) Optional ELK toggle (only if dagre insufficient)

## Proposed files (adjust to repo conventions)
- `frontend/src/lib/quests/questGraph.ts`
- `frontend/src/components/quests/QuestGraphVisualizer.svelte`
- `frontend/src/components/quests/QuestGraphNavigator.svelte`
- `frontend/src/components/quests/QuestGraphMap.svelte`
- Astro wrapper inserted into `/quests` between Active and Completed

---

## Folder index (`docs/design/`)
This folder currently contains design notes for:
- `docs-full-text-search.md` — `/docs` full-text search + snippet UX + algorithm
- `quest_depency_graph_visualizer.md` — `/quests` quest dependency graph visualizer (Navigator + Map + diagnostics)

(Consider renaming `quest_depency_graph_visualizer.md` → `quest_dependency_graph_visualizer.md` for spelling consistency in a future tidy-up.)

---
