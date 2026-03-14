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

    const hasQuests = quests.requires.length > 0 || quests.rewards.length > 0;

    const processSectionConfig = [
        {
            type: ProcessItemTypes.REQUIRE_ITEM,
            title: 'Required by processes',
            helper: 'Needed to run (not consumed)',
        },
        {
            type: ProcessItemTypes.CONSUME_ITEM,
            title: 'Consumed by processes',
            helper: 'Spent when the process runs',
        },
        {
            type: ProcessItemTypes.CREATE_ITEM,
            title: 'Created by processes',
            helper: 'Produced as output',
        },
    ];

    $: hasProcesses = Object.values(processes).some((arr) => Array.isArray(arr) && arr.length > 0);
    $: processSections = processSectionConfig
        .map((section) => ({
            ...section,
            processIds: processes[section.type] ?? [],
        }))
        .filter((section) => section.processIds.length > 0);

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
                {#each processSections as section}
                    <details class="process-group" data-testid={`process-group-${section.type}`}>
                        <summary>
                            <span class="process-group-title">{section.title}</span>
                            <span class="process-group-meta">
                                {section.processIds.length} {section.processIds.length === 1
                                    ? 'process'
                                    : 'processes'}
                            </span>
                        </summary>
                        <p class="process-group-helper">{section.helper}</p>
                        <div class="process-group-body">
                            <div class="process-group-content">
                                {#each section.processIds as processId}
                                    <Process inverted={false} {processId} />
                                {/each}
                            </div>
                        </div>
                    </details>
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
        width: min(100%, 780px);
        margin: 8px 0;
        border-radius: 14px;
        border: 1px solid rgba(181, 255, 181, 0.55);
        background: rgba(0, 69, 0, 0.36);
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .process-group summary {
        list-style: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 14px;
        font-weight: 700;
        text-align: left;
        user-select: none;
    }

    .process-group summary::-webkit-details-marker {
        display: none;
    }

    .process-group summary::after {
        content: '▸';
        margin-left: auto;
        transition: transform 180ms ease;
    }

    .process-group[open] summary::after {
        transform: rotate(90deg);
    }

    .process-group-title {
        font-size: 1rem;
    }

    .process-group-meta {
        opacity: 0.85;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .process-group-helper {
        margin: 0;
        padding: 0 14px 8px;
        font-size: 0.85rem;
        opacity: 0.85;
        text-align: left;
    }

    .process-group-body {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows 220ms ease;
    }

    .process-group[open] .process-group-body {
        grid-template-rows: 1fr;
    }

    .process-group-content {
        overflow: hidden;
        padding: 0 8px 10px;
    }
</style>
