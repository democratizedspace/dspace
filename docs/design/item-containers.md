# Item Containers Design (Savings Jar v1)

This document defines the item-container model and the first implemented use case: the savings jar.

## Goals

1. Savings jar is purchased with a small amount of dUSD.
2. Only dUSD can be deposited into the savings jar.
3. Deposits are amount-based via process input.
4. Withdrawals are all-or-nothing and consume the savings jar item.
5. Container balances appear on item detail pages for any item with a truthy `itemCounts` map.

## Data model

- Item-level declaration uses `itemCounts` as a map of `itemId -> truthy`.
- Runtime storage uses game state `itemContainerCounts` keyed by container `itemId` then contained `itemId`.
- Savings jar declares one allowed key: `dUSD`.

## Savings jar flows

### Buy

- The jar is a regular inventory item with price `2 dUSD`.

### Deposit (`savings-jar-deposit`)

- Requires savings jar in inventory.
- UI prompts for a numeric amount.
- Process consumes exactly that amount of dUSD and records it inside the jar balance.

### Withdraw all (`savings-jar-withdraw-all`)

- Requires and consumes one savings jar.
- Returns all dUSD currently stored in the jar balance.
- Clears stored dUSD count for that container item.

## Item page behavior

- On `/inventory/item/[itemId]`, if the item has `itemCounts`, render a "Contained items" list.
- For each truthy map key, show current stored count.
- This generalizes to any multi-currency container (for example, both dUSD and dCarbon).
