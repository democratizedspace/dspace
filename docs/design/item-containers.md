# Item Containers System Design

## Summary

This design introduces `itemCounts` as a first-class container mechanic for items. A container item can
hold floating-point quantities of specific item IDs, with allowed contents declared at build time on
that item definition.

The first production use case is the UBI savings jar flow:

1. Buy a sealed savings jar with dUSD.
2. Deposit dUSD into the jar through a process.
3. Break the jar to recover all stored dUSD and receive a broken-jar item.

## Goals

- Add futureproof storage metadata to item definitions via `itemCounts`.
- Enforce build-time allowlisting of storable item IDs per container item.
- Support float balances (e.g., `10.5 dUSD`) in containers.
- Integrate container transfers into processes with explicit transfer declarations.
- Preserve existing inventory mechanics for all non-container content.

## Data Model

### Item definition

`frontend/src/pages/inventory/jsonSchemas/item.json` now supports:

- `itemCounts: Record<itemId, number>`

Rules:

- Keys are item IDs.
- Values are non-negative numbers.
- This map is a capability declaration and default value template.

Example for sealed savings jar:

```json
"itemCounts": {
  "5247a603-294a-4a34-a884-1ae20969b2a1": 0
}
```

### Runtime game state

`frontend/src/utils/gameState/common.js` adds:

- `gameState.itemCounts: Record<containerItemId, Record<itemId, number>>`

Container balances are persisted per container item ID.

## Process Integration

`frontend/src/pages/processes/process.schema.json` adds an optional `itemCountTransfers` array.

Each transfer entry includes:

- `containerId`
- `itemId`
- `direction`: `inventoryToContainer | containerToInventory`
- `amount`: positive number or `"all"`

Behavior:

- `inventoryToContainer` expects inventory consumption to be declared in `consumeItems`; transfer writes
  the same quantity into `itemCounts`.
- `containerToInventory` reads from `itemCounts`, removes the requested amount (or all), and adds that
  amount back to inventory.

## Savings Jar Use Case

### Items

- `sealed savings jar` (supports dUSD via `itemCounts`)
- `broken savings jar`

### Processes

- `buy-sealed-savings-jar`
- `stash-dusd-in-savings-jar`
- `break-savings-jar`

### Quest updates

`ubi/savings-goal` now walks players through buying, depositing, and breaking the jar, with process-based
state transitions and clear inventory gates.

## Validation and Safety

- Unsupported `containerId/itemId` pairs are rejected by runtime helper functions.
- Process requirement checks fail if a `containerToInventory` transfer requests unavailable container
  balances.
- Container balances never go negative.
- Unknown container-item support returns zero rather than throwing in UI reads.

## Test Plan

- Unit tests for container helper functions and process transfer semantics.
- Schema validation tests for updated process schema and item schema compatibility.
- E2E flow test that executes the full savings jar lifecycle and verifies persisted balances.

## Future Extensions

- Multiple simultaneous container instances (currently modeled per item ID).
- UI controls for variable deposit amounts.
- Container telemetry in wallet/analytics surfaces.
