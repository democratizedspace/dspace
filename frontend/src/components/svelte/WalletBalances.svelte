<script>
    import { onMount } from 'svelte';
    import { state, ready } from '../../utils/gameState/common.js';
    import { prettyPrintNumber } from '../../utils.js';
    import items from '../../pages/inventory/json/items';

    export let currencies = [];

    const symbolToItemId = items.reduce((map, item) => {
        if (item?.name && !map[item.name]) {
            map[item.name] = item.id;
        }
        return map;
    }, {});

    let useGameStateBalances = false;

    onMount(() => {
        ready.finally(() => {
            useGameStateBalances = true;
        });
    });

    $: inventory = $state?.inventory ?? {};
    $: displayCurrencies = currencies.map((currency) => {
        const itemId = symbolToItemId[currency.symbol];
        const balanceSource =
            useGameStateBalances && itemId !== undefined ? inventory[itemId] : currency.balance;
        const numericBalance = Number(balanceSource ?? 0);
        const safeBalance = Number.isFinite(numericBalance) ? numericBalance : 0;

        return {
            ...currency,
            balance: prettyPrintNumber(safeBalance),
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
                {currency.balance} {currency.symbol}
            </p>
        </li>
    {/each}
</ul>
