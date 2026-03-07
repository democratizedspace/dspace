# Quest process-gate simulation design

## Problem

Some quests can be completed immediately because prerequisite progression can leave the player with
all required items for `goto`/`finish` branches, allowing them to skip process execution inside the
quest itself.

We need a test that computes realistic inventory at quest entry and fails when a quest with
inventory-producing process options is completable without running any process in that quest.

## Scope

- Quest JSON source: `frontend/src/pages/quests/json/**/*.json`
- Process definitions: `frontend/src/generated/processes.json`
- Validation target: quests that define at least one process option whose execution creates inventory
  (`createItems` from process or option-level `grantsItems`).

## Data model

- **Inventory**: `Map<itemId, count>` using numeric counts (integer or decimal).
- **Quest dependency graph**: `requiresQuests` edges.
- **Quest simulation semantics**:
  - process options can run when their `requiresItems` and process requirements are met;
  - process effects apply via `consumeItems` + `createItems` + option `grantsItems`;
  - quest rewards are added after simulation;
  - non-navigation options can add `grantsItems`.

## Algorithm

### 1. Build prerequisite inventory for a target quest `q`

1. Topologically collect recursive dependencies from `q.requiresQuests`.
2. Simulate each dependency quest in order and accumulate inventory.
3. Expand to additional unlocked quests whose prerequisites are now satisfied, excluding quests that
   transitively depend on `q` (to avoid forward leakage from future progression).
4. Re-simulate unlocked quests until no new quest is unlocked.

This creates an inventory estimate for "what player likely has by the time `q` is attempted" while
remaining acyclic and deterministic.

### 2. Zero-process reachability check

- Traverse quest dialogue graph from `start`, using only `goto`/`finish` options and enforcing
  `requiresItems` against the simulated entry inventory.
- If any `finish` is reachable, the quest is completable with zero process runs and fails.

## Recursive vs dynamic programming analysis

### Recursive baseline

A naive recursive simulation per quest repeatedly descends prerequisite trees and recomputes shared
subgraphs.

- Time: worst-case `O(Q * (Q + E) * S)` with repeated subtree work.
- Space: call stack `O(H)` where `H` is max dependency depth, plus inventory/state storage.

### DP / memoized approach (chosen)

We memoize transitive dependencies and reuse simulated results for shared prerequisite closures while
still preserving deterministic ordering.

- Time: roughly `O(Q + E + Q * (D + U + T))`
  - `Q`: quests
  - `E`: dependency edges
  - `D`: per-quest dependency expansion
  - `U`: unlocked-quest sweep
  - `T`: dialogue traversal
- Space: `O(Q + E + I)` where `I` is active inventory footprint.

This scales better as quest counts grow because shared dependency computation is reused instead of
re-expanded recursively for each target.

## Why exclude non-inventory process quests

Some quests include process options that do not create any inventory artifact. Inventory-only
simulation cannot prove those processes were executed. To avoid false positives, validation is
limited to quests with at least one inventory-affecting process.

## Initial findings and balancing strategy

Initial run found dozens of quests with skip paths. We fixed quest gates by increasing counts on
`goto`/`finish` requirements tied to process-created items so that at least one in-quest process run
is required.

Additionally, `hydroponics/temp-check` now requires two temperature log items before advancing and
finishing, preventing instant completion from a single pre-existing reading.
