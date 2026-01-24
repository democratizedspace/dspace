<script>
    import { createEventDispatcher } from 'svelte';
    import CatalogPicker from './CatalogPicker.svelte';

    export let selectedItemId = '';
    export let label = 'Select Item';
    export let items = [];
    export let controlId = 'item-select-control';
    export let testId = null;

    const dispatch = createEventDispatcher();

    const buildFallbackItem = (itemId) => ({
        id: itemId,
        name: `Custom item (${itemId})`,
        description: 'Custom item ID',
    });

    $: normalizedItems = Array.isArray(items) ? items : [];

    $: resolvedItems =
        selectedItemId && !normalizedItems.some((item) => item.id === selectedItemId)
            ? [...normalizedItems, buildFallbackItem(selectedItemId)]
            : normalizedItems;

    function handleSelect(event) {
        selectedItemId = event.detail.selectedId;
        dispatch('select', { itemId: event.detail.selectedId });
    }
</script>

<CatalogPicker
    items={resolvedItems}
    selectedId={selectedItemId}
    {label}
    {controlId}
    {testId}
    emptyLabel="Select Item"
    on:select={handleSelect}
/>
