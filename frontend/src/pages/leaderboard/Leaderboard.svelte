<script>
    import { onMount } from 'svelte';
    import { ready, state } from '../../utils/gameState/common.js';
    import inventoryItems from '../inventory/json/items/index.js';
    import {
        DONATION_LEADERS,
        QUEST_LEADERS,
        ENERGY_LEADERS,
    } from '../../utils/leaderboardData.js';

    const dWattId = inventoryItems.find((item) => item.name === 'dWatt')?.id ?? null;
    const numberFormatter = new Intl.NumberFormat('en-US');

    const countFinishedQuests = (quests = {}) =>
        Object.values(quests).reduce((total, quest) => (quest?.finished ? total + 1 : total), 0);

    const getInventoryCount = (inventory = {}, itemId) => {
        if (!itemId) return 0;
        const value = inventory[itemId];
        return typeof value === 'number' && Number.isFinite(value) ? value : 0;
    };

    const formatNumber = (value) => numberFormatter.format(Math.max(0, Math.round(value)));

    let hydrated = false;
    let personalStats = { questsCompleted: 0, energyStored: 0 };

    onMount(async () => {
        await ready;
        hydrated = true;
    });

    $: if (hydrated) {
        const snapshot = $state;
        personalStats = {
            questsCompleted: countFinishedQuests(snapshot?.quests),
            energyStored: getInventoryCount(snapshot?.inventory, dWattId),
        };
    }
</script>

<div class="leaderboard" data-hydrated={hydrated ? 'true' : 'false'}>
    <header class="intro">
        <h1>Metaguild Donation Leaderboard</h1>
        <p>
            See which crews fuel the universal basic income pool. Daily donations earn streak
            bonuses and bragging rights across the metaguild.
        </p>
    </header>

    <section aria-labelledby="donation-table" class="panel">
        <h2 id="donation-table">Top UBI donors</h2>
        <table aria-label="Donation leaderboard">
            <thead>
                <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Callsign</th>
                    <th scope="col">Guild</th>
                    <th scope="col">Total dUSD</th>
                    <th scope="col">Streak (days)</th>
                </tr>
            </thead>
            <tbody>
                {#each DONATION_LEADERS as entry}
                    <tr>
                        <th scope="row">#{entry.rank}</th>
                        <td>{entry.callsign}</td>
                        <td>{entry.guild}</td>
                        <td>{formatNumber(entry.contribution)}</td>
                        <td>{entry.streak}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </section>

    <section aria-labelledby="personal-progress" class="panel personal">
        <h2 id="personal-progress">Your contributions</h2>
        {#if hydrated}
            <dl>
                <div>
                    <dt>Quests completed</dt>
                    <dd>{personalStats.questsCompleted}</dd>
                </div>
                <div>
                    <dt>Energy stored (dWatt)</dt>
                    <dd>{formatNumber(personalStats.energyStored)}</dd>
                </div>
                <div>
                    <dt>Daily streak tip</dt>
                    <dd>
                        Donate dUSD after each quest to climb the chart and earn exclusive metaguild
                        badges.
                    </dd>
                </div>
            </dl>
        {:else}
            <p class="loading" role="status">Loading personal stats…</p>
        {/if}
    </section>

    <section class="panel grid" aria-labelledby="quest-leaders">
        <div>
            <h2 id="quest-leaders">Quest champions</h2>
            <ul>
                {#each QUEST_LEADERS as entry}
                    <li>
                        <span class="rank">#{entry.rank}</span>
                        <div class="details">
                            <strong>{entry.callsign}</strong>
                            <span>{entry.guild}</span>
                        </div>
                        <span class="metric">{entry.completed} quests</span>
                    </li>
                {/each}
            </ul>
        </div>
        <div>
            <h2 id="energy-leaders">Energy keepers</h2>
            <ul>
                {#each ENERGY_LEADERS as entry}
                    <li>
                        <span class="rank">#{entry.rank}</span>
                        <div class="details">
                            <strong>{entry.callsign}</strong>
                            <span>{entry.guild}</span>
                        </div>
                        <span class="metric">{formatNumber(entry.stored)} dWatt</span>
                    </li>
                {/each}
            </ul>
        </div>
    </section>
</div>

<style>
    .leaderboard {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 1rem 0 3rem;
    }

    .intro h1 {
        margin: 0 0 0.75rem;
        font-size: clamp(2rem, 4vw, 2.75rem);
        color: #d7f5ff;
    }

    .intro p {
        margin: 0;
        max-width: 60ch;
        color: rgba(222, 245, 255, 0.85);
        line-height: 1.6;
    }

    .panel {
        background: rgba(12, 26, 39, 0.8);
        border: 1px solid rgba(88, 180, 255, 0.35);
        border-radius: 18px;
        padding: 1.75rem;
        box-shadow: 0 10px 30px rgba(5, 16, 28, 0.45);
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    h2 {
        margin: 0;
        font-size: 1.4rem;
        color: #9ddcff;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.95rem;
    }

    th,
    td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid rgba(157, 220, 255, 0.2);
    }

    tbody tr:last-child th,
    tbody tr:last-child td {
        border-bottom: none;
    }

    tbody tr:hover {
        background: rgba(39, 78, 105, 0.45);
    }

    .personal dl {
        display: grid;
        gap: 1rem 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin: 0;
    }

    .personal dt {
        font-weight: 600;
        color: rgba(222, 245, 255, 0.75);
    }

    .personal dd {
        margin: 0;
        font-size: 1.1rem;
        color: #f3fbff;
    }

    .personal dd:last-child {
        font-size: 0.95rem;
        line-height: 1.4;
        color: rgba(222, 245, 255, 0.8);
    }

    .loading {
        margin: 0;
        color: rgba(222, 245, 255, 0.7);
        font-style: italic;
    }

    .grid {
        display: grid;
        gap: 2rem;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }

    .grid ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .grid li {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        background: rgba(22, 44, 61, 0.65);
        border: 1px solid rgba(157, 220, 255, 0.18);
    }

    .rank {
        font-family: 'Fira Code', monospace;
        font-weight: 600;
        color: #7ed3ff;
    }

    .details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .details strong {
        font-size: 1rem;
        color: #e6f7ff;
    }

    .details span {
        font-size: 0.85rem;
        color: rgba(222, 245, 255, 0.7);
    }

    .metric {
        font-weight: 600;
        color: #b6ecff;
    }

    @media (max-width: 640px) {
        th,
        td {
            padding: 0.5rem 0.75rem;
        }

        .panel {
            padding: 1.25rem;
        }
    }
</style>
