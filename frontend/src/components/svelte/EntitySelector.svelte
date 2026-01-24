<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import SearchBar from './SearchBar.svelte';

    export let entries = [];
    export let selectedId = '';
    export let label = 'Select Item';
    export let placeholderLabel = 'Select Item';
    export let searchLabel = 'Search items';
    export let searchPlaceholder = 'Search...';
    export let testId = null;
    export let getId = (entry) => entry.id;
    export let getTitle = (entry) => entry.name ?? entry.title ?? '';
    export let getDescription = (entry) => entry.description ?? '';
    export let getImage = (entry) => entry.image ?? '';
    export let getMeta = (entry) => entry.meta ?? '';
    export let getSearchText = (entry) =>
        [getId(entry), getTitle(entry), getDescription(entry), getMeta(entry)]
            .filter(Boolean)
            .join(' ');

    const dispatch = createEventDispatcher();
    const filteredEntries = writable(entries);
    let isExpanded = !selectedId;
    let isClientSide = false;

    onMount(() => {
        isClientSide = true;
    });

    function handleSearch(event) {
        filteredEntries.set(event.detail);
    }

    function handleSelect(entry) {
        const entryId = getId(entry);
        selectedId = entryId;
        isExpanded = false;
        dispatch('select', { id: entryId });
    }

    function toggleExpanded() {
        isExpanded = !isExpanded;
    }

    $: {
        filteredEntries.set(entries);
    }

    $: selectedEntry = entries.find((entry) => getId(entry) === selectedId);
    $: selectedTitle = selectedEntry ? getTitle(selectedEntry) : '';
    $: selectedImage = selectedEntry ? getImage(selectedEntry) : '';
    $: selectedMeta = selectedEntry ? getMeta(selectedEntry) : '';
</script>

<div
    class="item-selector"
    data-testid={testId}
    data-hydrated={isClientSide ? 'true' : 'false'}
    data-expanded={isExpanded ? 'true' : 'false'}
>
    <label for="item-select-control">{label}</label>

    {#if isClientSide}
        {#if isExpanded}
            <div class="selector-expanded" id="item-select-control" role="group" aria-label={label}>
                <SearchBar
                    data={entries}
                    {searchLabel}
                    {searchPlaceholder}
                    {getSearchText}
                    on:search={handleSearch}
                />
                <div class="items-list" role="listbox">
                    {#each $filteredEntries as entry (getId(entry))}
                        <button
                            type="button"
                            class="item-option"
                            class:selected={selectedId === getId(entry)}
                            role="option"
                            on:click={() => handleSelect(entry)}
                            on:touchstart={() => handleSelect(entry)}
                            aria-selected={selectedId === getId(entry)}
                            aria-label={`Select ${getTitle(entry)}`}
                        >
                            <div class="item-content">
                                {#if getImage(entry)}
                                    <img src={getImage(entry)} alt={getTitle(entry)} />
                                {/if}
                                <div class="item-info">
                                    <h3>{getTitle(entry)}</h3>
                                    {#if getDescription(entry)}
                                        <p class="description">
                                            {getDescription(entry)}
                                        </p>
                                    {/if}
                                    {#if getMeta(entry)}
                                        <p class="meta">{getMeta(entry)}</p>
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
                    {#if selectedImage}
                        <img src={selectedImage} alt={selectedTitle} />
                    {/if}
                    <div class="item-info">
                        <h3>{selectedTitle}</h3>
                        {#if selectedMeta}
                            <p class="meta">{selectedMeta}</p>
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
                {placeholderLabel}
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

    .item-option {
        width: 100%;
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

    .description,
    .meta {
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
