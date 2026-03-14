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
            key: ProcessItemTypes.REQUIRE_ITEM,
            title: 'Required by processes',
            description:
                'This item must be in your inventory to start these processes, but it is not consumed.',
        },
        {
            key: ProcessItemTypes.CONSUME_ITEM,
            title: 'Consumed by processes',
            description: 'These processes use up this item when they run.',
        },
        {
            key: ProcessItemTypes.CREATE_ITEM,
            title: 'Created by processes',
            description: 'These processes produce this item as an output.',
        },
    ];

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
                    <div class="process-groups" data-testid="process-groups">
                        {#each processSectionConfig as section}
                            {@const sectionProcesses = processes[section.key] ?? []}
                            {#if sectionProcesses.length > 0}
                                <details class="process-group">
                                    <summary>
                                        <span>{section.title}</span>
                                        <span class="process-count"
                                            >({sectionProcesses.length})</span
                                        >
                                    </summary>
                                    <div class="process-group-content">
                                        <p class="process-group-description">
                                            {section.description}
                                        </p>
                                        {#each sectionProcesses as processId}
                                            <Process inverted={false} {processId} />
                                        {/each}
                                    </div>
                                </details>
                            {/if}
                        {/each}
                    </div>
                {/if}
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

    .process-groups {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.25rem;
    }

    .process-group {
        width: min(100%, 680px);
        background: rgba(205, 255, 205, 0.2);
        border: 1px solid rgba(208, 255, 208, 0.45);
        border-radius: 0.75rem;
        overflow: hidden;
    }

    .process-group summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 0.85rem;
        font-weight: 700;
        cursor: pointer;
        list-style: none;
    }

    .process-group summary::-webkit-details-marker {
        display: none;
    }

    .process-group summary::before {
        content: '▸';
        margin-right: 0.35rem;
        transition: transform 180ms ease;
    }

    .process-group[open] summary::before {
        transform: rotate(90deg);
    }

    .process-count {
        color: #d0ffd0;
        font-size: 0.9rem;
    }

    .process-group-content {
        display: grid;
        grid-template-rows: 0fr;
        opacity: 0;
        transition:
            grid-template-rows 220ms ease,
            opacity 220ms ease;
    }

    .process-group-content > :global(*) {
        min-height: 0;
    }

    .process-group[open] .process-group-content {
        grid-template-rows: 1fr;
        opacity: 1;
    }

    .process-group-content :global(.process-container),
    .process-group-description {
        margin-inline: 0.75rem;
    }

    .process-group-description {
        margin-top: 0.2rem;
        margin-bottom: 0.6rem;
        color: #d0ffd0;
        font-size: 0.9rem;
        text-align: left;
    }
</style>
