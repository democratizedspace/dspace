<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { ready, isGameStateReady } from '../../utils/gameState/common.js';
    import { getItemCounts } from '../../utils/gameState/inventory.js';
    import { prettyPrintNumber } from '../../utils.js';
    import { buildFullItemList } from './compactItemListHelpers.js';
    import {
        getCachedItemMap,
        getItemMap,
        releaseItemImages,
        retainItemImages,
    } from '../../utils/itemResolver.js';
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
    let metadataMap = new Map();
    let isMounted = false;
    let metadataRunId = 0;
    let trackedIds = new Set();
    let countsReady = false;
    const itemCounts = writable({});
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

    const getItemIds = (list) =>
        list
            .map((item) => item?.id)
            .filter((id) => typeof id === 'string' || typeof id === 'number');

    const syncMetadataMap = (nextMap) => {
        const nextIds = Array.from(nextMap.keys());
        const isSame =
            nextIds.length === trackedIds.size && nextIds.every((id) => trackedIds.has(id));
        if (!isSame) {
            releaseItemImages(Array.from(trackedIds));
            retainItemImages(nextIds);
            trackedIds = new Set(nextIds);
        }
        metadataMap = nextMap;
    };

    const resolveMetadata = async (list) => {
        const runId = (metadataRunId += 1);
        const resolvedMap = await getItemMap(getItemIds(list));
        if (!isMounted || runId !== metadataRunId) {
            return;
        }
        syncMetadataMap(resolvedMap);
    };

    // Initial setup and cleanup on mount
    onMount(() => {
        isMounted = true;
        let intervalId;
        let isActive = true;
        const startInterval = () => {
            if (!isActive) {
                return;
            }
            itemCounts.set(getItemCounts(itemList));
            intervalId = setInterval(() => itemCounts.set(getItemCounts(itemList)), 1000);
        };

        if (isGameStateReady()) {
            countsReady = true;
            startInterval();
        } else {
            ready.then(() => {
                if (!isActive) {
                    return;
                }
                countsReady = true;
                startInterval();
            });
        }

        return () => {
            isActive = false;
            clearInterval(intervalId);
            releaseItemImages(Array.from(trackedIds));
        };
    });

    // Reactive updates
    $: {
        if (countsReady) {
            itemCounts.set(getItemCounts(itemList));
        }
    }

    $: {
        const ids = getItemIds(itemList);
        if (isMounted) {
            syncMetadataMap(getCachedItemMap(ids));
            resolveMetadata(itemList);
        } else {
            metadataMap = getCachedItemMap(ids);
        }
    }

    $: fullItemList = buildFullItemList(itemList, $itemCounts, metadataMap);
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
                                        {#if item.image && !item.isLoading}
                                            <img src={item.image} class="icon" alt={item.name} />
                                        {:else}
                                            <span class="icon icon-placeholder" aria-hidden="true"
                                            ></span>
                                        {/if}
                                    </a>
                                </span>

                                <span slot="fallback">
                                    {#if item.image && !item.isLoading}
                                        <img src={item.image} class="icon" alt={item.name} />
                                    {:else}
                                        <span class="icon icon-placeholder" aria-hidden="true"
                                        ></span>
                                    {/if}
                                </span>
                            </DelayedRender>

                            <p
                                class:disabled={countsReady &&
                                    (disabled || $itemCounts[item.id] < item.count)}
                                class:inverted
                            >
                                {#if countsReady}
                                    {#if increase}
                                        {prettyPrintNumber($itemCounts[item.id])}
                                        {#if item.count !== null}
                                            <span class="qty">
                                                +{prettyPrintNumber(item.count)}
                                            </span>
                                        {/if}
                                    {:else if decrease}
                                        {prettyPrintNumber($itemCounts[item.id])}
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
                                        <span class="qty">
                                            {prettyPrintNumber($itemCounts[item.id])}
                                        </span>
                                    {:else}
                                        {prettyPrintNumber($itemCounts[item.id])}
                                    {/if}
                                {:else if increase}
                                    <span
                                        class="count-placeholder"
                                        aria-label="Loading inventory count"
                                    >
                                        <span class="spinner" aria-hidden="true"></span>
                                    </span>
                                    {#if item.count !== null}
                                        <span class="qty">
                                            +{prettyPrintNumber(item.count)}
                                        </span>
                                    {/if}
                                {:else if decrease}
                                    <span
                                        class="count-placeholder"
                                        aria-label="Loading inventory count"
                                    >
                                        <span class="spinner" aria-hidden="true"></span>
                                    </span>
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
                                    <span
                                        class="count-placeholder"
                                        aria-label="Loading inventory count"
                                    >
                                        <span class="spinner" aria-hidden="true"></span>
                                    </span>
                                {:else}
                                    <span
                                        class="count-placeholder"
                                        aria-label="Loading inventory count"
                                    >
                                        <span class="spinner" aria-hidden="true"></span>
                                    </span>
                                {/if}
                                x {item.isLoading ? 'Loading item…' : item.name}
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

    .icon-placeholder {
        background-color: rgba(255, 255, 255, 0.6);
        border: 1px solid rgba(0, 0, 0, 0.1);
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
        min-width: 2.4ch;
    }

    .spinner {
        width: 0.7em;
        height: 0.7em;
        border-radius: 999px;
        border: 2px solid var(--spinner-border-color, rgba(255, 255, 255, 0.35));
        border-top-color: var(--spinner-border-top-color, rgba(255, 255, 255, 0.85));
        animation: spin 0.75s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
