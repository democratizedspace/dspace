<script>
    import { onMount } from 'svelte';
    import { ready, state } from '../../utils/gameState/common.js';
    import { evaluateTitles } from '../../utils/titles.js';

    let hydrated = false;
    let unlocked = [];

    onMount(async () => {
        await ready;
        hydrated = true;
    });

    $: if (hydrated) {
        unlocked = evaluateTitles($state).filter((title) => title.unlocked);
    }
</script>

<section class="profile-titles" data-hydrated={hydrated ? 'true' : 'false'}>
    <h2>Unlocked titles</h2>
    {#if hydrated}
        {#if unlocked.length}
            <ul>
                {#each unlocked as title}
                    <li>
                        <strong>{title.name}</strong>
                        <span>{title.description}</span>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="empty">
                No titles unlocked yet. Complete quests and energy upgrades to earn one.
            </p>
        {/if}
    {:else}
        <p class="loading" role="status">Loading titles…</p>
    {/if}
</section>

<style>
    .profile-titles {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 0 0 1rem;
    }

    h2 {
        margin: 0;
        font-size: 1.35rem;
        color: #dce4ff;
    }

    ul {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    li {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        background: rgba(24, 28, 44, 0.6);
        border-radius: 12px;
        padding: 0.75rem 1rem;
        border: 1px solid rgba(120, 150, 255, 0.3);
    }

    strong {
        font-size: 1.05rem;
        color: #f0f4ff;
    }

    span {
        color: #c9d3ff;
        line-height: 1.35;
    }

    .empty,
    .loading {
        margin: 0;
        color: #cdd8ff;
    }

    .loading {
        font-style: italic;
    }
</style>
