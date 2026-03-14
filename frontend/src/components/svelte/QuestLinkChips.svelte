<script>
    import Chip from './Chip.svelte';
    import { getBuiltInQuest } from '../../utils/builtInQuests.js';

    export let questIds = [];
    export let invertChips = true;

    const normalizeQuestIds = (ids = []) => {
        if (!Array.isArray(ids)) {
            return [];
        }

        const uniqueIds = new Set();
        const normalized = [];

        for (const id of ids) {
            if (typeof id !== 'string') {
                continue;
            }
            const trimmed = id.trim();
            if (!trimmed || uniqueIds.has(trimmed)) {
                continue;
            }
            uniqueIds.add(trimmed);
            normalized.push(trimmed);
        }

        return normalized;
    };

    const resolveQuestLabel = (questId) => {
        const builtInQuest = getBuiltInQuest(questId);
        if (builtInQuest?.title) {
            return builtInQuest.title;
        }
        return questId;
    };

    $: normalizedQuestIds = normalizeQuestIds(questIds);
</script>

{#if normalizedQuestIds.length > 0}
    <div class="quest-chip-list" data-testid="quest-link-chip-list">
        {#each normalizedQuestIds as questId}
            <Chip
                href={`/quests/${questId}`}
                text={resolveQuestLabel(questId)}
                inverted={invertChips}
            />
        {/each}
    </div>
{/if}

<style>
    .quest-chip-list {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
        margin: 6px 0;
    }
</style>
