<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import Chip from '../../../components/svelte/Chip.svelte';
    import BuySell from '../../../components/svelte/BuySell.svelte';
    import { getItemCounts, getProcessesForItem, ProcessItemTypes } from '../../../utils/gameState.js';
    import items from '../json/items.json';
    import Process from '../../../components/svelte/Process.svelte';
    
    export let itemId;
    
    const mounted = writable(false);
    const count = writable(0);

    const item = items.find(item => item.id === itemId);

    const processes = getProcessesForItem(itemId);

    const hasProcesses = Object.values(processes).some(arr => arr.length);
    
    onMount(() => {
        const itemCount = getItemCounts([{ id: itemId }])[itemId];
        count.set(itemCount);
        mounted.set(true);
    });
</script>

{#if $mounted}
    <Chip inverted={true} text="">
        <div class="vertical">
            <img src={item.image} alt={item.name} />
            <h2>{item.name}</h2>
            <p>Count: {$count}</p>
            {item.description}
            <BuySell itemId={itemId} />
            {#if hasProcesses}
                <p>Processes:</p>
            {/if}
            {#if processes[ProcessItemTypes.REQUIRE_ITEM]}
                {#each processes[ProcessItemTypes.REQUIRE_ITEM] as processId}
                    <Process inverted={false} {processId} />
                {/each}
            {/if}
            {#if processes[ProcessItemTypes.CONSUME_ITEM]}
                {#each processes[ProcessItemTypes.CONSUME_ITEM] as processId}
                    <Process inverted={false} {processId} />
                {/each}
            {/if}
            {#if processes[ProcessItemTypes.CREATE_ITEM]}
                {#each processes[ProcessItemTypes.CREATE_ITEM] as processId}
                    <Process inverted={false} {processId} />
                {/each}
            {/if}
        </div>
    </Chip>

{/if}

<style>
    .vertical {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    img {
        width: 200px;
        height: 200px;
        border-radius: 20px;
        margin: 10px;
    }

    p {
        margin: 5px;
    }
</style>
