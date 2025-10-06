<script>
    import { writable } from 'svelte/store';
    import ItemCard from './ItemCard.svelte';
    import Chip from './Chip.svelte';
    import items from '../../pages/inventory/json/items';
    import SearchBar from './SearchBar.svelte';
    import Sorter from './Sorter.svelte';
    import { getPriceStringComponents } from '../../utils.js';
    import { getItemCount } from '../../utils/gameState/inventory.js';

    export let inventory;

    const fullItemList = items.map((item) => ({ ...item }));

    const categories = [...new Set(fullItemList.map((item) => item.category))].sort();

    let inventoryItemList = [];
    let searchResults = [];
    let activeCategories = [];
    let sortConfig = null;

    const filteredItems = writable([]);

    function applyFiltersAndSort() {
        const categorySet = new Set(activeCategories);
        let baseResults = searchResults;

        if (categorySet.size > 0) {
            baseResults = baseResults.filter((item) => categorySet.has(item.category));
        }

        let result = [...baseResults];

        if (sortConfig) {
            const { field, order, func } = sortConfig;
            const getValue =
                typeof func === 'function' ? (item) => func(item) : (item) => item[field];

            result.sort((a, b) => {
                const aValue = getValue(a);
                const bValue = getValue(b);

                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return -1;
                if (bValue == null) return 1;

                if (aValue < bValue) return -1;
                if (aValue > bValue) return 1;
                return 0;
            });

            if (order === 'desc') {
                result.reverse();
            }
        }

        filteredItems.set(result);
    }

    function handleSearch(event) {
        const matches = new Set(event.detail.map((item) => item.id));

        if (matches.size === 0) {
            searchResults = [];
        } else if (matches.size === fullItemList.length) {
            searchResults = inventoryItemList;
        } else {
            searchResults = inventoryItemList.filter((item) => matches.has(item.id));
        }

        applyFiltersAndSort();
    }

    function handleSort({ detail }) {
        sortConfig = detail;
        applyFiltersAndSort();
    }

    function toggleCategory(category) {
        if (activeCategories.includes(category)) {
            activeCategories = activeCategories.filter((value) => value !== category);
        } else {
            activeCategories = [...activeCategories, category];
        }

        applyFiltersAndSort();
    }

    const sorterSortFields = [
        { field: 'name' },
        {
            field: 'price',
            func: (item) => {
                const { price } = getPriceStringComponents(item.price);
                return price;
            },
        },
        {
            field: 'count',
            func: (item) => {
                return getItemCount(item.id);
            },
        },
    ];

    $: {
        inventoryItemList = fullItemList.filter((item) => inventory[item.id] !== undefined);
        searchResults = inventoryItemList;
        applyFiltersAndSort();
    }
</script>

<div class="vertical">
    <SearchBar data={fullItemList} on:search={handleSearch} />

    {#if categories.length > 1}
        <div class="filters" aria-label="Inventory filters">
            <span class="filters-label">Filter by category</span>
            <div class="filters-chips">
                {#each categories as category}
                    <Chip
                        text={category}
                        onClick={() => toggleCategory(category)}
                        inverted={activeCategories.includes(category)}
                        pressed={activeCategories.includes(category)}
                    />
                {/each}
            </div>
        </div>
    {/if}

    <Sorter
        sortFields={[
            { field: 'name' },
            {
                field: 'price',
                func: (item) => {
                    return item.price ? getPriceStringComponents(item.price).price : 0;
                },
            },
            {
                field: 'count',
                func: (item) => {
                    return getItemCount(item.id);
                },
            },
        ]}
        on:sort={handleSort}
    />

    <div class="horizontal">
        {#each $filteredItems as item (item.id)}
            <ItemCard itemId={item.id} count={inventory[item.id]} />
        {/each}
    </div>
</div>

<style>
    .horizontal {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .filters {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .filters-label {
        font-size: 0.9rem;
        color: #d0ffd0;
    }

    .filters-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        justify-content: center;
    }
</style>
