<script>
    import { createEventDispatcher } from 'svelte';
    import EntitySelector from './EntitySelector.svelte';

    export let selectedItemId = '';
    export let label = 'Select Item';
    export let items = [];
    export let testId = null;

    const dispatch = createEventDispatcher();

    const getSearchText = (item) =>
        [item.id, item.name, item.description, item.price].filter(Boolean).join(' ');

    function handleSelect(event) {
        selectedItemId = event.detail.id;
        dispatch('select', { itemId: event.detail.id });
    }
</script>

<EntitySelector
    entries={items}
    selectedId={selectedItemId}
    {label}
    placeholderLabel="Select Item"
    searchLabel="Search items"
    {testId}
    getId={(item) => item.id}
    getTitle={(item) => item.name}
    getDescription={(item) => item.description}
    getImage={(item) => item.image}
    {getSearchText}
    on:select={handleSelect}
/>
