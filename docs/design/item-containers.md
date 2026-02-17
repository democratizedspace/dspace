# Item Containers Design

## Catalog schema (`itemCounts`)

Any item can define an `itemCounts` object in catalog JSON.

- Shape: `Record<storedItemId, number>`
- Keys: item IDs that are allowed to be stored in that container
- Values: numeric, `>= 0`
- Source defaults: must be `0` for every key in catalog JSON

Build/test validation enforces:

1. Every `itemCounts` key must reference a real item ID.
2. Every catalog default value in `itemCounts` is exactly `0`.

## Runtime state (`gameState.itemContainerCounts`)

Runtime balances are stored in game state only:

- Field: `gameState.itemContainerCounts`
- Shape: `Record<containerItemId, Record<storedItemId, number>>`
- Semantics: aggregate by container item type (item ID), not per physical instance
- Values are mutable runtime balances and persist through IndexedDB-backed game state

Catalog JSON is never mutated at runtime.

## Process integration (`itemCountOperations`)

Processes can define `itemCountOperations`:

- `deposit`: requires positive `count`, adds to container balance
- `withdraw`: requires positive `count`, subtracts if available, returns removed amount to inventory
- `withdraw-all`: no `count`, empties stored balance and returns all to inventory

Validation enforces that each operation references an allowed container/item pair declared in the
container item's `itemCounts` map.

Runtime behavior:

- Start gating checks inventory requirements plus valid container pairing.
- `withdraw` also requires enough stored balance.
- `finishProcess` and `skipProcess` apply `itemCountOperations` after consume/create rules.

## Savings jar first use case

- `savings jar` declares `itemCounts: { dUSD: 0 }`
- `savings-jar-deposit` consumes 10 dUSD and deposits 10 dUSD into the jar balance.
- `savings-jar-break` consumes the jar, creates `broken savings jar`, withdraws all stored dUSD.
- Item detail page shows a **Stored contents** section for any item with `itemCounts`, using
  runtime values from `gameState.itemContainerCounts`.
