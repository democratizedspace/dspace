<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import Chip from '../../../components/svelte/Chip.svelte';
    import BuySell from '../../../components/svelte/BuySell.svelte';
    import { getProcessesForItem, ProcessItemTypes } from '../../../utils/gameState/processes.js';
    import { getQuestsForItem } from '../../../utils/itemDependencies.js';
    import Process from '../../../components/svelte/Process.svelte';
    import CompactItemList from '../../../components/svelte/CompactItemList.svelte';
    import {
        getCachedItemById,
        getItemById,
        releaseItemImages,
        retainItemImages,
    } from '../../../utils/itemResolver.js';

    export let itemId;

    let itemList = [{ id: itemId }];

    const mounted = writable(false);

    let item = getCachedItemById(itemId);
    let status = item ? 'ready' : 'loading';

    const processes = getProcessesForItem(itemId);
    const quests = getQuestsForItem(itemId);

    const hasProcesses = Object.values(processes).some((arr) => arr.length);
    const hasQuests = quests.requires.length > 0 || quests.rewards.length > 0;

    onMount(() => {
        let isActive = true;
        mounted.set(true);

        const loadItem = async () => {
            const resolved = await getItemById(itemId);
            if (!isActive) {
                return;
            }

            if (resolved) {
                item = resolved;
                status = 'ready';
                retainItemImages([itemId]);
            } else {
                item = null;
                status = 'missing';
            }
        };

        loadItem();

        return () => {
            isActive = false;
            releaseItemImages([itemId]);
        };
    });
</script>

{#if $mounted}
    {#if status === 'loading'}
        <Chip inverted={true} text="">
            <div class="vertical">
                <p>Loading item…</p>
            </div>
        </Chip>
    {:else if status === 'missing'}
        <Chip inverted={true} text="">
            <div class="vertical" data-testid="item-not-found">
                <p>Item not found.</p>
            </div>
        </Chip>
    {:else if item}
        <Chip inverted={true} text="">
            <div class="vertical">
                <img src={item.image} alt={item.name} data-testid="item-hero-image" />
                <h2 data-testid="item-hero-title">{item.name}</h2>
                <div data-testid="item-compact-list">
                    <CompactItemList {itemList} inverted={true} />
                </div>
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
