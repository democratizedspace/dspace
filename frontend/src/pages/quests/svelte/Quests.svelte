<script>
    import Quest from './Quest.svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { onMount } from 'svelte';
    import { questFinished, canStartQuest } from '../../../utils/gameState.js';
    import { listCustomQuests } from '../../../utils/customcontent.js';
    import { state, ready } from '../../../utils/gameState/common.js';

    export let quests = [];
    let filteredQuests = [];
    let finishedQuests = [];
    let mounted = false;
    let customQuestRecords = [];
    let normalizedBuiltInQuests = [];
    let normalizedCustomQuests = [];

    const normalizeQuest = (entry) => {
        if (!entry) {
            return null;
        }

        const questData = entry.default ?? entry;
        if (!questData || !questData.id) {
            return null;
        }

        const requiresQuests = Array.isArray(questData.requiresQuests)
            ? questData.requiresQuests.filter((id) => typeof id === 'string' && id.trim() !== '')
            : [];

        const normalizedDefault = questData.default
            ? {
                  ...questData.default,
                  requiresQuests: Array.isArray(questData.default.requiresQuests)
                      ? questData.default.requiresQuests
                      : requiresQuests,
              }
            : { requiresQuests };

        return {
            ...questData,
            id: questData.id,
            requiresQuests,
            default: normalizedDefault,
        };
    };

    const normalizeQuestList = (entries = []) => {
        const normalized = [];
        for (const quest of entries ?? []) {
            const prepared = normalizeQuest(quest);
            if (prepared) {
                normalized.push(prepared);
            }
        }
        return normalized;
    };

    const dedupeById = (questList = []) => {
        const byId = new Map();
        for (const quest of questList) {
            const key = String(quest.id);
            byId.set(key, quest);
        }
        return Array.from(byId.values());
    };

    const safeQuestFinished = (quest) => {
        try {
            return questFinished(quest.id);
        } catch (error) {
            console.error('Unable to determine quest completion status', error);
            return false;
        }
    };

    const safeCanStartQuest = (quest) => {
        try {
            return canStartQuest(quest);
        } catch (error) {
            console.error('Unable to evaluate quest prerequisites', error);
            return true;
        }
    };

    onMount(async () => {
        await ready;
        mounted = true;
        try {
            const questsFromStorage = await listCustomQuests();
            customQuestRecords = Array.isArray(questsFromStorage) ? questsFromStorage : [];
        } catch (error) {
            console.error('Unable to load custom quests for listing:', error);
            customQuestRecords = [];
        }
    });

    $: normalizedBuiltInQuests = normalizeQuestList(quests);
    $: normalizedCustomQuests = normalizeQuestList(customQuestRecords);

    $: if (mounted) {
        const _gs = $state; // rerun when game state updates
        const combinedQuests = dedupeById([...normalizedBuiltInQuests, ...normalizedCustomQuests]);
        filteredQuests = [];
        finishedQuests = [];
        combinedQuests.forEach((quest) => {
            if (safeQuestFinished(quest)) {
                finishedQuests.push(quest);
            } else if (safeCanStartQuest(quest)) {
                filteredQuests.push(quest);
            }
        });
    }

    // Define buttons for easy expansion
    const actionButtons = [
        { text: 'Create a new quest', href: '/quests/create' },
        { text: 'Managed quests', href: '/quests/managed' },
    ];
</script>

<div class="container">
    {#if mounted}
        <div class="action-buttons">
            {#each actionButtons as button}
                <Chip text={button.text} href={button.href} inverted={true} />
            {/each}
        </div>

        <div class="quests-grid">
            {#each filteredQuests as quest}
                <a href="/quests/{quest.id}">
                    <Quest {quest} />
                </a>
            {/each}
        </div>

        {#if finishedQuests.length > 0}
            <h2>Completed Quests</h2>
            {#each finishedQuests as quest}
                <a href="/quests/{quest.id}">
                    <Quest {quest} compact={true} />
                </a>
            {/each}
        {/if}
    {/if}
</div>

<style>
    a {
        text-decoration: none;
        margin: 50px;
    }

    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
    }

    .quests-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }
</style>
