<script>
    import { onMount } from 'svelte';
    import items from '../inventory/json/items';
    import { loadGameState, ready, state } from '../../utils/gameState/common.js';
    import { prettyPrintNumber } from '../../utils.js';

    export let initialCurrencies = [];

    const knownCurrencies = {
        dUSD: {
            name: 'dUSD',
            description: 'Spendable currency for items, processes, and conversions.',
        },
        dBI: {
            name: 'dBI',
            description: 'Earned alongside dUSD from the basic income process.',
        },
    };

    const currencyItemIds = Object.fromEntries(
        Object.keys(knownCurrencies).map((symbol) => {
            const item = items.find((item) => item.name === symbol);
            return [symbol, item?.id];
        })
    );

    let currencies = initialCurrencies;

    const syncFromGameState = (gameState) => {
        const next = new Map();

        Object.entries(knownCurrencies).forEach(([symbol, metadata]) => {
            const itemId = currencyItemIds[symbol];
            if (!itemId) {
                return;
            }
            const balance = gameState.inventory?.[itemId] ?? 0;
            next.set(symbol, {
                symbol,
                ...metadata,
                balance: prettyPrintNumber(balance),
            });
        });

        initialCurrencies.forEach((currency) => {
            if (!next.has(currency.symbol)) {
                next.set(currency.symbol, currency);
            }
        });

        currencies = Array.from(next.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    onMount(async () => {
        syncFromGameState(loadGameState());
        await ready;
        const unsubscribe = state.subscribe((gameState) => {
            syncFromGameState(gameState);
        });
        return unsubscribe;
    });
</script>

<ul class="balance-list">
    {#each currencies as currency (currency.symbol)}
        <li class="balance-row" data-currency={currency.symbol}>
            <div>
                <p class="balance-label">{currency.name}</p>
                <p class="balance-description">{currency.description}</p>
            </div>
            <p class="balance-value" aria-label={`${currency.symbol} balance`}>
                {currency.balance}
                {currency.symbol}
            </p>
        </li>
    {/each}
</ul>
