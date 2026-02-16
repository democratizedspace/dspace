# Item Containers System Design

## Context

The UBI savings jar quest needs a tangible savings mechanic: players buy a sealed jar, deposit dUSD,
and only recover funds by breaking the jar. Existing inventory supports only flat item counts, so there
is no way to persist "value stored inside an item".

## Goals

- Add a future-proof item container model that can be used by any item.
- Enforce at build/test time that only explicitly allowed items can be stored in a container.
- Support process-level transfer flows:
    - inventory ➜ container
    - container ➜ inventory (including withdraw all)
- Ship the first production use case: sealed savings jar.
- Keep backwards compatibility with existing saves.

## Non-goals

- Per-instance container tracking (we track per container item ID, not individual item instances).
- UI-heavy container management screens.
- Arbitrary nested containers.

## Data Model

### Item definition contract

Each item may define an optional `itemCounts` object:

```json
{
    "id": "b7046e45-1cce-4cb8-9a23-6045c74cd667",
    "name": "sealed savings jar",
    "itemCounts": {
        "5247a603-294a-4a34-a884-1ae20969b2a1": 0
    }
}
```

Rules:

- Keys are item IDs that may be stored in this container.
- Values are default numeric counts (usually `0`).
- If an item ID is not present, it cannot be stored in that container.

### Game state persistence

`gameState.itemContainerCounts` stores runtime balances by container item ID:

```json
{
    "itemContainerCounts": {
        "b7046e45-1cce-4cb8-9a23-6045c74cd667": {
            "5247a603-294a-4a34-a884-1ae20969b2a1": 30
        }
    }
}
```

Compatibility behavior:

- Missing `itemContainerCounts` is auto-initialized to `{}`.
- Unknown/invalid numbers normalize to `0`.

## Process integration

Processes can optionally define `containerItemTransfers`:

```json
[
    {
        "containerId": "b7046e45-1cce-4cb8-9a23-6045c74cd667",
        "itemId": "5247a603-294a-4a34-a884-1ae20969b2a1",
        "count": 10,
        "direction": "toContainer"
    }
]
```

Supported directions:

- `toContainer`: removes `count` from inventory and increments container balance.
- `toInventory`: decrements container balance and credits inventory.
- `toInventory` + `count: "all"`: withdraws the full stored amount.

Validation/runtime guardrails:

- Process start checks transfer prerequisites (container ownership, balances, allowed key).
- Finish/skip applies transfers before createItems.
- Transfers fail safely if configuration is invalid.

## Savings Jar Use Case

### New items

- `sealed savings jar` (buyable, has `itemCounts` key for dUSD)
- `broken savings jar` (created when jar is broken)

### New processes

- `buy-savings-jar`: consumes 12 dUSD, creates sealed savings jar.
- `deposit-dusd-into-savings-jar`: transfers 10 dUSD from inventory into jar `itemCounts`.
- `break-savings-jar`: consumes sealed jar, creates broken jar, transfers all stored dUSD back.

### Quest updates

`ubi/savings-goal` now guides players through buying and depositing, with break mechanics documented as
follow-up behavior.

## Test Plan

- Schema validation: item schema accepts `itemCounts` map.
- Unit tests: inventory container transfer helpers and process transfer execution paths.
- Content tests: process container transfer references must target valid item IDs and allowed container
  keys.
- E2E: savings jar process/quest flow verifies deposit and break behavior from the user perspective.
