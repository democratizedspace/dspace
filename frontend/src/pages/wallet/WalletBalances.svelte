<script>
    import { onMount } from 'svelte';
    import items from '../inventory/json/items';
    import { ready, state as gameState } from '../../utils/gameState/common.js';
    import { prettyPrintNumber } from '../../utils.js';

    export let currencies = [];

    const currencyItems = currencies.map((currency) => {
        const item = items.find((itemDefinition) => itemDefinition.name === currency.symbol);

        return {
            ...currency,
            itemId: item?.id,
        };
    });

    let balances = currencyItems.map((currency) => ({
        ...currency,
        balance: currency.balance ?? prettyPrintNumber(0),
    }));

    const updateFromState = (value) => {
        if (!value) {
            return;
        }

        balances = currencyItems.map((currency) => {
            if (currency.itemId && value.inventory) {
                const rawBalance = value.inventory[currency.itemId] ?? 0;
                return {
                    ...currency,
                    balance: prettyPrintNumber(rawBalance),
                };
            }

            return {
                ...currency,
                balance: currency.balance ?? prettyPrintNumber(0),
            };
        });
    };

    let unsubscribe;

    onMount(() => {
        let cancelled = false;

        ready.then(() => {
            if (cancelled) {
                return;
            }

            unsubscribe = gameState.subscribe((value) => {
                updateFromState(value);
            });
        });

        return () => {
            cancelled = true;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    });
</script>

<ul class="balance-list" role="list">
    {#each balances as currency (currency.symbol)}
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
