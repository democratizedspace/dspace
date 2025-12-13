<script>
    import { onMount } from 'svelte';
    import Quest from './Quest.svelte';
    import { questFinished } from '../../../utils/gameState.js';
    import { db, listCustomQuests } from '../../../utils/customcontent.js';
    import { state, ready } from '../../../utils/gameState/common.js';

    export let quests = [];
    let mounted = false;
    let hydrated = false;
    let searchTerm = '';
    let selectedStatus = 'all';
    let filteredQuests = [];
    let customQuests = [];
    let combinedQuests = [];

    $: if (mounted) {
        const _gs = $state; // recompute when game state changes
        combinedQuests = [...quests, ...customQuests];

        filteredQuests = combinedQuests.filter((quest) => {
            const matchesSearch =
                quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quest.description.toLowerCase().includes(searchTerm.toLowerCase());

            const isFinished = questFinished(quest.id);

            if (selectedStatus === 'all') return matchesSearch;
            if (selectedStatus === 'active') return matchesSearch && !isFinished;
            if (selectedStatus === 'completed') return matchesSearch && isFinished;

            return false;
        });
    }

    onMount(async () => {
        await ready;
        mounted = true;
        try {
            customQuests = await listCustomQuests();
        } catch (error) {
            console.error('Unable to load custom quests:', error);
        } finally {
            hydrated = true;
        }
    });

    function handleEdit(questId) {
        // Implement edit functionality
        window.location.href = `/quests/${questId}/edit`;
    }

    async function handleDelete(questId) {
        if (confirm('Are you sure you want to delete this quest?')) {
            try {
                await db.quests.delete(questId);
                customQuests = customQuests.filter((q) => q.id !== questId);
                quests = quests.filter((q) => q.id !== questId);
            } catch (error) {
                console.error('Error deleting quest:', error);
                alert('Failed to delete quest');
            }
        }
    }
</script>

<div class="manage-quests" data-hydrated={hydrated ? 'true' : 'false'}>
    {#if mounted}
        <div class="controls">
            <div class="search-box">
                <input type="text" bind:value={searchTerm} placeholder="Search quests..." />
            </div>

            <div class="status-filter">
                <select bind:value={selectedStatus}>
                    <option value="all">All Quests</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
        </div>

        <div class="quests-list">
            {#if filteredQuests.length === 0}
                <div class="no-quests">No quests found matching your criteria</div>
            {:else}
                {#each filteredQuests as quest (quest.id)}
                    <div class="quest-item" data-testid="quest-row">
                        <Quest {quest} compact={true} />
                        <div class="quest-actions">
                            <button
                                class="edit-button"
                                data-testid="quest-edit-button"
                                type="button"
                                on:click={() => handleEdit(quest.id)}
                            >
                                Edit
                            </button>
                            <button
                                class="delete-button"
                                type="button"
                                on:click={() => handleDelete(quest.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style>
    .manage-quests {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    .controls {
        display: flex;
        gap: 20px;
        margin-bottom: 30px;
        justify-content: space-between;
    }

    .search-box input,
    .status-filter select {
        padding: 10px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        border: 2px solid #007006;
        font-size: 16px;
        width: 200px;
    }

    .quest-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding: 15px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
    }

    .quest-actions {
        display: flex;
        gap: 10px;
    }

    .edit-button,
    .delete-button {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    }

    .edit-button {
        background-color: #007006;
        color: white;
    }

    .delete-button {
        background-color: #dd3333;
        color: white;
    }

    .edit-button:hover {
        background-color: #005004;
    }

    .delete-button:hover {
        background-color: #bb2222;
    }

    .no-quests {
        text-align: center;
        padding: 40px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        color: white;
    }
</style>
