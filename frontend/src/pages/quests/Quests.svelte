<script>
    export let quests = [];

    import { onMount } from 'svelte';

    onMount(() => {
        console.log('mounted');
    });
</script>

<div class="container">
    <h3>Up Next</h3>

    {#each quests as quest}
        <div class="quest">
            <h4>{quest.title}</h4>
        </div>
    {/each}
</div>