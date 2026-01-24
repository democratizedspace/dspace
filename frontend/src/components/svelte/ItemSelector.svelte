<script>
    import { createEventDispatcher } from 'svelte';
    import EntitySelector from './EntitySelector.svelte';

    export let selectedItemId = '';
    export let label = 'Select Item';
    export let items = []; // Make items a prop instead of importing

    const dispatch = createEventDispatcher();

    $: entries = items.map((item) => ({
        id: item.id,
        name: item.name ?? item.id ?? '',
        description: item.description ?? '',
        image: item.image ?? null,
        price: item.price ?? '',
    }));

    function handleSelect(event) {
        dispatch('select', { itemId: event.detail.id });
    }
</script>

<EntitySelector
    {label}
    {entries}
    selectedId={selectedItemId}
    placeholder="Select Item"
    searchLabel="Search items"
    on:select={handleSelect}
/>
