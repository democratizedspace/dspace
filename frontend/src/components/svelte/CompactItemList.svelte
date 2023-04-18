<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import items from '../../pages/inventory/json/items.json';
    import { getItemCounts } from '../../utils/gameState.js';
    import { prettyPrintNumber } from '../../utils.js';
    import Chip from './Chip.svelte';

    // schema:
    // {
    //     id: string,
    //     count: number
    // }
    export let itemList = [], increase = false, disabled = false;

    let fullItemList = [];
    const itemCounts = writable(getItemCounts(itemList));

    function generateFullItemList() {
        return itemList.map((item) => {
            const fullItem = items.find((i) => i.id === item.id);
            const count = Number(item.count.toFixed(5));
            return { ...fullItem, count: count, total: $itemCounts[item.id] };
        });
    }

    onMount(() => {
        // Poll localStorage every 1 second and update itemCounts
        const intervalId = setInterval(() => {
            itemCounts.set(getItemCounts(itemList));
        }, 1000);

        // Clear the interval when the component is unmounted
        return () => {
            clearInterval(intervalId);
        };
    });

    $: {
        itemCounts.set(getItemCounts(itemList));
        fullItemList = generateFullItemList();
    }

    const itemMap = new Map(itemList.map((item) => [item.id, item]));
    console.log(itemMap);

</script>

{#if disabled}
    <Chip inverted={true} disabled={true} text="">
        <div class="vertical">
            {#each fullItemList as item (item.id)}
                <div class="horizontal">
                    <a href={`/inventory/item/${item.id}`}><img src={item.image} class="icon" alt={item.name} /></a>
                    {#if increase}
                        <del class="disabled"><p>{prettyPrintNumber($itemCounts[item.id])}<span>+{prettyPrintNumber(item.count)}</span> x {item.name}</p></del>
                    {:else}
                        {#if ($itemCounts[item.id] < item.count)}
                            <del class="disabled"><p><span>{prettyPrintNumber(item.count)}</span>/{prettyPrintNumber($itemCounts[item.id])} x {item.name}</p></del>
                        {:else}
                            <p><span>{prettyPrintNumber(item.count)}</span>/{prettyPrintNumber($itemCounts[item.id])} x {item.name}</p>
                        {/if}
                    {/if}
                </div>
            {/each}
        </div>
    </Chip>
{:else}
    <Chip inverted={true} text="">
        <div class="vertical">
            {#each fullItemList as item (item.id)}
                <div class="horizontal">
                    <a href={`/inventory/item/${item.id}`}><img src={item.image} class="icon" alt={item.name} /></a>
                    {#if increase}
                        <p>{prettyPrintNumber($itemCounts[item.id])}<span class="blue">+{prettyPrintNumber(item.count)}</span> x {item.name}</p>
                    {:else}
                        {#if ($itemCounts[item.id] < item.count)}
                            <p>{prettyPrintNumber(item.count)}/<span class="red">{prettyPrintNumber($itemCounts[item.id])}</span> x {item.name}</p>
                        {:else}
                            <p><span>{prettyPrintNumber(item.count)}</span>/{prettyPrintNumber($itemCounts[item.id])} x {item.name}</p>
                        {/if}
                    {/if}
                </div>
            {/each}
        </div>
    </Chip>
{/if}

<style>
    .vertical {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        /* center items within the flex container */
        justify-content: center;
        align-items: center;
    }

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
