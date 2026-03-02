# Item Containers Design

## Catalog schema: `itemCounts`

Inventory catalog items may declare an `itemCounts` object.

- Shape: `Record<storedItemId, number>`
- Keys: item IDs that are allowed to be stored in this container item.
- Values: numeric defaults and must be `0` in source catalog JSON.
- Values must be `>= 0`.

This field is **capability metadata**, not mutable runtime state.

## Runtime state: `gameState.itemContainerCounts`

Runtime stored balances live in game state and are persisted with gameState in IndexedDB.

- Shape: `Record<containerItemId, Record<storedItemId, number>>`
- Semantics: aggregate per item ID, not per instance.
- Naming: distinct from inventory stacks (`gameState.inventory`).

Container balances are never written back to catalog JSON.

## Process integration: `itemCountOperations`

Processes can apply container balance operations:

- `deposit`: add `count` to container stored balance.
- `withdraw`: remove up to `count` and return removed amount to inventory.
- `withdraw-all`: remove all stored balance and return it to inventory.

Each operation references `{ containerItemId, itemId }`.
Validation enforces that the pair is allowed by container catalog `itemCounts` keys.

## Savings jar use case

- Savings jar item allows storing only dUSD via `itemCounts`.
- Deposit process consumes 10 dUSD and deposits 10 dUSD to the jar.
  - Break process consumes savings jar, creates broken savings jar, and surfaces withdrawn dUSD in the Creates list using the current stored count (for example: `broken savings jar ×1`, `dUSD ×37`).
- Item page displays current stored contents from runtime `itemContainerCounts`.
