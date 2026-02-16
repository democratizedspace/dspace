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
    import { getItemCounts } from '../../../utils/gameState/inventory.js';
    import { getQuestsForItem } from '../../../utils/itemDependencies.js';
    import Process from '../../../components/svelte/Process.svelte';
    import CompactItemList from '../../../components/svelte/CompactItemList.svelte';
    import { getItemById } from '../../../utils/itemResolver.js';

    export let itemId;

    let itemList = [{ id: itemId }];

    const mounted = writable(false);
    const count = writable(0);

    let item = null;
    let isLoading = true;
    let itemNotFound = false;
    let releaseImage = null;

    let processes = {};
    const quests = getQuestsForItem(itemId);
    let hasProcesses = false;

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

    onMount(async () => {
        await loadItem();
        try {
            processes = await getProcessesForItemIncludingCustom(itemId);
        } catch (error) {
            processes = getProcessesForItem(itemId);
        }
        const itemCount = getItemCounts([{ id: itemId }])[itemId];
        count.set(itemCount);
        mounted.set(true);
    });

    onDestroy(() => {
        releaseImage?.();
    });
</script>

{#if $mounted}
    <Chip inverted={true} text="">
        {#if isLoading}
            <div class="vertical detail-surface">
                <p class="placeholder">Loading item…</p>
            </div>
        {:else if itemNotFound}
            <div class="vertical detail-surface">
                <p class="placeholder">Item not found.</p>
            </div>
        {:else if item}
            <div class="vertical detail-surface">
                <img src={item.image} alt={item.name} />
                <h2>{item.name}</h2>
                <CompactItemList {itemList} inverted={true} />
                <p class="description">{item.description}</p>
                <BuySell {itemId} />
                {#if hasProcesses}
                    <p>Processes:</p>
                {/if}
                {#if processes[ProcessItemTypes.REQUIRE_ITEM]}
                    {#each processes[ProcessItemTypes.REQUIRE_ITEM] as processId}
                        <Process inverted={false} {processId} />
                    {/each}
                {/if}
                {#if processes[ProcessItemTypes.CONSUME_ITEM]}
                    {#each processes[ProcessItemTypes.CONSUME_ITEM] as processId}
                        <Process inverted={false} {processId} />
                    {/each}
                {/if}
                {#if processes[ProcessItemTypes.CREATE_ITEM]}
                    {#each processes[ProcessItemTypes.CREATE_ITEM] as processId}
                        <Process inverted={false} {processId} />
                    {/each}
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
        background-color: rgba(8, 38, 8, 0.76);
        color: #f5fff5;
        border-radius: 16px;
        border: 1px solid rgba(176, 255, 176, 0.35);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
        padding: 1rem;
        max-width: min(44rem, 100%);
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

    .description {
        text-align: center;
    }
</style>
