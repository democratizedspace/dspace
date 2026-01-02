<script>
    import { onMount } from 'svelte';
    import { state, ready } from '../../utils/gameState/common.js';
    import { prettyPrintNumber } from '../../utils.js';
    import items from '../../pages/inventory/json/items';

    export let currencies = [];

    const defaultCurrencies = [
        {
            symbol: 'dUSD',
            name: 'dUSD',
            description: 'Spendable currency for items, processes, and conversions.',
        },
        {
            symbol: 'dBI',
            name: 'dBI',
            description: 'Earned alongside dUSD from the basic income process.',
        },
    ];

    const symbolToItemId = items.reduce((map, item) => {
        if (item?.name && !map[item.name]) {
            map[item.name] = item.id;
        }
        return map;
    }, {});

    let useGameStateBalances = false;
    let hydrationAttempted = false;

    onMount(() => {
        ready
            .then(() => {
                useGameStateBalances = true;
            })
            .catch(() => {
                useGameStateBalances = false;
            })
            .finally(() => {
                hydrationAttempted = true;
            });
    });

    $: normalizedCurrencies = (currencies?.length ? currencies : defaultCurrencies)
        .map((currency) => ({
            ...currency,
            symbol: currency.symbol ?? currency.name,
            name: currency.name ?? currency.symbol ?? 'Currency',
        }))
        .sort((a, b) => a.symbol.localeCompare(b.symbol));

    $: inventory = $state?.inventory ?? {};
    $: displayCurrencies = normalizedCurrencies.map((currency) => {
        const itemId = symbolToItemId[currency.symbol];
        const hasInventoryBalance = itemId !== undefined;
        const balanceSource = hasInventoryBalance && useGameStateBalances ? inventory[itemId] : 0;
        const numericBalance = Number(balanceSource ?? 0);
        const safeBalance = Number.isFinite(numericBalance) ? numericBalance : 0;
        const isLoading = hasInventoryBalance && !hydrationAttempted;

        return {
            ...currency,
            balance: isLoading ? 'Loading…' : prettyPrintNumber(safeBalance),
        };
    });
</script>

<ul class="balance-list" role="list">
    {#each displayCurrencies as currency}
        <li class="balance-row" data-currency={currency.symbol}>
            <div>
                <p class="balance-label">{currency.name}</p>
                <p class="balance-description">{currency.description}</p>
            </div>
            <p class="balance-value" aria-label={`${currency.symbol} balance`}>
                {`${currency.balance} ${currency.symbol}`}
            </p>
        </li>
    {/each}
</ul>
