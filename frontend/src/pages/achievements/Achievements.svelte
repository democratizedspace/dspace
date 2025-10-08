<script>
    import { onMount } from 'svelte';
    import { ACHIEVEMENTS, evaluateAchievements } from '../../utils/achievements.js';
    import { ready, state } from '../../utils/gameState/common.js';

    const categories = [...new Set(ACHIEVEMENTS.map((achievement) => achievement.category))];

    let hydrated = false;
    let summaries = [];

    const recompute = () => {
        summaries = evaluateAchievements($state);
    };

    onMount(async () => {
        await ready;
        hydrated = true;
        recompute();
    });

    $: if (hydrated) {
        recompute();
    }

    const statusLabel = (summary) => (summary.unlocked ? 'Unlocked' : 'Locked');
</script>

<div class="achievements" data-hydrated={hydrated ? 'true' : 'false'}>
    {#if hydrated}
        {#each categories as category}
            <section class="category">
                <h2>{category}</h2>
                <div class="cards">
                    {#each summaries.filter((summary) => summary.category === category) as summary}
                        <article class:unlocked={summary.unlocked}>
                            <header>
                                <h3>{summary.title}</h3>
                                <span class="status" aria-live="polite">{statusLabel(summary)}</span
                                >
                            </header>
                            <p class="description">{summary.description}</p>
                            <div
                                class="progress"
                                role="group"
                                aria-label={`Progress toward ${summary.title}`}
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
        <p class="loading" role="status">Loading achievements…</p>
    {/if}
</div>

<style>
    .achievements {
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
        color: #b8f7c0;
    }

    .cards {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }

    article {
        background: rgba(32, 64, 32, 0.7);
        border: 1px solid rgba(128, 192, 128, 0.4);
        border-radius: 16px;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        transition: transform 150ms ease, border-color 150ms ease;
    }

    article.unlocked {
        border-color: rgba(180, 255, 180, 0.8);
        box-shadow: 0 0 20px rgba(120, 220, 120, 0.25);
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
        color: #f2fff3;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    article.unlocked .status {
        background: rgba(26, 115, 52, 0.85);
        color: #e5ffe8;
    }

    .description {
        margin: 0;
        color: #d6f1da;
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
        background: linear-gradient(90deg, #3bd26f, #67f7a2);
        border-radius: inherit;
        transition: width 150ms ease;
    }

    article.unlocked .fill {
        background: linear-gradient(90deg, #a7ff83, #5de094);
    }

    .value {
        font-size: 0.85rem;
        color: #f1fff5;
        font-family: 'Fira Code', monospace;
    }

    .loading {
        text-align: center;
        font-style: italic;
        color: #cfead4;
    }

    @media (max-width: 640px) {
        .cards {
            grid-template-columns: 1fr;
        }
    }
</style>
