<script>
    import { onDestroy, onMount } from 'svelte';
    import Process from '../../components/svelte/Process.svelte';
    import items from '../inventory/json/items/index.js';
    import { loadGameState, ready, state } from '../../utils/gameState/common.js';

    const currencyNames = ['dUSD', 'dBI', 'dOffset', 'dCarbon'];
    const currencies = items.filter((item) => currencyNames.includes(item.name));

    let balances = currencies.map((currency) => ({ ...currency, amount: 0 }));
    let mounted = false;
    let unsubscribe;

    const refreshBalances = () => {
        const gameState = loadGameState();
        balances = currencies.map((currency) => ({
            ...currency,
            amount: Number(gameState.inventory?.[currency.id] ?? 0),
        }));
    };

    onMount(async () => {
        await ready;
        refreshBalances();
        unsubscribe = state.subscribe(refreshBalances);
        mounted = true;
    });

    onDestroy(() => {
        if (unsubscribe) {
            unsubscribe();
        }
    });
</script>

<section class="wallet-overview">
    <article class="panel balances" data-testid="wallet-balance-panel">
        <div class="panel-header">
            <h2>Balances</h2>
            <p class="panel-subtitle">
                Track how your earnings, offsets, and carbon impact evolve over time.
            </p>
        </div>
        <div class="balance-grid" data-testid="wallet-balances">
            {#each balances as currency}
                <div class="balance-card" data-testid="wallet-balance-card">
                    <div class="balance-title">
                        <h3>{currency.name}</h3>
                        <p class="balance-id">{currency.id}</p>
                    </div>
                    <p class="amount">{currency.amount.toLocaleString()}</p>
                    <p class="description">{currency.description}</p>
                </div>
            {/each}
        </div>
    </article>

    <article class="panel process-panel" data-testid="wallet-process-card">
        <div class="panel-header">
            <h2>Basic income</h2>
            <p class="panel-subtitle">
                Run the daily stipend to grow both dUSD and dBI with each claim.
            </p>
        </div>
        {#if mounted}
            <Process processId="basic-income" />
        {:else}
            <p class="hint">Loading wallet actions…</p>
        {/if}
    </article>
</section>

<style>
    .wallet-overview {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: 1.75fr 1fr;
        align-items: start;
    }

    .panel {
        background: linear-gradient(145deg, rgba(0, 255, 34, 0.08), rgba(0, 0, 0, 0.4));
        border: 1px solid rgba(105, 140, 220, 0.35);
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
    }

    .panel-header {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin-bottom: 1rem;
    }

    .panel-subtitle {
        margin: 0;
        color: var(--color-text);
        line-height: 1.5;
    }

    h2 {
        margin: 0;
        color: var(--color-heading);
    }

    h3 {
        margin: 0;
        color: var(--color-heading);
        letter-spacing: 0.02em;
    }

    .balances {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .balance-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .balance-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(105, 140, 220, 0.18);
        border-radius: 12px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .balance-title {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .balance-id {
        margin: 0;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.75rem;
        word-break: break-all;
    }

    :global(html[data-theme='light']) .balance-card {
        background: rgba(0, 0, 0, 0.04);
        border-color: rgba(0, 0, 0, 0.08);
    }

    .amount {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 800;
        color: var(--color-pill-active);
    }

    .description {
        margin: 0;
        color: var(--color-text);
        line-height: 1.4;
    }

    .process-panel .hint {
        margin: 0;
        color: var(--color-text);
    }

    @media (max-width: 960px) {
        .wallet-overview {
            grid-template-columns: 1fr;
        }
    }
</style>
