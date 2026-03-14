<script>
    import Chip from './Chip.svelte';

    export let heading = 'Quests';
    export let emptyText = '';
    export let questIds = [];

    $: normalizedQuestIds = Array.isArray(questIds)
        ? questIds
              .map((questId) => (typeof questId === 'string' ? questId.trim() : ''))
              .filter((questId) => questId.length > 0)
        : [];
</script>

<section class="quest-links" data-hydrated="true">
    <h5>{heading}</h5>
    {#if normalizedQuestIds.length === 0}
        {#if emptyText}
            <p>{emptyText}</p>
        {/if}
    {:else}
        <div class="chips">
            {#each normalizedQuestIds as questId}
                <Chip href={`/quests/${questId}`} text={questId} inverted={true} />
            {/each}
        </div>
    {/if}
</section>

<style>
    .quest-links {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
    }

    h5,
    p {
        margin: 0;
    }
</style>
