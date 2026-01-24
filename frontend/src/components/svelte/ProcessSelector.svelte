<script>
    import { createEventDispatcher } from 'svelte';
    import EntitySelector from './EntitySelector.svelte';

    export let processes = [];
    export let selectedProcessId = '';
    export let label = 'Select Process';

    const dispatch = createEventDispatcher();

    $: entries = processes.map((process) => ({
        id: process.id,
        name: process.title ?? process.name ?? process.id ?? '',
        description: process.description ?? '',
        image: process.image ?? null,
        meta: process.duration ? `Duration: ${process.duration}` : '',
        price: process.duration ?? '',
    }));

    function handleSelect(event) {
        dispatch('select', { processId: event.detail.id });
    }
</script>

<EntitySelector
    {label}
    {entries}
    selectedId={selectedProcessId}
    placeholder="Select Process"
    searchLabel="Search processes"
    on:select={handleSelect}
/>
