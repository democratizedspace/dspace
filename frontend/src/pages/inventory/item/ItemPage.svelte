<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import Chip from '../../../components/svelte/Chip.svelte';
    import BuySell from '../../../components/svelte/BuySell.svelte';
    import { getItemCounts } from '../../../utils/gameState.js';
    import items from '../json/items.json';
    
    export let itemId;
    
    const mounted = writable(false);
    const count = writable(0);

    const item = items.find(item => item.id === itemId);
    
    onMount(() => {
        const itemCount = getItemCounts([{ id: itemId }])[itemId];
        count.set(itemCount);
        mounted.set(true);
    });
</script>

{#if $mounted}
    <Chip inverted={true} text="">
        <div class="vertical">
            <div class="horizontal">
                <img src={item.image} alt={item.name} />
                <div class="vertical">
                    <h2>{item.name}</h2>
                    <p>Count: {$count}</p>
                </div>
            </div>
            <BuySell itemId={itemId} />
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
