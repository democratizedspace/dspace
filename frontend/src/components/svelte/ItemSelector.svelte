<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import SearchBar from './SearchBar.svelte';

    export let selectedItemId = '';
    export let label = 'Select Item';
    export let items = []; // Make items a prop instead of importing

    const dispatch = createEventDispatcher();
    const filteredItems = writable(items);
    let isExpanded = !selectedItemId;
    let isClientSide = false;

    onMount(() => {
        isClientSide = true;
    });

    function handleSearch(event) {
        filteredItems.set(event.detail);
    }

    function handleItemSelect(itemId) {
        selectedItemId = itemId;
        isExpanded = false;
        dispatch('select', { itemId });
    }

    function toggleExpanded() {
        isExpanded = !isExpanded;
    }

    // Update filtered items when items prop changes
    $: {
        filteredItems.set(items);
    }

    $: selectedItem = items.find((item) => item.id === selectedItemId);
</script>

<div class="item-selector" data-hydrated={isClientSide ? 'true' : 'false'}>
    <label for="item-select-control">{label}</label>

    {#if isClientSide}
        {#if isExpanded}
            <div class="selector-expanded" id="item-select-control">
                <SearchBar data={items} on:search={handleSearch} />
                <div class="items-list" role="listbox">
                    {#each $filteredItems as item (item.id)}
                        <div
                            class="item-row"
                            class:selected={selectedItemId === item.id}
                            on:click={() => handleItemSelect(item.id)}
                            on:touchstart={() => handleItemSelect(item.id)}
                            on:keydown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleItemSelect(item.id);
                                }
                            }}
                            tabindex="0"
                            role="option"
                            aria-selected={selectedItemId === item.id}
                        >
                            <div class="item-content">
                                {#if item.image}
                                    <img src={item.image} alt={item.name} />
                                {/if}
                                <div class="item-info">
                                    <h3>{item.name}</h3>
                                    {#if item.description}
                                        <p class="description">
                                            {item.description}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {:else if selectedItem}
            <div class="selected-item" id="item-select-control">
                <div class="item-content">
                    {#if selectedItem.image}
                        <img src={selectedItem.image} alt={selectedItem.name} />
                    {/if}
                    <div class="item-info">
                        <h3>{selectedItem.name}</h3>
                    </div>
                </div>
                <button
                    type="button"
                    class="edit-button"
                    on:click={toggleExpanded}
                    on:touchstart={toggleExpanded}
                >
                    Edit
                </button>
            </div>
        {:else}
            <button
                type="button"
                class="select-button"
                id="item-select-control"
                on:click={toggleExpanded}
                on:touchstart={toggleExpanded}
            >
                Select Item
            </button>
        {/if}
    {:else}
        <div class="loading-selector" id="item-select-control">Loading item selector...</div>
    {/if}
</div>

<style>
    .item-selector {
        width: 100%;
        margin-bottom: 10px;
    }

    label {
        display: block;
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 6px;
        color: white;
    }

    .loading-selector {
        padding: 10px;
        background: #1a3d1a;
        border-radius: 8px;
        color: #d0ffd0;
        font-style: italic;
        text-align: center;
        border: 2px solid #007006;
    }

    .selector-expanded {
        background: #1a3d1a;
        border-radius: 8px;
        padding: 10px;
        border: 2px solid #007006;
    }

    .items-list {
        max-height: 300px;
        overflow-y: auto;
        margin-top: 10px;
    }

    .item-row {
        padding: 8px;
        cursor: pointer;
        border-radius: 4px;
        margin-bottom: 4px;
        background: #2f5b2f;
        transition: all 0.2s ease;
    }

    .item-row:hover {
        background: #3a6b3a;
    }

    .item-row.selected {
        background: #1a3d1a;
        border: 2px solid #68d46d;
    }

    .item-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .item-content img {
        width: 48px;
        height: 48px;
        border-radius: 4px;
        object-fit: cover;
    }

    .item-info {
        flex-grow: 1;
    }

    .item-info h3 {
        margin: 0;
        font-size: 14px;
        color: white;
    }

    .description {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: #a0a0a0;
    }

    .selected-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #2f5b2f;
        padding: 8px;
        border-radius: 4px;
        border: 2px solid #007006;
    }

    @media (max-width: 480px) {
        .item-content {
            flex-direction: column;
            align-items: flex-start;
        }

        .item-content img {
            width: 100%;
            height: auto;
        }
    }

    .edit-button,
    .select-button {
        padding: 6px 12px;
        background: #44ff44;
        color: black;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s ease;
    }

    .edit-button:hover,
    .select-button:hover {
        background: #00cc00;
    }

    .select-button {
        width: 100%;
        padding: 10px;
    }
</style>
