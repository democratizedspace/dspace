<script>
    import { onDestroy, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import Chip from '../../../components/svelte/Chip.svelte';
    import BuySell from '../../../components/svelte/BuySell.svelte';
    import { getProcessesForItem, ProcessItemTypes } from '../../../utils/gameState/processes.js';
    import { getItemCounts } from '../../../utils/gameState/inventory.js';
    import { getQuestsForItem } from '../../../utils/itemDependencies.js';
    import { getItemById, releaseItemImageUrls } from '../../../utils/itemResolver.js';
    import Process from '../../../components/svelte/Process.svelte';
    import CompactItemList from '../../../components/svelte/CompactItemList.svelte';

    export let itemId;

    let itemList = [{ id: itemId }];

    const mounted = writable(false);
    const count = writable(0);

    let item = null;
    let isLoading = true;
    let notFound = false;

    const processes = getProcessesForItem(itemId);
    const quests = getQuestsForItem(itemId);

    const hasProcesses = Object.values(processes).some((arr) => arr.length);
    const hasQuests = quests.requires.length > 0 || quests.rewards.length > 0;

    onMount(async () => {
        isLoading = true;
        notFound = false;
        item = await getItemById(itemId, { trackUsage: true });
        isLoading = false;
        notFound = !item;
        const itemCount = getItemCounts([{ id: itemId }])[itemId];
        count.set(itemCount);
        mounted.set(true);
    });

    onDestroy(() => {
        releaseItemImageUrls([itemId]);
    });
</script>

{#if $mounted && isLoading}
    <Chip inverted={true} text="">
        <div class="vertical">
            <div class="image-placeholder" aria-label="Loading item image"></div>
            <h2>Loading item…</h2>
        </div>
    </Chip>
{:else if $mounted && notFound}
    <Chip inverted={true} text="">
        <div class="vertical">
            <h2>Item not found</h2>
            <p>We couldn't find this item in the catalog.</p>
        </div>
    </Chip>
{:else if $mounted && item}
    <Chip inverted={true} text="">
        <div class="vertical">
            {#if item.image}
                <img src={item.image} alt={item.name} />
            {:else}
                <div class="image-placeholder" aria-label="Item image unavailable"></div>
            {/if}
            <h2>{item.name}</h2>
            <CompactItemList {itemList} inverted={true} />
            {item.description}
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

    .image-placeholder {
        width: 200px;
        height: 200px;
        border-radius: 20px;
        margin: 10px;
        background: rgba(255, 255, 255, 0.2);
    }

    p {
        margin: 5px;
    }
</style>
