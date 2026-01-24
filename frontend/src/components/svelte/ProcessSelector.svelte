<script>
    import { createEventDispatcher } from 'svelte';
    import EntitySelector from './EntitySelector.svelte';

    export let processes = [];
    export let selectedProcessId = '';
    export let label = 'Select Process';
    export let testId = null;

    const dispatch = createEventDispatcher();

    const getTitle = (process) => process.title ?? process.name ?? '';
    const getDescription = (process) => process.description ?? '';
    const getMeta = (process) => (process.duration ? `Duration: ${process.duration}` : '');
    const getSearchText = (process) =>
        [process.id, getTitle(process), getDescription(process), process.duration]
            .filter(Boolean)
            .join(' ');

    function handleSelect(event) {
        selectedProcessId = event.detail.id;
        dispatch('select', { processId: event.detail.id });
    }
</script>

<EntitySelector
    entries={processes}
    selectedId={selectedProcessId}
    {label}
    placeholderLabel="Select Process"
    searchLabel="Search processes"
    {testId}
    getId={(process) => process.id}
    {getTitle}
    {getDescription}
    {getMeta}
    {getSearchText}
    on:select={handleSelect}
/>
