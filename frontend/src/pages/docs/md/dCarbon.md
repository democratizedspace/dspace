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

## Reducing your dCarbon footprint

You can burn down accumulated dCarbon by converting it to [dOffset](/docs/doffset). The conversion
process lives in the **Processes** tab:

- Run the **dCarbon to dOffset** process to exchange batches of dCarbon.
- Each run consumes dCarbon and a small amount of
  [dUSD](/inventory/item/5247a603-294a-4a34-a884-1ae20969b2a1) to retire the emissions and mint
  dOffset in return.

## dCarbon sales-tax effect

Your current dCarbon inventory applies a **sales tax to any sellable item** in `/inventory`:

- Tax rate = `dCarbon / 1000` percent.
- 1,000 dCarbon (1 metric ton CO₂) = 1% tax.
- The rate is continuous (for example, 500 dCarbon = 0.5% tax).
- The tax is capped at 90%.

Examples:

- 2,000 dCarbon selling a 10 dUSD item → 2% tax → receive 9.8 dUSD.
- 1,000,000 dCarbon selling a 10 dUSD item → capped 90% tax → receive 1 dUSD.
