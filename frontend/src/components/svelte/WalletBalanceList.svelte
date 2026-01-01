<script>
    import { onDestroy, onMount } from 'svelte';
    import { state, ready } from '../../utils/gameState/common.js';
    import { prettyPrintNumber } from '../../utils.js';

    export let currencies = [];

    let displayedCurrencies = currencies.map((currency) => ({
        ...currency,
        balance: currency.balance ?? prettyPrintNumber(currency.rawBalance ?? 0),
    }));

    let unsubscribe;

    const getInventoryBalance = ($state, currency) => {
        if (!currency.itemId || !$state?.inventory) {
            return undefined;
        }

        const balance = $state.inventory[currency.itemId];
        if (typeof balance === 'number' && !Number.isNaN(balance)) {
            return balance;
        }

        if (typeof balance === 'string' && balance.trim() !== '' && !Number.isNaN(balance)) {
            const parsed = parseFloat(balance);
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }

        return undefined;
    };

    const syncBalances = ($state) => {
        displayedCurrencies = currencies.map((currency) => {
            const inventoryBalance = getInventoryBalance($state, currency);
            const balance = inventoryBalance ?? currency.rawBalance ?? 0;

            return {
                ...currency,
                balance: prettyPrintNumber(balance),
            };
        });
    };

    onMount(async () => {
        await ready;
        unsubscribe = state.subscribe(($state) => {
            syncBalances($state);
        });
    });

    onDestroy(() => {
        if (unsubscribe) {
            unsubscribe();
        }
    });
</script>

<ul class="balance-list" role="list">
    {#each displayedCurrencies as currency}
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
