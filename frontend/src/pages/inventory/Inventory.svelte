<script>
    import { state } from '../../utils/gameState/common.js';
    import ItemList from '../../components/svelte/ItemList.svelte';
    import Chip from '../../components/svelte/Chip.svelte';
    import items from './json/items';
    import { onMount } from 'svelte';

    let showAllItems = false;
    let currentInventory = {};
    let isClientSide = false;
    let allItems = {};
    const actionButtons = [
        { text: 'Create a new item', href: '/inventory/create' },
        { text: 'Manage items', href: '/inventory/manage' },
    ];

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
    <div class="action-buttons">
        {#each actionButtons as button}
            <Chip text={button.text} href={button.href} inverted={true} />
        {/each}
    </div>
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

    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
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
