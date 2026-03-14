<script>
    import Chip from './Chip.svelte';
    import { getBuiltInQuest } from '../../utils/builtInQuests.js';
    import { canonicalizeQuestId } from '../../utils/questIdAliases.js';

    export let questIds = [];
    export let invertChips = true;

    let normalizedQuestIds = [];

    const normalizeQuestIds = (ids = []) => {
        if (!Array.isArray(ids)) {
            return [];
        }

        const uniqueIds = new Set();
        const normalized = [];

        for (const id of ids) {
            const canonicalId = canonicalizeQuestId(id);
            if (!canonicalId || uniqueIds.has(canonicalId)) {
                continue;
            }
            uniqueIds.add(canonicalId);
            normalized.push(canonicalId);
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
