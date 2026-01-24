<script>
    import { createEventDispatcher, onMount } from 'svelte';

    const dispatch = createEventDispatcher();

    export let data = [];
    export let placeholder = 'Search...';
    export let ariaLabel = 'Search items';

    let searchQuery = '';
    let originalData = []; // Store a copy of the original data
    let isClientSide = false;

    onMount(() => {
        isClientSide = true;
    });

    // Update originalData whenever data changes
    $: originalData = [...data];

    function handleInput(event) {
        searchQuery = event.target.value;
        let filteredItems;
        if (searchQuery.trim() === '') {
            filteredItems = originalData; // Use original data when search bar is cleared
        } else {
            const words = searchQuery.toLowerCase().split(/\s+/);
            const normalize = (value) => (value == null ? '' : String(value).toLowerCase());
            filteredItems = originalData.filter((item) => {
                const itemText = [
                    normalize(item.id),
                    normalize(item.name),
                    normalize(item.description),
                    normalize(item.price),
                ].join(' ');
                return words.every((word) => itemText.includes(word));
            });
        }
        dispatch('search', filteredItems);
    }
</script>

<div data-hydrated={isClientSide ? 'true' : 'false'}>
    {#if isClientSide}
        <input
            type="text"
            bind:value={searchQuery}
            {placeholder}
            aria-label={ariaLabel}
            on:input={handleInput}
        />
    {:else}
        <div class="search-placeholder">Loading search...</div>
    {/if}
</div>

<style>
    input {
        width: 100%;
        max-width: 400px;
        padding: 10px;
        font-size: 16px;
        border: 1px solid #ccc;
        margin: 0 auto 10px;
        display: block;
        border-radius: 20px;
    }

    .search-placeholder {
        width: 100%;
        max-width: 400px;
        padding: 10px;
        margin: 0 auto 10px;
        display: block;
        text-align: center;
        font-style: italic;
        color: #d0ffd0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
    }
</style>
