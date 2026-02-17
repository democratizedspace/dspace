# Item Containers Design

## Catalog schema: `itemCounts`

Container-capable catalog items may declare:

```json
"itemCounts": {
  "<storedItemId>": 0
}
```

Rules:
- keys must reference valid inventory item IDs.
- values are numeric and must be `>= 0`.
- source JSON defaults must be exactly `0` (no non-zero seeded container balances).

## Runtime state: `gameState.itemContainerCounts`

Runtime balances are tracked separately from inventory stack counts:

- Inventory stacks: `gameState.inventory: Record<itemId, number>`
- Container balances: `gameState.itemContainerCounts: Record<containerItemId, Record<storedItemId, number>>`

Semantics:
- aggregate by container item type, not per-instance item UID.
- runtime-only and persisted in IndexedDB as part of game state.
- import/export of `/gamesaves` round-trips `itemContainerCounts` through serialized game state.

## Process integration

Processes can define `itemCountOperations`:

- `deposit` `{ operation, containerItemId, itemId, count }`
- `withdraw` `{ operation, containerItemId, itemId, count }`
- `withdraw-all` `{ operation, containerItemId, itemId }`

Validation and runtime gates enforce that:
- `containerItemId -> itemId` pair is allowed by catalog `itemCounts` keys.
- withdraw requires sufficient stored runtime balance.
- all deltas remain non-negative.

## Savings jar use case

Savings jar item declares dUSD in `itemCounts` with default `0`.

- Deposit process consumes 10 dUSD and deposits 10 dUSD into jar storage.
- Break process consumes 1 savings jar, creates 1 broken savings jar, and withdraws all stored dUSD.

This preserves the tangible mechanic: balances are visible while jar exists, and liquidity requires breakage.
