<script>
    import Quest from './Quest.svelte';

    export let quests = [];

    import { onMount } from 'svelte';

    onMount(() => {
        quests.forEach(quest => {
            startingDialogue[quest.id] = quest.start;
            dialogue[quest.id] = quest.dialogue.find(d => d.id === quest.start);
        });
    });
</script>

<div class="container">
    <h3>Up Next</h3>

    {#each quests as quest}
        {#if !quest.dismissed}
        <a href="/quests/{quest.id}">
            <Quest quest={quest} />
        </a>
        {/if}
    {/each}
</div>

<style>
    a {
        text-decoration: none;
        margin: 50px;
    }
</style>