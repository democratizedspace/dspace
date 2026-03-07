# Quest Process Necessity Simulation

## Problem
Some quests can be finished without running their intended process steps because required process-output
items are already present in inventory when the quest starts. This weakens quest pacing and learning.

## Goal
Add an automated test that fails when a quest can bypass all process execution for process-output gates,
using a simulated inventory that includes prerequisite quest progression.

## Scope
- Quests under `frontend/src/pages/quests/json/**`.
- Process definitions from `frontend/src/generated/processes.json`.
- Item purchase availability from inventory metadata (`price` and `BETA_PLACEHOLDER`).
- Pre-quest baseline inventory for quest `q` is simulated from recursive `requiresQuests` ancestry only.

## Data model and assumptions
1. **Dependency graph**
   - Build directed edges from `requiresQuests`.
   - Detect cycles.
2. **Quest-body simulation**
   - Simulate only transitive prerequisites from `requiresQuests` in topological ancestor order.
   - Track inventory counts as floating-point-compatible numeric quantities.
   - Allow required-item purchases for quest progression when item is purchasable.
   - Execute process options at most once per node+process while traversing to finish.
3. **Bypass detection**
   - For each quest, collect process-created item IDs used as `goto` requirements on finish-reachable paths.
   - For each created item, use the minimum finish-reachable `goto` requirement count (easiest branch).
   - If simulated pre-quest inventory already satisfies any such gate, record a violation.

## Why this catches the bug class
If a process-created item gate is already satisfied before entering the quest, a player can skip process
execution and still progress/finish. The test flags these cases directly.

## Implementation strategy
Implemented in `tests/questProcessNecessitySimulation.test.ts`.

### Core steps
1. Load all quest files and process definitions.
2. Compute topological ordering and transitive prerequisite closure.
3. Simulate prerequisite completion inventory per quest.
4. Detect process-output gated transitions in the target quest.
5. Fail if any gate is pre-satisfied.

## Complexity analysis
Let:
- `Q` = number of quests
- `E` = dependency edges (`requiresQuests` references)
- `D` = total dialogue options across all quests
- `A(q)` = ancestor count for quest `q`

### Recursive approach (naive)
- Recomputes ancestor traversals and quest simulations repeatedly.
- Time: worst-case `O(Q * (Q + E + D))` with heavy duplication.
- Space: `O(Q + E + I)` where `I` is inventory map size during simulation.

### Dynamic-programming / memoized graph approach (chosen)
- Memoize prerequisite closure and reuse topological ordering.
- Time:
  - Topological sort + closure: `O(Q + E)` plus set-union costs.
  - Per-quest simulation over ancestors: `O(sum_q A(q) * avgQuestTraversal)`.
  - Practical behavior is significantly better than naive recursion due to closure memo reuse.
- Space:
  - Graph + closure memo: `O(Q + E + totalClosureEntries)`.
  - Runtime inventory/state: `O(I)` per quest simulation.

## Remediation policy for failing quests
For each violation, increase the relevant process-output `goto` requirement above the simulated pre-quest
inventory baseline so that at least one process run is required.

## Risks / limits
- Simulation is deterministic and does not enumerate all branching strategies.
- Inventory economics are approximated from purchasability metadata.
- Future quest schema changes may require parser updates.

## Debuggability
- The test includes a targeted assertion for `hydroponics/temp-check` that verifies:
  - ordered recursive prerequisite ancestry,
  - starting inventory count for `7f9d9d21-a4f2-4c48-b0e5-9a7483ab05d2`,
  - and any prerequisite source records for that item.
- Failure output is deterministic and includes quest id, ancestry used, bypassed item/count, and
  contributing prerequisite quest/process sources.

## Validation
Run:

```bash
npm run test:root -- tests/questProcessNecessitySimulation.test.ts
```

Optionally run broader quest checks:

```bash
npm run test:quest-validation
```
