<script>
    import { state } from '../../utils/gameState/common.js';
    import ItemList from '../../components/svelte/ItemList.svelte';
    import items from './json/items.json';
    import { onMount } from 'svelte';

    let showAllItems = false;
    let currentInventory = {};
    let isClientSide = false;
    let allItems = {};

    // Use onMount to ensure this code only runs in the browser after hydration
    onMount(() => {
        isClientSide = true;

        // Initialize allItems with all available items from the items list
        allItems = items.reduce((acc, item) => {
            acc[item.id] = {
                count: $state.inventory[item.id] ? $state.inventory[item.id].count : 0,
            };
            return acc;
        }, {});

        // Set initial inventory state
        updateInventorySource();
    });

    // Function to update the inventory source based on the showAllItems toggle
    function updateInventorySource() {
        if (!isClientSide) return;
        currentInventory = showAllItems ? allItems : $state.inventory;
    }

    // Reactive statement to update inventory when state changes or toggle is flipped
    $: if (isClientSide) {
        updateInventorySource();
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
