<script>
    import { onMount } from 'svelte';
    import { ready, state } from '../../utils/gameState/common.js';
    import { TITLES, evaluateTitles } from '../../utils/titles.js';

    const categories = [...new Set(TITLES.map((title) => title.category))];

    let hydrated = false;
    let summaries = [];

    onMount(async () => {
        await ready;
        hydrated = true;
    });

    $: if (hydrated) {
        summaries = evaluateTitles($state);
    }

    const statusLabel = (summary) => (summary.unlocked ? 'Unlocked' : 'Locked');
</script>

<div class="titles" data-hydrated={hydrated ? 'true' : 'false'}>
    {#if hydrated}
        {#each categories as category}
            <section class="category">
                <h2>{category}</h2>
                <div class="cards">
                    {#each summaries.filter((summary) => summary.category === category) as summary}
                        <article class:unlocked={summary.unlocked}>
                            <header>
                                <h3>{summary.name}</h3>
                                <span class="status" aria-live="polite">{statusLabel(summary)}</span
                                >
                            </header>
                            <p class="description">{summary.description}</p>
                            <div
                                class="progress"
                                role="group"
                                aria-label={`Progress toward ${summary.name}`}
                            >
                                <div class="bar" aria-hidden="true">
                                    <div
                                        class="fill"
                                        style={`width: ${summary.progress.percent}%`}
                                    />
                                </div>
                                <span class="value">{summary.progress.displayValue}</span>
                            </div>
                        </article>
                    {/each}
                </div>
            </section>
        {/each}
    {:else}
        <p class="loading" role="status">Loading titles…</p>
    {/if}
</div>

<style>
    .titles {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 1rem 0;
    }

    .category {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .category h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #c9d8ff;
    }

    .cards {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }

    article {
        background: rgba(24, 28, 44, 0.75);
        border: 1px solid rgba(120, 150, 255, 0.35);
        border-radius: 16px;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
    }

    article.unlocked {
        border-color: rgba(160, 190, 255, 0.85);
        box-shadow: 0 0 18px rgba(110, 150, 255, 0.35);
    }

    article:hover {
        transform: translateY(-4px);
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    h3 {
        margin: 0;
        font-size: 1.1rem;
    }

    .status {
        font-size: 0.85rem;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.35);
        color: #f0f3ff;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    article.unlocked .status {
        background: rgba(66, 95, 236, 0.85);
        color: #f4f6ff;
    }

    .description {
        margin: 0;
        color: #e0e7ff;
        line-height: 1.4;
    }

    .progress {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .bar {
        height: 10px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.4);
        overflow: hidden;
    }

    .fill {
        height: 100%;
        background: linear-gradient(90deg, #648bff, #9fb7ff);
        border-radius: inherit;
        transition: width 150ms ease;
    }

    article.unlocked .fill {
        background: linear-gradient(90deg, #b8c7ff, #7da2ff);
    }

    .value {
        font-size: 0.85rem;
        color: #f2f5ff;
        font-family: 'Fira Code', monospace;
    }

    .loading {
        text-align: center;
        font-style: italic;
        color: #d7deff;
    }

    @media (max-width: 640px) {
        .cards {
            grid-template-columns: 1fr;
        }
    }
</style>
