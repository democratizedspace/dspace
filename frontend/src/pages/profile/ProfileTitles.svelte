<script>
    import { onMount } from 'svelte';
    import { ready, state } from '../../utils/gameState/common.js';
    import { evaluateTitles } from '../../utils/titles.js';
    import Chip from '../../components/svelte/Chip.svelte';

    let hydrated = false;
    let titles = [];

    onMount(async () => {
        await ready;
        hydrated = true;
    });

    $: if (hydrated) {
        titles = evaluateTitles($state);
    }
</script>

<section class="profile-titles" data-hydrated={hydrated ? 'true' : 'false'}>
    <h3>Unlocked titles</h3>
    <p class="summary">Select a title to wear; locked ones stay disabled until you earn them.</p>

    {#if hydrated}
        <div class="list">
            {#each titles as title}
                <div class="item" data-unlocked={title.unlocked ? 'true' : 'false'}>
                    <Chip
                        text={title.name}
                        disabled={!title.unlocked}
                        inverted={title.unlocked}
                    />
                    <span class={`status ${title.unlocked ? 'unlocked' : 'locked'}`}>
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

    h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #dce4ff;
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
