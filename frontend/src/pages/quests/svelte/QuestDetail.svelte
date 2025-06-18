<script>
    import { onMount } from 'svelte';
    import { getQuest } from '../../../utils/customcontent.js';
    import QuestChat from './QuestChat.svelte';
    import Chip from '../../../components/svelte/Chip.svelte';

    export let questId;

    let quest = null;
    let loading = true;
    let error = null;
    let isCustomQuest = false;

    onMount(async () => {
        try {
            // First try to load as a custom quest
            try {
                const customQuest = await getQuest(parseInt(questId));
                if (customQuest) {
                    quest = {
                        id: customQuest.id,
                        title: customQuest.title,
                        description: customQuest.description,
                        image: customQuest.image || '/assets/quests/howtodoquests.jpg',
                        isCustom: true,
                    };
                    isCustomQuest = true;
                    loading = false;
                    return;
                }
            } catch (e) {
                // Not a custom quest, continue to built-in quests
            }

            // Try to load built-in quest
            // In a real implementation, this would be an API call
            // For now, just simulate with a timeout
            await new Promise((resolve) => setTimeout(resolve, 500));

            // This is a placeholder - in a real app, you'd fetch from an API
            if (questId === 'welcome/howtodoquests') {
                quest = {
                    id: 'welcome/howtodoquests',
                    title: 'How to do quests',
                    description:
                        'Learn how the quest mechanics work, including dialogue options, items, and processes.',
                    image: '/assets/quests/howtodoquests.jpg',
                };
            } else if (questId === 'energy/solar') {
                quest = {
                    id: 'energy/solar',
                    title: 'Set up a solar panel',
                    description:
                        "The wall outlet is convenient, but your utility uses fossil fuels for electricity generation! Let's take things in our own hands and start going off the grid.",
                    image: '/assets/quests/solar_200Wh.jpg',
                };
            } else {
                throw new Error('Quest not found');
            }

            loading = false;
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

        {#if isCustomQuest}
            <div class="custom-quest">
                <h1>{quest.title}</h1>
                <div class="quest-content">
                    {#if quest.image}
                        <img src={quest.image} alt={quest.title} class="quest-image" />
                    {/if}
                    <div class="quest-info">
                        <p class="description">{quest.description}</p>
                    </div>
                </div>
            </div>
        {:else}
            <QuestChat {quest} pointer={quest.start} />
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

    .custom-quest {
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        padding: 2rem;
        color: white;
    }

    h1 {
        text-align: center;
        margin-bottom: 1.5rem;
        color: #00ff22;
    }

    .quest-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .quest-image {
        width: 100%;
        max-height: 400px;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid #007006;
    }

    .quest-info {
        flex: 1;
    }

    .description {
        font-size: 1.1rem;
        line-height: 1.6;
    }

    @media (min-width: 768px) {
        .quest-content {
            flex-direction: row;
        }

        .quest-image {
            width: 50%;
        }
    }
</style>
