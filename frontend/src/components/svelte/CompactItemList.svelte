<script>
    import { onDestroy, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { ready, isGameStateReady } from '../../utils/gameState/common.js';
    import { getItemCounts } from '../../utils/gameState/inventory.js';
    import { prettyPrintNumber } from '../../utils.js';
    import { buildFullItemList } from './compactItemListHelpers.js';
    import { getItemMap } from '../../utils/itemResolver.js';
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
    let metadataMap = new Map();
    let metadataRequestId = 0;
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

    $: containerNames = fullItemList.reduce((names, item) => {
        const stableId = getStableItemId(item);
        if (!stableId || !item?.name) {
            return names;
        }

        names.set(stableId, item.name);
        return names;
    }, new Map());

    const getContainerName = (item) => {
        if (!item?.containerItemId) {
            return null;
        }

        const containerKey = String(item.containerItemId);
        return containerNames.get(containerKey) ?? 'required container';
    };
    const getItemKey = (item, index) => {
        const stableId = getStableItemId(item);
        const occurrences = stableId ? (itemKeyCounts.get(stableId) ?? 0) : 0;

        if (stableId && occurrences === 1) {
            return stableId;
        }

        return `index-${index}`;
    };

    const releaseItemImages = (items) => {
        items.forEach((item) => item?.releaseImage?.());
    };

    const getIdsKey = (list) => list.map((item) => getStableItemId(item)).join('|');

    let previousIdsKey = '';

    async function loadItemMetadata() {
        const requestId = ++metadataRequestId;
        const ids = itemList.map((item) => item.id);
        const map = await getItemMap(ids);

        if (!isMounted || requestId !== metadataRequestId) {
            releaseItemImages(Array.from(map.values()));
            return;
        }

        releaseItemImages(fullItemList);
        metadataMap = map;
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
        releaseItemImages(fullItemList);
    });

    // Reactive updates
    $: {
        if (countsReady) {
            itemCounts.set(getItemCounts(itemList));
        }
        fullItemList = buildFullItemList(itemList, $itemCounts, metadataMap);
    }

    $: if (isMounted) {
        const nextIdsKey = getIdsKey(itemList);
        if (nextIdsKey !== previousIdsKey) {
            previousIdsKey = nextIdsKey;
            loadItemMetadata();
        }
    }
</script>

{#if isMounted}
    {#if !isEmpty}
        <div class="Container">
            <Chip inverted={!inverted} {disabled} text="">
                <div class="vertical">
                    {#each fullItemList as item, index (getItemKey(item, index))}
                        <div class="horizontal" class:nested-requirement={Boolean(item.containerItemId)}>
                            {#if item.loading}
                                <span class="icon placeholder" aria-label="Loading item image">
                                    <span class="spinner" aria-hidden="true"></span>
                                </span>
                            {:else}
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
                                x {item.name}
                                {#if item.containerItemId}
                                    <span class="container-context">(in {getContainerName(item)})</span>
                                {/if}
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

    .nested-requirement {
        margin-left: 20px;
        padding-left: 10px;
        border-left: 2px solid rgba(0, 0, 0, 0.25);
    }

    .icon {
        width: 30px;
        height: 30px;
        object-fit: cover;
        margin: 5px;
        border-radius: 20px;
    }

    .icon.placeholder {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.08);
        border: 1px dashed rgba(255, 255, 255, 0.35);
        box-sizing: border-box;
    }

    p {
        margin: 0px;
        margin-top: 10px;
    }

    .disabled {
        color: rgba(0, 0, 0, 0.72);
    }

    .disabled.inverted {
        color: rgba(255, 255, 255, 0.78);
    }

    .inverted {
        color: rgb(255, 255, 255);
    }

    .container-context {
        margin-left: 6px;
        font-size: 0.9em;
        opacity: 0.85;
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
