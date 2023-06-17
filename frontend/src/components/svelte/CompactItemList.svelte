<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import items from '../../pages/inventory/json/items.json';
    import { getItemCounts } from '../../utils/gameState.js';
    import { prettyPrintNumber } from '../../utils.js';
    import Chip from './Chip.svelte';

    export let itemList = [], increase = false, disabled = false, noRed = false;

    const itemCounts = writable(getItemCounts(itemList));

    let fullItemList = [];
    let isMounted = false;

    function generateFullItemList() {
        return itemList.map((item) => ({
            ...items.find((i) => i.id === item.id), 
            count: item.hasOwnProperty('count') ? Number(item.count.toFixed(5)) : null, 
            total: $itemCounts[item.id]
        }));
    }

    onMount(() => {
        isMounted = true;
        const intervalId = setInterval(() => itemCounts.set(getItemCounts(itemList)), 1000);
        return () => clearInterval(intervalId);
    });

    $: {
        itemCounts.set(getItemCounts(itemList));
        fullItemList = generateFullItemList();
    }
</script>

{#if isMounted}
    <Chip inverted={true} disabled={disabled} text="">
        <div class="vertical">
            {#each fullItemList as item (item.id)}
                <div class="horizontal">
                    <a href={`/inventory/item/${item.id}`}><img src={item.image} class="icon" alt={item.name} /></a>
                    <p class:disabled={disabled || ($itemCounts[item.id] < item.count)}>
                        {prettyPrintNumber($itemCounts[item.id])} 
                        {#if item.count !== null}
                            <span class="{increase ? 'blue' : (noRed ? '' : 'red')}">{increase ? '+' : '/'}{prettyPrintNumber(item.count)}</span>
                        {/if} 
                        x {item.name}
                    </p>
                </div>
            {/each}
        </div>
    </Chip>
{/if}

<style>
    .vertical, .horizontal {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .vertical { flex-direction: column; }
    .horizontal { flex-direction: row; }

    .icon {
        width: 30px;
        height: 30px;
        object-fit: cover;
        margin: 5px;
        border-radius: 20px;
    }
    
    p {
        margin: 0px;
    }

    .blue {
        color: rgb(0, 99, 180);
    }

    .red {
        color: rgb(255, 0, 0);
    }

    .disabled {
        color: rgb(128, 128, 128);
    }
</style>
