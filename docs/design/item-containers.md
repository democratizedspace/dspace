# Item Containers Design

## Catalog schema: `itemCounts`

Items in the catalog may declare an `itemCounts` field:

```json
{
    "itemCounts": {
        "<storedItemId>": 0
    }
}
```

Rules:

- `itemCounts` is an object map from stored item id to numeric count metadata.
- All values must be numeric and `>= 0`.
- In source catalog JSON, all values must default to exactly `0`.
- Keys are the allowed stored item IDs for that container type.

## Runtime state: `gameState.itemContainerCounts`

Container balances are tracked in game state, separate from stack inventory:

```ts
Record<containerItemId, Record<storedItemId, number>>;
```

Semantics:

- Aggregate by item type, not per-instance container object.
- Missing entries are treated as `0`.
- Runtime balances persist in IndexedDB as part of `gameState`.
- Runtime balances are never written back to catalog JSON.

## Process integration

Processes can declare `itemCountOperations`:

- `deposit`
- `withdraw`
- `withdraw-all`

Operation shape:

```json
{
    "operation": "deposit|withdraw|withdraw-all",
    "containerItemId": "...",
    "itemId": "...",
    "count": 10
}
```

Validation and runtime behavior:

- Operation container/item pair must be allowed by catalog `itemCounts` keys.
- `deposit` / `withdraw` require positive `count`.
- `withdraw-all` has no `count`.
- Start gating ensures invalid pairings are rejected and withdrawals cannot overdraw.
- Finish/skip apply operations after normal consume/create effects.

## Savings jar first use case

- `savings jar` item declares `itemCounts` containing the `dUSD` item id with default `0`.
- Deposit process consumes dUSD and deposits it into the jar balance.
- Break process consumes savings jar, creates broken savings jar, and withdraws all stored dUSD.
- Item page shows live `Stored contents` for all `itemCounts` keys.
