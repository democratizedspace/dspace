<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { isGameStateReady, ready } from '../../utils/gameState/common.js';
    import { getItemCounts } from '../../utils/gameState/inventory.js';
    import { prettyPrintNumber } from '../../utils.js';
    import { buildFullItemList } from './compactItemListHelpers.js';
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
    let inventoryReady = isGameStateReady();
    const itemCounts = writable(getItemCounts(itemList));
    $: isEmpty = fullItemList.length === 0;
    const getStableItemId = (item) =>
        typeof item?.id === 'string' || typeof item?.id === 'number' ? String(item.id) : null;
    let itemKeyCounts = new Map();
    $: itemKeyCounts = fullItemList.reduce((counts, item) => {
        const stableId = getStableItemId(item);
        if (!stableId) {
            return counts;
        }

        counts.set(stableId, (counts.get(stableId) ?? 0) + 1);
        return counts;
    }, new Map());
    const getItemKey = (item, index) => {
        const stableId = getStableItemId(item);
        const occurrences = stableId ? (itemKeyCounts.get(stableId) ?? 0) : 0;

        if (stableId && occurrences === 1) {
            return stableId;
        }

        return `index-${index}`;
    };

    // Initial setup and cleanup on mount
    onMount(async () => {
        isMounted = true;
        await ready;
        inventoryReady = true;
        itemCounts.set(getItemCounts(itemList));
        const intervalId = setInterval(() => itemCounts.set(getItemCounts(itemList)), 1000);
        return () => clearInterval(intervalId);
    });

    // Reactive updates
    $: {
        if (inventoryReady) {
            itemCounts.set(getItemCounts(itemList));
        }
        fullItemList = buildFullItemList(itemList, inventoryReady ? $itemCounts : {});
    }
</script>

{#if isMounted}
    {#if !isEmpty}
        <div class="Container">
            <Chip inverted={!inverted} {disabled} text="">
                <div class="vertical">
                    {#each fullItemList as item, index (getItemKey(item, index))}
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
                                class:disabled={
                                    disabled || (inventoryReady && $itemCounts[item.id] < item.count)
                                }
                                class:inverted
                            >
                                {#if increase}
                                    {#if inventoryReady}
                                        {prettyPrintNumber($itemCounts[item.id])}
                                    {:else}
                                        <span
                                            class="count-loading"
                                            aria-label="Loading inventory count"
                                        ></span>
                                    {/if}
                                    {#if item.count !== null}
                                        <span class="qty">
                                            +{prettyPrintNumber(item.count)}
                                        </span>
                                    {/if}
                                {:else if decrease}
                                    {#if inventoryReady}
                                        {prettyPrintNumber($itemCounts[item.id])}
                                    {:else}
                                        <span
                                            class="count-loading"
                                            aria-label="Loading inventory count"
                                        ></span>
                                    {/if}
                                    {#if item.count !== null}
                                        <span class="qty {!noRed ? 'neg' : ''}">
                                            −{prettyPrintNumber(item.count)}
                                        </span>
                                    {/if}
                                {:else if item.count !== null}
                                    <span class="qty">
                                        {prettyPrintNumber(item.count)}
                                    </span>
                                    /
                                    {#if inventoryReady}
                                        <span class="qty">
                                            {prettyPrintNumber($itemCounts[item.id])}
                                        </span>
                                    {:else}
                                        <span
                                            class="count-loading"
                                            aria-label="Loading inventory count"
                                        ></span>
                                    {/if}
                                {:else if inventoryReady}
                                    {prettyPrintNumber($itemCounts[item.id])}
                                {:else}
                                    <span
                                        class="count-loading"
                                        aria-label="Loading inventory count"
                                    ></span>
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

    .count-loading {
        display: inline-block;
        width: 0.8rem;
        height: 0.8rem;
        margin-right: 0.4rem;
        border-radius: 999px;
        border: 2px solid rgba(255, 255, 255, 0.6);
        border-top-color: rgba(255, 255, 255, 0.2);
        animation: spin 0.9s linear infinite;
        vertical-align: middle;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
