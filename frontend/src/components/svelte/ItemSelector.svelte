<script>
    import { createEventDispatcher } from 'svelte';
    import CatalogSelector from './ui/CatalogSelector.svelte';

    export let selectedItemId = '';
    export let label = 'Select Item';
    export let items = [];
    export let testId = '';

    const dispatch = createEventDispatcher();

    function handleSelect(event) {
        selectedItemId = event.detail.itemId;
        dispatch('select', event.detail);
    }
</script>

<CatalogSelector
    {items}
    selectedId={selectedItemId}
    {label}
    buttonLabel="Select Item"
    getId={(item) => item?.id ?? ''}
    getName={(item) => item?.name ?? ''}
    getDescription={(item) => item?.description ?? ''}
    getImage={(item) => item?.image ?? ''}
    {testId}
    on:select={handleSelect}
/>
