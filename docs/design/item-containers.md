# Item Containers System Design

## Problem

Some mechanics need assets that can hold other assets over time. The UBI savings jar quest is the
first use case: players should lock dUSD into a jar and only recover funds by breaking it.

## Goals

- Add a futureproof container model without breaking existing inventory semantics.
- Allow processes to store/release contained item balances.
- Enforce container compatibility at build/test time.
- Ship first use case: `sealed savings jar` holding `dUSD`.

## Data model

### Item definition (`frontend/src/pages/inventory/json/items/*.json`)

Items can now declare optional `itemCounts`:

```json
{
  "id": "<container-item-id>",
  "itemCounts": {
    "<contained-item-id>": 0
  }
}
```

Notes:

- Keys are item IDs that are allowed inside that container.
- Values are floating point defaults (typically `0`).
- Presence of the key is the build-time allowlist for containment.

### Inventory state (`gameState.inventory`)

Inventory entries remain backward-compatible:

- Legacy scalar: `inventory[itemId] = number`
- Container-aware: `inventory[itemId] = { count: number, itemCounts: Record<string, number> }`

Container counts are pooled per item ID (not tracked per physical instance).

## Process extensions

Processes can now include two optional effects:

- `storeItems`: move value into container balances.
- `releaseItems`: move value from container balances back to inventory (`count` may be `'all'`).

Example:

```json
"storeItems": [{ "containerId": "jar", "itemId": "dUSD", "count": 10 }],
"releaseItems": [{ "containerId": "jar", "itemId": "dUSD", "count": "all" }]
```

## Savings jar use case

- `deposit-savings-jar` consumes 10 dUSD and stores 10 dUSD in `sealed savings jar.itemCounts`.
- `break-savings-jar` consumes one sealed jar, creates one broken jar, and releases all stored dUSD
  from the container back into player inventory.

## Validation and tests

- Item JSON schema now allows `itemCounts` as a numeric map.
- Unit tests verify process behavior (store then release).
- Structural tests verify process container actions only reference container/item pairs declared in
  item `itemCounts`.
- E2E test verifies full savings-jar gameplay path and persisted state values.

## Follow-ups

- If per-instance containers are needed later, introduce a unique-instance inventory model.
- Add UI affordances to display container balances directly in inventory cards.
