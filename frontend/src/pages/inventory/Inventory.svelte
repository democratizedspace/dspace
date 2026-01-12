<script>
    import { state } from '../../utils/gameState/common.js';
    import ItemList from '../../components/svelte/ItemList.svelte';
    import items from './json/items';
    import { onMount } from 'svelte';
    import { db, ENTITY_TYPES } from '../../utils/customcontent.js';

    let showAllItems = false;
    let currentInventory = {};
    let isClientSide = false;
    let allItems = {};

    // Use onMount to ensure this code only runs in the browser after hydration
    onMount(() => {
        isClientSide = true;

        const buildInventoryMap = (itemList) =>
            itemList.reduce((acc, item) => {
                acc[item.id] = {
                    count: $state.inventory[item.id] ? $state.inventory[item.id].count : 0,
                };
                return acc;
            }, {});

        // Initialize allItems with all available items from the items list
        allItems = buildInventoryMap(items);

        db.list(ENTITY_TYPES.ITEM)
            .then((customItems) => {
                const mergedItems = [...items, ...customItems];
                allItems = buildInventoryMap(mergedItems);
            })
            .catch((error) => {
                console.error('Error loading custom items:', error);
            });
    });

    // Reactive statement to update inventory when showAllItems or isClientSide changes
    // The block ensures reactivity tracks both variables
    $: {
        if (isClientSide) {
            currentInventory = showAllItems ? allItems : $state.inventory;
        }
    }
</script>

<div data-hydrated={isClientSide ? 'true' : 'false'}>
    <div class="horizontal">
        <label>
            <input type="checkbox" class="checkbox" bind:checked={showAllItems} /> Show all items
        </label>
    </div>
    {#if isClientSide}
        <ItemList inventory={currentInventory} />
    {:else}
        <div class="loading">Loading inventory...</div>
    {/if}
</div>

<style>
    .horizontal {
        display: flex;
        flex-direction: row;
        align-items: center;
        /* center */
        justify-content: center;
    }

    label {
        margin-bottom: 20px;
    }

    .checkbox {
        transform: scale(2.5);
        cursor: pointer;
        margin: 10px;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        font-style: italic;
        color: #666;
    }
</style>
