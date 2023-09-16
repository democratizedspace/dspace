<script>
    import Quest from './Quest.svelte';
    import { onMount } from 'svelte';
    import { questFinished, canStartQuest } from '../../../utils/gameState.js';

    export let quests = [];
    let filteredQuests = [], finishedQuests = [];
    let mounted = false;

    onMount(async () => {
        mounted = true;
    });

    quests.forEach(quest => {
        const finished = questFinished(quest.id);
        if (finished) {
            finishedQuests.push(quest);
        } else {
            if (canStartQuest(quest)) {
                filteredQuests.push(quest);
            }
        }
    });
</script>

<div class="container">
    {#if mounted}
        {#each filteredQuests as quest}
            <a href="/quests/{quest.id}">
                <Quest quest={quest} />
            </a>
        {/each}

        {#if finishedQuests.length > 0}
            <h2>Completed Quests</h2>
            {#each finishedQuests as quest}
                <a href="/quests/{quest.id}">
                    <Quest quest={quest} compact={true} />
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
</style>