<script>
    import { onMount } from 'svelte';
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
    import { db, ENTITY_TYPES } from '../../../utils/customcontent.js';
    import items from '../json/items';
    import Process from '../../../components/svelte/Process.svelte';
    import CompactItemList from '../../../components/svelte/CompactItemList.svelte';

    export let itemId;

    let itemList = [{ id: itemId }];

    const mounted = writable(false);
    const count = writable(0);

    let item = items.find((item) => item.id === itemId);

    let processes = {};
    const quests = getQuestsForItem(itemId);

    const hasQuests = quests.requires.length > 0 || quests.rewards.length > 0;

    $: hasProcesses = Object.values(processes).some(
        (arr) => Array.isArray(arr) && arr.length > 0
    );

    onMount(async () => {
        if (!item) {
            try {
                item = await db.get(ENTITY_TYPES.ITEM, itemId);
            } catch (error) {
                item = null;
            }
        }
        try {
            processes = await getProcessesForItemIncludingCustom(itemId);
        } catch (error) {
            processes = getProcessesForItem(itemId);
        }
        const itemCount = getItemCounts([{ id: itemId }])[itemId];
        count.set(itemCount);
        mounted.set(true);
    });
</script>

{#if $mounted && item}
    <Chip inverted={true} text="">
        <div class="vertical">
            <img src={item.image} alt={item.name} />
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

    p {
        margin: 5px;
    }
</style>
