# Quest Process-Requirement Simulation Design

## Problem

Some quests can be completed immediately because prerequisite quests already leave the player with
items that satisfy non-process gates. This allows users to skip process steps that the quest is
supposed to teach (for example, `hydroponics/temp-check` could be closed without running
`log-walstad-temperature`).

We need a test that simulates progression inventory from prerequisites and verifies that selected
quests cannot be finished without running at least one process.

## Scope

This implementation targets the hydroponics quest family and validates quests that:

1. Have at least one process option.
2. Have at least one non-process option requiring an item that can be created by a process inside
   that same quest.

These are exactly the quests vulnerable to “already-have-the-created-item” bypasses.

## Simulation model

### Inputs

- Quest graph from `frontend/src/pages/quests/json/**`.
- Process definitions from `frontend/src/generated/processes.json`.

### Progression inventory simulation

For each quest `q`, recursively simulate all `requiresQuests` first. The starting inventory for `q`
is the merged ending inventories of its prerequisite quests.

### Quest execution simulation

- Build dialogue graph from `start` node.
- State: `(nodeId, inventory, processRuns)`.
- Transitions:
  - `goto`: advance node if requirements are met.
  - `process`: apply process consume/create effects and increment `processRuns`.
  - `finish`: terminal state.
- Requirements are satisfied only by currently owned items (no ad-hoc buying during this test).

For each quest we compute the minimum number of process runs required to finish.

### Validation rule

For each in-scope quest, fail if `minProcessRuns === 0`.

## Algorithm choices

### Recursive brute force (baseline)

A naive recursion that explores all dialogue choices and all dependency branches repeatedly has poor
scaling because the same prerequisite quests and internal quest subpaths are recomputed many times.

- Time: exponential in branching and depth in the worst case.
- Space: recursion stack + path state, also exponential in explored branches.

### Dynamic programming / memoized recursion (chosen)

We memoize each quest’s simulation result (`endingInventory`, `minProcessRuns`) by quest id. This
turns repeated dependency evaluations into single computations.

Inside a quest, we also memoize best known process cost per `(nodeId, cappedInventoryKey)`.

- Let:
  - `Q` = number of quests,
  - `E` = total quest dependency edges,
  - `S_q` = reachable dialogue states for quest `q`.
- Time: `O(Q + E + Σ S_q log S_q)` (priority ordering for process-minimizing exploration).
- Space: `O(Q + E + Σ S_q)`.

This scales substantially better as quest count grows into the thousands.

## Balancing changes applied

Hydroponics quests were adjusted so bypassable non-process gates now require higher counts of
process-created items, ensuring at least one process must be run with prerequisite inventory
applied.

Updated quests:

- `hydroponics/ec-check`
- `hydroponics/nutrient-check`
- `hydroponics/pump-install`
- `hydroponics/pump-prime`
- `hydroponics/temp-check`
