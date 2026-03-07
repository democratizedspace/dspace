# Design: Prerequisite-inventory quest process gating validation

## Problem

Some quests can be completed instantly because prerequisite quests already leave the player with
items that satisfy evidence checks intended to be produced inside the current quest. A concrete
example was `hydroponics/temp-check`, where prior gameplay could already provide
`Aquarium temperature reading` and bypass the logging process.

## Goal

Add an automated test that:

1. Simulates inventory after completing prerequisite quests.
2. Replays each quest with that prerequisite inventory.
3. Fails when a completion path can bypass process-created evidence checks.

## Scope and behavior

The test (`tests/questProcessRequiredByPrereqInventory.test.ts`) does the following:

- Loads all quest JSON files.
- Builds prerequisite closures from `requiresQuests`.
- Topologically orders prerequisite subsets for deterministic replay.
- Simulates prerequisite quest execution into a shared inventory snapshot.
- Simulates the current quest with processes disabled.
- Inspects the chosen completion trace and looks for this bypass pattern:
  - A `goto` is selected from a node that also offers one or more `process` options.
  - The `goto` requires an item created by one of those process options.
  - Required count is already met by prerequisite inventory.

This catches the class of “process evidence already satisfied” issues while avoiding blanket
requirements that every quest must always run a process.

## Algorithm options

### 1) Recursive simulation

For each quest `q`, recursively simulate each prerequisite quest and merge resulting inventory,
then evaluate `q`.

- Time (without memoization): `O(Q * (Q + E) * S)` worst-case due to repeated subtree work.
- Space: `O(D + I)` per active call stack (`D` = max prerequisite depth, `I` = inventory size).

### 2) Dynamic programming / memoized closure + topo replay (implemented)

- Compute prerequisite closure per quest once (memoized DFS).
- Topologically order closure subset before replay.
- Reuse shared simulation primitives.

- Time: `O((Q + E) + sum(simulation_steps))` plus subset ordering overhead.
- Space: `O(Q + E + I)` for graph/memo/inventory structures.

This approach scales better as quest count grows because closure computation is cached and replay
order is deterministic.

## Complexity notes

Let:

- `Q` = number of quests
- `E` = prerequisite edges
- `S` = average bounded simulation steps per quest

Then practical test runtime is dominated by `O(Q * S)` replay work after `O(Q + E)` graph prep,
with small constant factors from inventory map operations.

## Data model assumptions

- Item requirements may appear as `requiresItems`, `requiredItems`, `requiredItemIds`, or
  `requiredItemId`.
- Process definitions are sourced from `frontend/src/generated/processes.json`.
- Purchasable items can be materialized during simulation when needed.

## Quest balancing follow-up policy

When the test flags a quest, fix by increasing the relevant evidence requirement count so at least
one in-quest process run is needed on the validated completion path.
