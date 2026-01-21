<script>
    import { state } from '../../utils/gameState/common.js';
    import ItemList from '../../components/svelte/ItemList.svelte';
    import Chip from '../../components/svelte/Chip.svelte';
    import builtInItems from './json/items';
    import { getMergedItemCatalog } from '../../utils/itemCatalog.js';
    import { onMount } from 'svelte';

    let showAllItems = false;
    let currentInventory = {};
    let isClientSide = false;
    let allItems = {};
    let fullItemList = builtInItems;
    const actionButtons = [
        { text: 'Create a new item', href: '/inventory/create' },
        { text: 'Manage items', href: '/inventory/manage' },
    ];

    const getInventoryCount = (entry) => {
        if (typeof entry === 'number') {
            return entry;
        }
        if (entry && typeof entry.count === 'number') {
            return entry.count;
        }
        return 0;
    };

    const getNonZeroInventory = (inventory) => {
        return Object.entries(inventory ?? {}).reduce((acc, [id, entry]) => {
            const count = getInventoryCount(entry);
            if (count > 0) {
                acc[id] = count;
            }
            return acc;
        }, {});
    };

    // Use onMount to ensure this code only runs in the browser after hydration
    onMount(async () => {
        isClientSide = true;

        const mergedItems = await getMergedItemCatalog({ builtInItems });
        fullItemList = mergedItems;
    });

    $: if (isClientSide) {
        allItems = fullItemList.reduce((acc, item) => {
            acc[item.id] = getInventoryCount($state.inventory[item.id]);
            return acc;
        }, {});
    }

    // Reactive statement to update inventory when showAllItems or isClientSide changes
    // The block ensures reactivity tracks both variables
    $: {
        if (isClientSide) {
            currentInventory = showAllItems ? allItems : getNonZeroInventory($state.inventory);
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
        <ItemList inventory={currentInventory} items={fullItemList} />
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

    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
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
