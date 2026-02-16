# Item Containers System Design

## Summary

This design introduces **item containers**: inventory items that can hold tracked quantities of other
items through a new `itemCounts` definition on catalog items. The initial use case is the UBI
Savings Jar flow:

- buy a savings jar,
- deposit dUSD into it,
- track the stored dUSD amount,
- break the jar to retrieve all stored dUSD.

## Goals

1. Add a future-proof schema so any item can declare container-compatible contents.
2. Enforce at build/test time that only declared item IDs can be stored in a container.
3. Persist container balances in game state.
4. Let built-in processes update container balances via declarative process metadata.
5. Ship the savings jar as the first implementation and cover with unit + e2e tests.

## Non-goals

- Per-instance container identity (inventory still tracks stack counts by item ID).
- Capacity modeling.
- Multi-currency UI for container balances (current UI support is scoped to item pages).

## Data model

### Item catalog

`itemCounts` is a new optional field on any item:

```json
{
  "id": "66c2cdc6-9517-4c96-937f-1ddb4ee06ef3",
  "name": "savings jar",
  "itemCounts": {
    "5247a603-294a-4a34-a884-1ae20969b2a1": 0
  }
}
```

Semantics:

- Keys are storable item IDs allowed in this container.
- Values are default counts and must be `0` in source JSON.
- Runtime balances are persisted in game state, not mutated in source catalog JSON.

### Game state

A new top-level object is added:

- `inventoryItemCounts: Record<containerItemId, Record<storedItemId, number>>`

The validator ensures this object always exists.

### Processes

A new optional process field is added:

- `itemCountOperations`

Supported operations:

- `deposit` (requires `count`)
- `withdraw` (requires `count`)
- `withdraw-all`

Each operation declares:

- `containerItemId`
- `itemId`
- `operation`
- `count` (for exact deposit/withdraw)

## Runtime behavior

### New container helper module

`frontend/src/utils/gameState/itemContainers.js` provides:

- allowed-container lookup based on item catalog `itemCounts`
- read helpers (`getStoredItemCounts`, `getStoredItemCount`)
- mutation helpers (`addStoredItems`, `removeStoredItems`, `removeAllStoredItems`)
- compatibility check (`canStoreItemInContainer`)

### Process integration

`frontend/src/utils/gameState/processes.js` now:

1. checks `itemCountOperations` requirements before allowing process start,
2. applies operations when process finishes,
3. deposits/withdrawals update inventory when needed.

For `withdraw-all`, retrieved value is transferred into player inventory after container depletion.

### Savings jar mechanics

New items:

- `savings jar` (container allows `dUSD`)
- `broken savings jar` (non-container result after breaking)

New processes:

- `save-dusd-in-jar`: consumes 10 dUSD and deposits 10 dUSD into savings jar container balance.
- `break-savings-jar`: consumes one intact savings jar, creates one broken savings jar, and
  withdraws all dUSD from jar balance to inventory.

## Validation and testing strategy

### Build-time/test-time guarantees

1. Item schema now supports `itemCounts`.
2. Item validation asserts:
   - each `itemCounts` key points to an existing item ID,
   - all catalog default `itemCounts` values are `0`.
3. Process validation asserts each `itemCountOperations` reference is valid and container-compatible.

### Unit tests

- Add targeted tests for container helper behavior (defaults, adds, withdraws, and guardrails).
- Add process tests for `deposit` and `withdraw-all` application through process lifecycle.

### E2E tests

A dedicated e2e test covers the first use case:

- seed a profile with dUSD + savings jar,
- run `save-dusd-in-jar`,
- verify tracked jar balance increments,
- run `break-savings-jar`,
- verify dUSD is returned, jar is consumed, and broken jar is created.

## Risks and mitigations

- **Risk:** Non-container process misconfiguration.
  - **Mitigation:** validation test checks that operation item IDs are explicitly declared in
    container `itemCounts`.
- **Risk:** Legacy saves missing new state field.
  - **Mitigation:** `validateGameState` initializes `inventoryItemCounts`.
- **Risk:** confusion around stacked containers.
  - **Mitigation:** document current aggregate-per-item behavior; defer per-instance storage.

## Future extensions

- capacity constraints (`maxItemCounts`)
- container-to-container transfers
- per-instance containers via inventory instance IDs
- quest option-level requirements on container balances
``` 




