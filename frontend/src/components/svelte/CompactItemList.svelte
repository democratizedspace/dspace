<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { getItemCounts } from '../../utils/gameState/inventory.js';
    import { ready, isGameStateReady } from '../../utils/gameState/common.js';
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
    let countsReady = isGameStateReady();
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

    const refreshItemCounts = () => itemCounts.set(getItemCounts(itemList));

    // Initial setup and cleanup on mount
    onMount(async () => {
        isMounted = true;
        const intervalId = setInterval(refreshItemCounts, 1000);
        await ready;
        countsReady = true;
        refreshItemCounts();
        return () => clearInterval(intervalId);
    });

    // Reactive updates
    $: {
        refreshItemCounts();
        fullItemList = buildFullItemList(itemList, $itemCounts);
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
                                class:disabled={disabled || $itemCounts[item.id] < item.count}
                                class:inverted
                            >
                                {#if increase}
                                    {#if countsReady}
                                        {prettyPrintNumber($itemCounts[item.id])}
                                    {:else}
                                        <span class="count-placeholder" aria-label="Loading count" />
                                    {/if}
                                    {#if item.count !== null}
                                        <span class="qty">
                                            +{prettyPrintNumber(item.count)}
                                        </span>
                                    {/if}
                                {:else if decrease}
                                    {#if countsReady}
                                        {prettyPrintNumber($itemCounts[item.id])}
                                    {:else}
                                        <span class="count-placeholder" aria-label="Loading count" />
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
                                    {#if countsReady}
                                        <span class="qty">
                                            {prettyPrintNumber($itemCounts[item.id])}
                                        </span>
                                    {:else}
                                        <span class="count-placeholder" aria-label="Loading count" />
                                    {/if}
                                {:else}
                                    {#if countsReady}
                                        {prettyPrintNumber($itemCounts[item.id])}
                                    {:else}
                                        <span class="count-placeholder" aria-label="Loading count" />
                                    {/if}
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

    .count-placeholder {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.4ch;
        height: 1em;
        margin-right: 4px;
        vertical-align: middle;
    }

    .count-placeholder::after {
        content: '';
        width: 0.85em;
        height: 0.85em;
        border-radius: 999px;
        border: 2px solid rgba(255, 255, 255, 0.45);
        border-top-color: transparent;
        animation: spinner 0.8s linear infinite;
    }

    @keyframes spinner {
        to {
            transform: rotate(360deg);
        }
    }
</style>
