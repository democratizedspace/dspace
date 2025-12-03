<script>
    import { onMount } from 'svelte';
    import items from '../../pages/inventory/json/items';
    import { getItemCount } from '../../utils/gameState/inventory.js';

    const currencyNames = ['dUSD', 'dBI', 'dCarbon', 'dOffset'];

    const formatAmount = (value) => {
        const number = Number(value) || 0;
        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
        }).format(number);
    };

    const resolveCurrencies = () =>
        currencyNames
            .map((name) => items.find((item) => item.name === name))
            .filter(Boolean)
            .map((item) => ({
                id: item.id,
                name: item.name,
                description: item.description,
            }));

    let balances = resolveCurrencies().map((item) => ({
        ...item,
        amount: '0',
    }));

    let hydrated = false;

    onMount(() => {
        const currentBalances = resolveCurrencies().map((item) => ({
            ...item,
            amount: formatAmount(getItemCount(item.id)),
        }));

        balances = currentBalances;
        hydrated = true;
    });
</script>

<div class="balances" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="balances__header">
        <h2>Balances</h2>
        <p class="balances__hint">Tracked from your saved game state</p>
    </div>

    <ul class="balances__list">
        {#each balances as balance}
            <li class="balances__item" data-testid="wallet-balance">
                <div>
                    <p class="balances__label">{balance.name}</p>
                    <p class="balances__value">{balance.amount}</p>
                    {#if balance.description}
                        <p class="balances__description">{balance.description}</p>
                    {/if}
                </div>
            </li>
        {/each}
    </ul>
</div>

<style>
    .balances {
        background: rgba(23, 33, 48, 0.65);
        border: 1px solid rgba(105, 140, 220, 0.35);
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
    }

    .balances__header {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin-bottom: 1rem;
    }

    h2 {
        margin: 0;
        font-size: 1.3rem;
        color: var(--color-heading);
    }

    .balances__hint {
        margin: 0;
        color: #b6c6e8;
        font-size: 0.95rem;
    }

    .balances__list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .balances__item {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 0.75rem 0.9rem;
        background: linear-gradient(145deg, rgba(0, 122, 37, 0.12), rgba(0, 255, 34, 0.06));
    }

    .balances__label {
        margin: 0;
        font-weight: 700;
        color: var(--color-heading);
        letter-spacing: 0.01em;
    }

    .balances__value {
        margin: 0.35rem 0 0;
        font-size: 1.3rem;
        font-weight: 800;
        color: var(--color-text);
    }

    .balances__description {
        margin: 0.25rem 0 0;
        color: #cbd7f0;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    @media (max-width: 640px) {
        .balances {
            padding: 1.25rem;
        }

        .balances__value {
            font-size: 1.1rem;
        }
    }
</style>
