<script>
    import Chip from './Chip.svelte';

    export let title = '';
    export let questIds = [];
</script>

{#if Array.isArray(questIds) && questIds.length > 0}
    <div class="quest-links" data-testid="quest-link-chips">
        {#if title}
            <p class="quest-links-title">{title}</p>
        {/if}
        <div class="quest-chip-list">
            {#each questIds as questId}
                <Chip text={questId} href={`/quests/${questId}`} inverted={true} />
            {/each}
        </div>
    </div>
{/if}

<style>
    .quest-links {
        align-self: stretch;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
    }

    .quest-links-title {
        font-weight: 700;
        margin: 0;
    }

    .quest-chip-list {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.35rem;
    }
</style>
