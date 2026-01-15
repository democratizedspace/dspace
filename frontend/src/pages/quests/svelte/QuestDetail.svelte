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
            const setQuest = (rawQuest) => {
                const normalized = normalizeQuest(rawQuest);
                if (!normalized) {
                    return false;
                }
                quest = normalized;
                loading = false;
                return true;
            };

            const loadCustomQuest = async (id) => {
                try {
                    return await getQuest(id);
                } catch {
                    return null;
                }
            };

            const numericId = Number.parseInt(questId, 10);
            const customQuest =
                (await loadCustomQuest(questId)) ??
                (Number.isNaN(numericId) ? null : await loadCustomQuest(numericId));

            if (setQuest(customQuest)) {
                return;
            }

            if (setQuest(getBuiltInQuest(questId))) {
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
        <QuestChat {quest} />
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

</style>
