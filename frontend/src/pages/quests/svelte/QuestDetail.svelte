<script>
    import { onMount } from 'svelte';
    import { getQuest } from '../../../utils/customcontent.js';
    import QuestChat from './QuestChat.svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { getBuiltInQuest } from '../../../utils/builtInQuests.js';
    import { normalizeQuest } from '../../../utils/questNormalization.js';

    export let questId;

    let quest = null;
    let loading = true;
    let error = null;

    onMount(async () => {
        try {
            // First try to load as a custom quest
            const normalizeAndSetQuest = (loadedQuest) => {
                const normalized = normalizeQuest(loadedQuest);
                if (!normalized) {
                    return false;
                }

                quest = normalized;
                loading = false;
                return true;
            };

            try {
                if (normalizeAndSetQuest(await getQuest(questId))) {
                    return;
                }
                throw new Error('Custom quest not found for string ID');
            } catch (e) {
                const numericId = Number.parseInt(questId, 10);
                if (!Number.isNaN(numericId)) {
                    try {
                        if (normalizeAndSetQuest(await getQuest(numericId))) {
                            return;
                        }
                    } catch {
                        // Not found under numeric ID either, continue to built-in quests
                    }
                }
                // Not a custom quest, continue to built-in quests
            }

            const builtInQuest = getBuiltInQuest(questId);
            if (builtInQuest && normalizeAndSetQuest(builtInQuest)) {
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

        {#if quest?.dialogue?.length}
            <QuestChat {quest} pointer={quest.start} />
        {:else}
            <div class="error">
                <h2>Quest dialogue missing</h2>
                <p>This quest does not have dialogue to display.</p>
            </div>
        {/if}
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
