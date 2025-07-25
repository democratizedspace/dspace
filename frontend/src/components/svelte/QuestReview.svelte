<script>
    import { createEventDispatcher } from 'svelte';
    export let quests = [];
    const dispatch = createEventDispatcher();

    function approve(id) {
        dispatch('approve', { id });
    }

    function reject(id) {
        dispatch('reject', { id });
    }
</script>

<div class="quest-review">
    {#if quests.length === 0}
        <p class="no-quests">No quests to review</p>
    {:else}
        {#each quests as quest}
            <div class="quest-item">
                <h3>{quest.title}</h3>
                <p>{quest.description}</p>
                <div class="actions">
                    <button class="approve" on:click={() => approve(quest.id)}>Approve</button>
                    <button class="reject" on:click={() => reject(quest.id)}>Reject</button>
                </div>
            </div>
        {/each}
    {/if}
</div>

<style>
    .quest-review {
        max-width: 600px;
        margin: 0 auto;
    }
    .quest-item {
        border: 2px solid #007006;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        background: #2c5837;
        color: white;
    }
    .actions {
        margin-top: 0.5rem;
    }
    .approve,
    .reject {
        margin-right: 0.5rem;
        padding: 0.3rem 0.8rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    .approve {
        background-color: #007006;
        color: white;
    }
    .reject {
        background-color: #cc0000;
        color: white;
    }
    .no-quests {
        text-align: center;
        padding: 2rem;
        background: #2c5837;
        border-radius: 8px;
        border: 2px solid #007006;
    }
</style>
