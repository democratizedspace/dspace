<script>
    import { onDestroy, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { ready, isGameStateReady } from '../../utils/gameState/common.js';
    import { getItemCounts } from '../../utils/gameState/inventory.js';
    import { prettyPrintNumber } from '../../utils.js';
    import { buildFullItemList } from './compactItemListHelpers.js';
    import { getItemMap, releaseItemImages, retainItemImages } from '../../utils/itemResolver.js';
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
    let countsReady = false;
    let itemMetadataMap = new Map();
    let resolvedItemIds = [];
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

    async function updateItemMetadata() {
        const ids = Array.from(
            new Set(itemList.map((entry) => getStableItemId(entry)).filter(Boolean))
        );
        const metadata = await getItemMap(ids);
        itemMetadataMap = metadata;

        const nextResolvedIds = Array.from(metadata.keys());
        releaseItemImages(resolvedItemIds.filter((id) => !nextResolvedIds.includes(id)));
        retainItemImages(nextResolvedIds.filter((id) => !resolvedItemIds.includes(id)));
        resolvedItemIds = nextResolvedIds;
    }

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

        updateItemMetadata();

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
        };
    });

    onDestroy(() => {
        releaseItemImages(resolvedItemIds);
    });

    // Reactive updates
    $: if (isMounted) {
        updateItemMetadata();
    }

    $: {
        if (countsReady) {
            itemCounts.set(getItemCounts(itemList));
        }
        fullItemList = buildFullItemList(itemList, $itemCounts, itemMetadataMap);
    }
</script>

{#if isMounted}
    {#if !isEmpty}
        <div class="Container">
            <Chip inverted={!inverted} {disabled} text="">
                <div class="vertical">
                    {#each fullItemList as item, index (getItemKey(item, index))}
                        <div class="horizontal">
                            {#if item.image}
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
                            {:else}
                                <a
                                    href={`/inventory/item/${item.id}`}
                                    class="icon-link"
                                    aria-label={item.isLoading
                                        ? 'Loading item'
                                        : `View ${item.name}`}
                                >
                                    <span class="icon placeholder" aria-hidden="true"></span>
                                </a>
                            {/if}

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

    .icon.placeholder {
        display: inline-block;
        background: rgba(255, 255, 255, 0.15);
        border: 1px dashed rgba(255, 255, 255, 0.4);
    }

    .icon-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    p {
        margin: 0px;
        margin-top: 10px;
    }

    .disabled {
        color: rgb(0, 0, 0);
    }
</style>
