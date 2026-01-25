<script context="module">
    let catalogSelectorId = 0;
</script>

<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import SearchBar from '../SearchBar.svelte';

    export let items = [];
    export let selectedId = '';
    export let label = 'Select Item';
    export let buttonLabel = 'Select Item';
    export let rootClass = '';
    export let testId = '';
    export let controlId = '';
    export let getId = (item) => item?.id ?? '';
    export let getName = (item) => item?.name ?? '';
    export let getDescription = (item) => item?.description ?? '';
    export let getImage = (item) => item?.image ?? '';
    export let getMeta = (item) => '';
    export let allowCustomId = false;
    export let customIdLabel = 'Custom ID';
    export let customIdPlaceholder = 'Enter custom ID';
    export let customIdButtonLabel = 'Use ID';

    const dispatch = createEventDispatcher();
    const filteredItems = writable([]);
    let isExpanded = !selectedId;
    let isClientSide = false;
    let normalizedItems = [];
    let customId = '';
    const fallbackControlId = `catalog-selector-${catalogSelectorId++}`;
    $: resolvedControlId = controlId || (testId ? `${testId}-control` : fallbackControlId);
    $: customInputId = `${resolvedControlId}-custom-id`;

    $: normalizedItems = (Array.isArray(items) ? items : []).map((item) => ({
        item,
        id: getId(item),
        name: getName(item),
        description: getDescription(item),
        image: getImage(item),
        meta: getMeta(item),
    }));

    onMount(() => {
        isClientSide = true;
    });

    function handleSearch(event) {
        filteredItems.set(event.detail);
    }

    function handleSelect(itemId) {
        selectedId = itemId;
        isExpanded = false;
        const selectedItem = normalizedItems.find((item) => item.id === itemId)?.item ?? null;
        dispatch('select', { itemId, item: selectedItem });
    }

    function handleCustomSelect() {
        const trimmedId = customId.trim();
        if (!trimmedId) {
            return;
        }
        handleSelect(trimmedId);
        customId = '';
    }

    function toggleExpanded() {
        isExpanded = !isExpanded;
    }

    let ignoreToggleClick = false;
    let ignoreToggleClickTimeout;

    function handleToggleClick() {
        if (ignoreToggleClick) {
            return;
        }
        toggleExpanded();
    }

    function handleTouchToggle(event) {
        event.preventDefault();
        ignoreToggleClick = true;
        clearTimeout(ignoreToggleClickTimeout);
        toggleExpanded();
        ignoreToggleClickTimeout = setTimeout(() => {
            ignoreToggleClick = false;
        }, 300);
    }

    $: {
        filteredItems.set(normalizedItems);
    }

    $: selectedItem = normalizedItems.find((item) => item.id === selectedId);
    $: isCustomSelection = Boolean(allowCustomId && selectedId && !selectedItem);
</script>

<div
    class={`item-selector ${rootClass}`}
    data-testid={testId || null}
    data-hydrated={isClientSide ? 'true' : 'false'}
    data-expanded={isExpanded ? 'true' : 'false'}
>
    <label for={resolvedControlId}>{label}</label>

    {#if isClientSide}
        {#if isExpanded}
            <div class="selector-expanded" id={resolvedControlId} role="group" aria-label={label}>
                <SearchBar data={normalizedItems} on:search={handleSearch} />
                <div class="items-list" role="listbox">
                    {#each $filteredItems as normalized (normalized.id)}
                        <button
                            type="button"
                            class="item-option"
                            class:selected={selectedId === normalized.id}
                            role="option"
                            on:click={() => handleSelect(normalized.id)}
                            aria-selected={selectedId === normalized.id}
                            aria-label={`Select ${normalized.name}`}
                        >
                            <div class="item-content">
                                {#if normalized.image}
                                    <img src={normalized.image} alt={normalized.name} />
                                {/if}
                                <div class="item-info">
                                    <h3>{normalized.name}</h3>
                                    {#if normalized.description}
                                        <p class="description">
                                            {normalized.description}
                                        </p>
                                    {/if}
                                    {#if normalized.meta}
                                        <p class="meta">{normalized.meta}</p>
                                    {/if}
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>
                {#if allowCustomId}
                    <div class="custom-id">
                        <label class="custom-id-label" for={customInputId}>
                            {customIdLabel}
                        </label>
                        <div class="custom-id-input">
                            <input
                                type="text"
                                id={customInputId}
                                placeholder={customIdPlaceholder}
                                bind:value={customId}
                                aria-label={customIdLabel}
                                on:keydown={(event) =>
                                    event.key === 'Enter' ? handleCustomSelect() : undefined}
                            />
                            <button type="button" on:click={handleCustomSelect}>
                                {customIdButtonLabel}
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        {:else if selectedItem || isCustomSelection}
            <div class="selected-item" id={resolvedControlId}>
                <div class="item-content">
                    {#if selectedItem?.image}
                        <img src={selectedItem.image} alt={selectedItem.name} />
                    {/if}
                    <div class="item-info">
                        <h3>{selectedItem?.name ?? selectedId}</h3>
                        {#if selectedItem?.meta}
                            <p class="meta">{selectedItem.meta}</p>
                        {:else if isCustomSelection}
                            <p class="meta">Custom ID</p>
                        {/if}
                    </div>
                </div>
                <button
                    type="button"
                    class="edit-button"
                    aria-haspopup="listbox"
                    aria-expanded={isExpanded}
                    on:click={handleToggleClick}
                    on:touchend={handleTouchToggle}
                >
                    Edit
                </button>
            </div>
        {:else}
            <button
                type="button"
                class="select-button"
                id={resolvedControlId}
                aria-haspopup="listbox"
                aria-expanded={isExpanded}
                on:click={handleToggleClick}
                on:touchend={handleTouchToggle}
            >
                {buttonLabel}
            </button>
        {/if}
    {:else}
        <div class="loading-selector" id={resolvedControlId}>Loading selector...</div>
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
        color: #b8f0b8;
    }

    .custom-id {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #2f5b2f;
    }

    .custom-id-label {
        display: block;
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 6px;
        color: #d0ffd0;
    }

    .custom-id-input {
        display: flex;
        gap: 8px;
    }

    .custom-id-input input {
        flex: 1;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #68d46d;
        background: #163316;
        color: #d0ffd0;
    }

    .custom-id-input button {
        padding: 8px 12px;
        border-radius: 4px;
        border: none;
        background: #2f5b2f;
        color: #d0ffd0;
        cursor: pointer;
        font-weight: bold;
    }

    .selected-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        background: #2f5b2f;
        padding: 8px;
        border-radius: 4px;
        border: 2px solid #007006;
    }

    .selected-item .item-content {
        min-width: 0;
    }

    .selected-item .item-info h3 {
        overflow-wrap: anywhere;
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

    @media (max-width: 520px) {
        .selected-item {
            grid-template-columns: 1fr;
        }

        .edit-button {
            width: 100%;
        }
    }
</style>
