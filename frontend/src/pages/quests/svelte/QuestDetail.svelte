<script>
    import { onMount } from 'svelte';
    import { getQuest } from '../../../utils/customcontent.js';
    import QuestChat from './QuestChat.svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { getBuiltInQuest } from '../../../utils/builtInQuests.js';
    import { normalizeQuestForChat } from '../../../utils/questNormalization.js';

    export let questId;

    let quest = null;
    let loading = true;
    let error = null;
    onMount(async () => {
        try {
            const setQuest = (loadedQuest) => {
                const normalized = normalizeQuestForChat(loadedQuest);
                if (!normalized) {
                    return false;
                }

                quest = normalized;
                loading = false;
                return true;
            };

            try {
                if (setQuest(await getQuest(questId))) {
                    return;
                }
                throw new Error('Custom quest not found for string ID');
            } catch (e) {
                const numericId = Number.parseInt(questId, 10);
                if (!Number.isNaN(numericId)) {
                    try {
                        if (setQuest(await getQuest(numericId))) {
                            return;
                        }
                    } catch {
                        // Not found under numeric ID either, continue to built-in quests
                    }
                }
                // Not a custom quest, continue to built-in quests
            }

            const builtInQuest = getBuiltInQuest(questId);
            if (setQuest(builtInQuest)) {
                return;
            }

            throw new Error(`Quest not found: ${questId}`);
        } catch (e) {
            console.error('Error loading quest:', e);
            error = e.message;
            loading = false;
        }
    });
</script>

<div class="quest-detail">
    {#if loading}
        <div class="loading">
            <p>Loading quest details...</p>
        </div>
    {:else if error}
        <div class="error">
            <h2>Error</h2>
            <p>{error}</p>
            <Chip text="Back to Quests" href="/quests" inverted={true} />
        </div>
    {:else if quest}
        <div class="actions">
            <Chip text="Back to Quests" href="/quests" inverted={true} />
        </div>

        <QuestChat {quest} pointer={quest.start} />
    {/if}
</div>

<style>
    .quest-detail {
        max-width: 800px;
        margin: 0 auto;
    }

    .loading,
    .error {
        text-align: center;
        padding: 2rem;
        background: rgba(0, 100, 0, 0.2);
        border-radius: 12px;
        border: 2px solid #007006;
    }

    .error {
        background: rgba(100, 0, 0, 0.2);
        border: 2px solid #700000;
    }

    .actions {
        display: flex;
        justify-content: flex-start;
        margin-bottom: 1rem;
    }
</style>
