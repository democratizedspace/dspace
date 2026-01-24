<script>
    import { createEventDispatcher } from 'svelte';
    import CatalogSelector from './ui/CatalogSelector.svelte';

    export let selectedItemId = '';
    export let label = 'Select Item';
    export let items = [];
    export let testId = '';
    export let allowCustomId = false;
    export let customIdLabel = 'Custom item ID';
    export let customIdPlaceholder = 'Enter custom item ID';
    export let customIdButtonLabel = 'Use custom ID';

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
    {allowCustomId}
    {customIdLabel}
    {customIdPlaceholder}
    {customIdButtonLabel}
    {testId}
    on:select={handleSelect}
/>
