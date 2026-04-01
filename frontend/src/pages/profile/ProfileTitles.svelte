<script>
    import { onMount } from 'svelte';
    import { ready, state as gameState } from '../../utils/gameState/common.js';
    import { evaluateTitles } from '../../utils/titles.js';

    let hydrated = false;
    let titles = [];

    onMount(async () => {
        await ready;
        hydrated = true;
    });

    $: if (hydrated) {
        titles = evaluateTitles($gameState);
    }
</script>

<section class="profile-titles" data-hydrated={hydrated ? 'true' : 'false'}>
    <p class="summary">Select a title to display. Earn achievements to unlock more titles.</p>

    {#if hydrated}
        <div class="list">
            {#each titles as title}
                <div class="item" data-unlocked={title.unlocked ? 'true' : 'false'}>
                    <span
                        class={`chip ${title.unlocked ? 'unlocked' : 'locked'}`}
                        aria-label={`${title.name} ${title.unlocked ? 'unlocked' : 'locked'}`}
                    >
                        {title.name}
                    </span>
                    <span
                        class={`status ${title.unlocked ? 'unlocked' : 'locked'}`}
                        aria-hidden="true"
                    >
                        {title.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                    <p class="description">{title.description}</p>
                </div>
            {/each}
        </div>
    {:else}
        <p class="loading" role="status">Loading titles…</p>
    {/if}
</section>

<style>
    .profile-titles {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .summary {
        margin: 0;
        color: #cdd8ff;
        line-height: 1.4;
    }

    .list {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
    }

    .item {
        padding: 0.9rem 1rem;
        border-radius: 14px;
        background: rgba(37, 61, 37, 0.45);
        border: 1px solid rgba(120, 150, 255, 0.2);
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.35rem 0.75rem;
        align-items: center;
    }

    .chip {
        border-radius: 10px;
        padding: 0.35rem 0.75rem;
        font-weight: 700;
        font-size: 0.95rem;
        background: rgba(104, 212, 109, 0.25);
        color: #f8fff8;
        border: 1px solid rgba(104, 212, 109, 0.45);
    }

    .chip.locked {
        background: rgba(87, 95, 87, 0.45);
        color: #c6c6c6;
        border-color: rgba(120, 150, 255, 0.2);
    }

    .status {
        color: #cdd8ff;
        font-size: 0.95rem;
        justify-self: start;
    }

    .status.locked {
        opacity: 0.65;
    }

    .description {
        margin: 0;
        color: #c9d3ff;
        line-height: 1.45;
        grid-column: 1 / -1;
    }

    .loading {
        margin: 0;
        color: #cdd8ff;
    }

    .loading {
        font-style: italic;
    }
</style>
