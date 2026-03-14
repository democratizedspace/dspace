<script>
    import Chip from './Chip.svelte';

    export let title = 'Quests';
    export let subtitle = '';
    export let quests = [];
    export let emptyText = '';
    export let inverted = true;

    const normalizeQuestId = (questId) => String(questId ?? '').trim();
</script>

<div class="quest-links">
    <p class="section-title">{title}</p>
    {#if subtitle}
        <p class="section-subtitle">{subtitle}</p>
    {/if}
    {#if quests.length > 0}
        <div class="quest-link-chip-list">
            {#each quests as questId}
                {@const normalizedQuestId = normalizeQuestId(questId)}
                {#if normalizedQuestId}
                    <Chip
                        text={normalizedQuestId}
                        href={`/quests/${normalizedQuestId}`}
                        {inverted}
                    />
                {/if}
            {/each}
        </div>
    {:else if emptyText}
        <p>{emptyText}</p>
    {/if}
</div>

<style>
    .quest-links {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .section-title,
    .section-subtitle {
        margin: 4px;
        font-weight: 700;
    }

    .quest-link-chip-list {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 4px;
    }
</style>
