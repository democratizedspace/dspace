<script>
    import { onDestroy, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import Chip from '../../../components/svelte/Chip.svelte';
    import BuySell from '../../../components/svelte/BuySell.svelte';
    import {
        getProcessesForItem,
        getProcessesForItemIncludingCustom,
        ProcessItemTypes,
    } from '../../../utils/gameState/processes.js';
    import { getContainedItemCounts, getItemCounts } from '../../../utils/gameState/inventory.js';
    import { getQuestsForItem } from '../../../utils/itemDependencies.js';
    import Process from '../../../components/svelte/Process.svelte';
    import CompactItemList from '../../../components/svelte/CompactItemList.svelte';
    import { getItemById, getItemMap } from '../../../utils/itemResolver.js';

    export let itemId;

    let itemList = [{ id: itemId }];

    const mounted = writable(false);
    const count = writable(0);

    let item = null;
    let isLoading = true;
    let itemNotFound = false;
    let releaseImage = null;
    let containedItemCounts = [];

    let processes = {};
    const quests = getQuestsForItem(itemId);
    let hasProcesses = false;

    const processGroups = [
        { key: ProcessItemTypes.REQUIRE_ITEM, label: 'Required for processes' },
        { key: ProcessItemTypes.CONSUME_ITEM, label: 'Consumed by processes' },
        { key: ProcessItemTypes.CREATE_ITEM, label: 'Created by processes' },
    ];

    const hasQuests = quests.requires.length > 0 || quests.rewards.length > 0;

    $: hasProcesses = Object.values(processes).some((arr) => Array.isArray(arr) && arr.length > 0);

    async function loadItem() {
        isLoading = true;
        itemNotFound = false;

        if (releaseImage) {
            releaseImage();
            releaseImage = null;
        }

        const resolved = await getItemById(itemId);

        if (!resolved) {
            item = null;
            itemNotFound = true;
            isLoading = false;
            return;
        }

        item = resolved;
        releaseImage = resolved.releaseImage ?? null;
        isLoading = false;
    }

    async function loadContainedItemCounts() {
        if (!item || !item.itemCounts || typeof item.itemCounts !== 'object') {
            containedItemCounts = [];
            return;
        }

        const trackedItemIds = Object.keys(item.itemCounts);

        if (trackedItemIds.length === 0) {
            containedItemCounts = [];
            return;
        }

        const counts = getContainedItemCounts(item.id, trackedItemIds);
        const itemMap = await getItemMap(trackedItemIds);

        containedItemCounts = trackedItemIds.map((trackedItemId) => ({
            id: trackedItemId,
            name: itemMap.get(trackedItemId)?.name ?? trackedItemId,
            count: Number(counts[trackedItemId] || 0),
        }));
    }

    onMount(async () => {
        await loadItem();
        try {
            processes = await getProcessesForItemIncludingCustom(itemId);
        } catch (error) {
            processes = getProcessesForItem(itemId);
        }
        const itemCount = getItemCounts([{ id: itemId }])[itemId];
        count.set(itemCount);
        await loadContainedItemCounts();
        mounted.set(true);
    });

    onDestroy(() => {
        releaseImage?.();
    });
</script>

{#if $mounted}
    <Chip inverted={true} text="" dataTestId="item-page-detail-chip">
        {#if isLoading}
            <div class="vertical">
                <p class="placeholder">Loading item…</p>
            </div>
        {:else if itemNotFound}
            <div class="vertical">
                <p class="placeholder">Item not found.</p>
            </div>
        {:else if item}
            <div class="vertical">
                <img src={item.image} alt={item.name} />
                <h2>{item.name}</h2>
                <CompactItemList {itemList} inverted={true} />
                {#if containedItemCounts.length > 0}
                    <p>Stored contents:</p>
                    <ul>
                        {#each containedItemCounts as containedItem}
                            <li>{containedItem.name}: {containedItem.count}</li>
                        {/each}
                    </ul>
                {/if}
                {item.description}
                <BuySell {itemId} />
                {#if hasProcesses}
                    <p>Processes:</p>
                {/if}
                {#each processGroups as group}
                    {@const groupProcesses = processes[group.key] ?? []}
                    {#if groupProcesses.length > 0}
                        <details class="process-group">
                            <summary>
                                <span>{group.label}</span>
                                <span class="count">{groupProcesses.length}</span>
                            </summary>
                            <div class="details-content">
                                {#each groupProcesses as processId}
                                    <Process inverted={false} {processId} />
                                {/each}
                            </div>
                        </details>
                    {/if}
                {/each}
                {#if hasQuests}
                    <p>Quests:</p>
                {/if}
                {#if quests.requires.length > 0}
                    <p>Required in:</p>
                    <ul>
                        {#each quests.requires as qid}
                            <li>{qid}</li>
                        {/each}
                    </ul>
                {/if}
                {#if quests.rewards.length > 0}
                    <p>Rewards in:</p>
                    <ul>
                        {#each quests.rewards as qid}
                            <li>{qid}</li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {/if}
    </Chip>
{/if}

<style>
    .vertical {
        display: flex;
        flex-direction: column;
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

    .placeholder {
        color: #d0ffd0;
    }

    .process-group {
        width: 100%;
        max-width: 660px;
        margin: 8px 0;
        border: 1px solid rgba(200, 255, 200, 0.5);
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.12);
        overflow: hidden;
    }

    .process-group summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 14px;
        cursor: pointer;
        font-weight: 700;
        list-style: none;
    }

    .process-group summary::-webkit-details-marker {
        display: none;
    }

    .process-group summary::before {
        content: '▸';
        font-size: 0.9rem;
        margin-right: 8px;
        transition: transform 220ms ease;
    }

    .process-group[open] summary::before {
        transform: rotate(90deg);
    }

    .process-group .count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.8rem;
        height: 1.8rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(200, 255, 200, 0.5);
        font-size: 0.9rem;
        padding: 0 8px;
    }

    .details-content {
        padding: 0 10px 0;
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transition:
            max-height 260ms ease,
            opacity 260ms ease,
            padding 260ms ease;
    }

    .process-group[open] .details-content {
        max-height: 2000px;
        opacity: 1;
        padding: 0 10px 10px;
    }
</style>
