<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import SearchBar from './SearchBar.svelte';

    export let entries = [];
    export let selectedId = '';
    export let label = 'Select Item';
    export let placeholder = 'Select Item';
    export let searchLabel = 'Search items';

    const dispatch = createEventDispatcher();
    const filteredEntries = writable(entries);
    let isExpanded = !selectedId;
    let isClientSide = false;

    onMount(() => {
        isClientSide = true;
    });

    const toSearchEntry = (entry) => ({
        ...entry,
        price: entry.price ?? entry.meta ?? '',
    });

    function handleSearch(event) {
        filteredEntries.set(event.detail);
    }

    function handleEntrySelect(entry) {
        selectedId = entry.id;
        isExpanded = false;
        dispatch('select', { id: entry.id, entry });
    }

    function toggleExpanded() {
        isExpanded = !isExpanded;
    }

    $: searchEntries = entries.map(toSearchEntry);

    // Update filtered items when entries prop changes
    $: {
        filteredEntries.set(searchEntries);
    }

    $: selectedEntry = entries.find((entry) => entry.id === selectedId);
</script>

<div
    class="item-selector"
    data-hydrated={isClientSide ? 'true' : 'false'}
    data-expanded={isExpanded ? 'true' : 'false'}
>
    <label for="item-select-control">{label}</label>

    {#if isClientSide}
        {#if isExpanded}
            <div class="selector-expanded" id="item-select-control" role="group" aria-label={label}>
                <SearchBar data={searchEntries} ariaLabel={searchLabel} on:search={handleSearch} />
                <div class="items-list" role="listbox">
                    {#each $filteredEntries as entry (entry.id)}
                        <button
                            type="button"
                            class="item-option"
                            class:selected={selectedId === entry.id}
                            role="option"
                            on:click={() => handleEntrySelect(entry)}
                            on:touchstart={() => handleEntrySelect(entry)}
                            aria-selected={selectedId === entry.id}
                            aria-label={`Select ${entry.name}`}
                        >
                            <div class="item-content">
                                {#if entry.image}
                                    <img src={entry.image} alt={entry.name} />
                                {/if}
                                <div class="item-info">
                                    <h3>{entry.name}</h3>
                                    {#if entry.description}
                                        <p class="description">{entry.description}</p>
                                    {/if}
                                    {#if entry.meta}
                                        <p class="meta">{entry.meta}</p>
                                    {/if}
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>
            </div>
        {:else if selectedEntry}
            <div class="selected-item" id="item-select-control">
                <div class="item-content">
                    {#if selectedEntry.image}
                        <img src={selectedEntry.image} alt={selectedEntry.name} />
                    {/if}
                    <div class="item-info">
                        <h3>{selectedEntry.name}</h3>
                        {#if selectedEntry.meta}
                            <p class="meta">{selectedEntry.meta}</p>
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
                id="item-select-control"
                aria-haspopup="listbox"
                aria-expanded={isExpanded}
                on:click={toggleExpanded}
                on:touchstart={toggleExpanded}
            >
                {placeholder}
            </button>
        {/if}
    {:else}
        <div class="loading-selector" id="item-select-control">Loading selector...</div>
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

    .item-option {
        padding: 8px;
        cursor: pointer;
        border-radius: 4px;
        margin-bottom: 4px;
        background: #2f5b2f;
        transition: all 0.2s ease;
        border: none;
        text-align: left;
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

    .meta {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: #a8d8ff;
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
