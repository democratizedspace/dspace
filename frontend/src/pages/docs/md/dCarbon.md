---
title: 'dCarbon'
slug: 'dcarbon'
---

dCarbon represents the amount of carbon dioxide produced by a player in the game. 1 dCarbon = 1 kg
of carbon dioxide. This virtual measurement helps track environmental impact and encourages
players to seek cleaner energy solutions.

This measurement increases when you generate energy from non-renewable sources, unless that energy
source explicitly doesn't release carbon dioxide. Players are encouraged to find ways to minimize
their dCarbon footprint through sustainable energy solutions.

Currently, the only way to generate dCarbon is by drawing power from your outlet using your
[smart plug](/inventory/item/a5395e29-1862-4eb7-8517-5d161635e032):

<img src="/assets/docs/generate_dCarbon.jpg" alt="screenshot of processes producing dCarbon" width="100%" />

## dCarbon tax on sellable items

Your current dCarbon also affects how much dUSD you receive when selling any item with a price:

- Sales tax is **1% per 1,000 dCarbon** in your inventory.
- The tax is **continuous** (for example, 500 dCarbon = 0.5% tax).
- Tax is **capped at 90%**.

Example: at 20,000 dCarbon, selling a 10 dUSD item yields 8 dUSD after a 20% tax.

## Reducing your dCarbon footprint

You can burn down accumulated dCarbon by converting it to [dOffset](/docs/doffset). The conversion
process lives in the **Processes** tab:

- Run the **dCarbon to dOffset** process to exchange batches of dCarbon.
- Each run consumes dCarbon and a small amount of
  [dUSD](/inventory/item/5247a603-294a-4a34-a884-1ae20969b2a1) to retire the emissions and mint
  dOffset in return.
