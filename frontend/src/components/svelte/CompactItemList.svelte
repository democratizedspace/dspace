<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import items from '../../pages/inventory/json/items';
    import { getItemCounts } from '../../utils/gameState/inventory.js';
    import { prettyPrintNumber } from '../../utils.js';
    import Chip from './Chip.svelte';
    import DelayedRender from './DelayedRender.svelte';

    // Props
    export let itemList = [],
        increase = false,
        decrease = false,
        disabled = false,
        noRed = false,
        inverted = false;

    // Local State
    let fullItemList = [];
    let isMounted = false;
    const itemCounts = writable(getItemCounts(itemList));
    $: isEmpty = Object.values($itemCounts).every((qty) => qty === 0);

    // Generate the full item list with additional properties
    function generateFullItemList() {
        return itemList.map((item) => ({
            ...items.find((i) => i.id === item.id),
            count: Object.prototype.hasOwnProperty.call(item, 'count')
                ? Number(item.count.toFixed(5))
                : null,
            total: $itemCounts[item.id],
        }));
    }

    // Initial setup and cleanup on mount
    onMount(() => {
        isMounted = true;
        const intervalId = setInterval(() => itemCounts.set(getItemCounts(itemList)), 1000);
        return () => clearInterval(intervalId);
    });

    // Reactive updates
    $: {
        itemCounts.set(getItemCounts(itemList));
        fullItemList = generateFullItemList();
    }

    function getQty(count) {
        if (increase) return count;
        if (decrease) return -count;
        return count;
    }
</script>

{#if isMounted}
    {#if !isEmpty}
        <div class="Container">
            <Chip inverted={!inverted} {disabled} text="">
                <div class="vertical">
                    {#each fullItemList as item (item.id)}
                        <div class="horizontal">
                            <DelayedRender delaySeconds={0.1}>
                                <span slot="content">
                                    <a href={`/inventory/item/${item.id}`}>
                                        <img src={item.image} class="icon" alt={item.name} />
                                    </a>
                                </span>

                                <span slot="fallback">
                                    <img src={item.image} class="icon" alt={item.name} />
                                </span>
                            </DelayedRender>

                            <p
                                class:disabled={disabled || $itemCounts[item.id] < item.count}
                                class:inverted
                            >
                                {prettyPrintNumber($itemCounts[item.id])}
                                {#if item.count !== null}
                                    <span
                                        class="qty {getQty(item.count) < 0 && !noRed ? 'neg' : ''}"
                                    >
                                        {#if getQty(item.count) < 0}
                                            −{prettyPrintNumber(Math.abs(getQty(item.count)))}
                                        {:else}
                                            {prettyPrintNumber(getQty(item.count))}
                                        {/if}
                                    </span>
                                {/if}
                                x {item.name}
                            </p>
                        </div>
                    {/each}
                </div>
            </Chip>
        </div>
    {/if}
{/if}

<style>
    .vertical,
    .horizontal {
        display: flex;
    }

    .vertical {
        flex-direction: column;
    }
    .horizontal {
        flex-direction: row;
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
        margin-top: 10px;
    }

    .disabled {
        color: rgb(0, 0, 0);
    }

    .inverted {
        color: rgb(255, 255, 255);
    }

    .qty.neg {
        color: var(--red-500);
        font-weight: 600;
    }
</style>
