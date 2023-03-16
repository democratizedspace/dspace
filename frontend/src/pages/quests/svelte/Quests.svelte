<script>
    import Quest from './Quest.svelte';
    import { onMount } from 'svelte';

    export let quests = [];
    let filteredQuests = [];
    let mounted = false;

    onMount(async () => {
        mounted = true;
    });

    quests.forEach(quest => {
        const finished = localStorage.getItem(`quest-${quest.id}-finished`) === 'true';
        console.log("finished: ", finished);
        if (!finished) {
            const requiredQuests = quest.requiredQuests;
            if (requiredQuests) {
                requiredQuests.forEach(requiredQuest => {
                    if (!localStorage.getItem(`quest-${requiredQuest}-finished`) !== 'true') {
                        return;
                    }
                });

            }
            filteredQuests.push(quest);
        }

    });
</script>

<div class="container">
    <h3>Up Next</h3>
    {#if mounted}
        {#each filteredQuests as quest}
            <a href="/quests/{quest.id}">
                <Quest quest={quest} />
            </a>
        {/each}
    {/if}
</div>

<style>
    a {
        text-decoration: none;
        margin: 50px;
    }
</style>