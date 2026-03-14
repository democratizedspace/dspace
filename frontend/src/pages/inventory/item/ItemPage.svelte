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
        {
            type: ProcessItemTypes.REQUIRE_ITEM,
            title: 'Required by processes',
            description: 'Must be in inventory to run the process, but is not consumed.',
        },
        {
            type: ProcessItemTypes.CONSUME_ITEM,
            title: 'Consumed by processes',
            description: 'Used up when the process runs.',
        },
        {
            type: ProcessItemTypes.CREATE_ITEM,
            title: 'Created by processes',
            description: 'Produced when the process completes.',
        },
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
                    {@const processIds = processes[group.type]}
                    {#if Array.isArray(processIds) && processIds.length > 0}
                        <details class="process-group">
                            <summary>
                                <span>{group.title}</span>
                                <span class="count">({processIds.length})</span>
                            </summary>
                            <div class="process-group-content">
                                <div class="process-group-content-inner">
                                    <p class="process-group-description">{group.description}</p>
                                    {#each processIds as processId}
                                        <Process inverted={false} {processId} />
                                    {/each}
                                </div>
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
        width: min(100%, 680px);
        border: 2px solid rgba(148, 255, 166, 0.45);
        border-radius: 14px;
        background: rgba(124, 228, 124, 0.15);
        margin: 8px 0;
    }

    .process-group summary {
        list-style: none;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        font-weight: 700;
        padding: 12px 16px;
    }

    .process-group summary::-webkit-details-marker {
        display: none;
    }

    .process-group summary::marker {
        content: '';
    }

    .process-group summary::after {
        content: '▾';
        font-size: 1rem;
        line-height: 1;
        transition: transform 0.2s ease;
    }

    .process-group[open] summary::after {
        transform: rotate(180deg);
    }

    .process-group .count {
        margin-right: auto;
        font-weight: 500;
        opacity: 0.9;
    }

    .process-group-content {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows 0.25s ease;
    }

    .process-group[open] .process-group-content {
        grid-template-rows: 1fr;
    }

    .process-group-content-inner {
        overflow: hidden;
        padding: 0 12px;
    }

    .process-group[open] .process-group-content-inner {
        padding: 0 12px 12px;
    }

    .process-group-description {
        margin: 0 0 8px;
        opacity: 0.95;
        font-size: 0.95rem;
    }
</style>
