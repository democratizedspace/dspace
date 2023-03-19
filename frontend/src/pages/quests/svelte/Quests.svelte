<script>
    import Quest from './Quest.svelte';
    import { onMount } from 'svelte';
    import { questFinished, canStartQuest } from '../../../utils/gameState.js';

    export let quests = [];
    let filteredQuests = [];
    let mounted = false;

    onMount(async () => {
        mounted = true;
    });

    quests.forEach(quest => {
        const finished = questFinished(quest.id);
        console.log("finished: ", finished);
        if (!finished) {
            if (canStartQuest(quest)) {
                console.log("can start quest: ", quest);
                filteredQuests.push(quest);
            }
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