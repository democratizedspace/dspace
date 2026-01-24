<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import SearchBar from './SearchBar.svelte';

    export let selectedId = '';
    export let label = 'Select Item';
    export let emptyLabel = 'Select Item';
    export let items = [];
    export let controlId = 'catalog-select-control';
    export let testId = null;

    const dispatch = createEventDispatcher();
    const filteredItems = writable(items);
    let isExpanded = !selectedId;
    let isClientSide = false;

    onMount(() => {
        isClientSide = true;
    });

    function handleSearch(event) {
        filteredItems.set(event.detail);
    }

    function handleItemSelect(itemId) {
        selectedId = itemId;
        isExpanded = false;
        dispatch('select', { selectedId: itemId });
    }

    function toggleExpanded() {
        isExpanded = !isExpanded;
    }

    $: {
        filteredItems.set(items);
    }

    $: selectedItem = items.find((item) => item.id === selectedId);

    $: if (!selectedId) {
        isExpanded = true;
    }
</script>

<div
    class="catalog-selector"
    data-hydrated={isClientSide ? 'true' : 'false'}
    data-expanded={isExpanded ? 'true' : 'false'}
    data-testid={testId}
>
    <label for={controlId}>{label}</label>

    {#if isClientSide}
        {#if isExpanded}
            <div class="selector-expanded" id={controlId} role="group" aria-label={label}>
                <SearchBar data={items} on:search={handleSearch} />
                <div class="items-list" role="listbox">
                    {#each $filteredItems as item (item.id)}
                        <button
                            type="button"
                            class="item-option"
                            class:selected={selectedId === item.id}
                            role="option"
                            on:click={() => handleItemSelect(item.id)}
                            on:touchstart={() => handleItemSelect(item.id)}
                            aria-selected={selectedId === item.id}
                            aria-label={`Select ${item.name || item.id}`}
                        >
                            <div class="item-content">
                                {#if item.image}
                                    <img src={item.image} alt={item.name || item.id} />
                                {:else}
                                    <div class="item-image-placeholder" aria-hidden="true"></div>
                                {/if}
                                <div class="item-info">
                                    <h3>{item.name || item.id}</h3>
                                    {#if item.description}
                                        <p class="description">{item.description}</p>
                                    {/if}
                                    {#if item.meta}
                                        <p class="meta">{item.meta}</p>
                                    {/if}
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>
            </div>
        {:else if selectedItem}
            <div class="selected-item" id={controlId}>
                <div class="item-content">
                    {#if selectedItem.image}
                        <img src={selectedItem.image} alt={selectedItem.name || selectedItem.id} />
                    {:else}
                        <div class="item-image-placeholder" aria-hidden="true"></div>
                    {/if}
                    <div class="item-info">
                        <h3>{selectedItem.name || selectedItem.id}</h3>
                        {#if selectedItem.meta}
                            <p class="meta">{selectedItem.meta}</p>
                        {/if}
                    </div>
                </div>
                <button
                    type="button"
                    class="edit-button"
                    aria-haspopup="listbox"
                    aria-expanded={isExpanded}
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
                id={controlId}
                aria-haspopup="listbox"
                aria-expanded={isExpanded}
                on:click={toggleExpanded}
                on:touchstart={toggleExpanded}
            >
                {emptyLabel}
            </button>
        {/if}
    {:else}
        <div class="loading-selector" id={controlId}>Loading selector...</div>
    {/if}
</div>

<style>
    .catalog-selector {
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

    .item-option {
        padding: 8px;
        cursor: pointer;
        border-radius: 4px;
        margin-bottom: 4px;
        background: #2f5b2f;
        transition: all 0.2s ease;
        border: none;
        text-align: left;
        width: 100%;
    }

    .item-option:focus {
        outline: 2px solid #68d46d;
        outline-offset: 2px;
    }

    .item-option:hover {
        background: #3a6b3a;
    }

    .item-option.selected {
        background: #1a3d1a;
        border: 2px solid #68d46d;
    }

    .item-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .item-content img,
    .item-image-placeholder {
        width: 48px;
        height: 48px;
        border-radius: 4px;
        object-fit: cover;
    }

    .item-image-placeholder {
        background: rgba(255, 255, 255, 0.1);
        border: 1px dashed rgba(255, 255, 255, 0.3);
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

    .meta {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: #c8e6c9;
    }

    .selected-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #2f5b2f;
        padding: 8px;
        border-radius: 4px;
        border: 2px solid #007006;
        gap: 10px;
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
