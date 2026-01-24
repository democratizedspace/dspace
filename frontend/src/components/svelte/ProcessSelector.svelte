<script>
    import { createEventDispatcher } from 'svelte';
    import CatalogSelector from './ui/CatalogSelector.svelte';

    export let selectedProcessId = '';
    export let label = 'Select Process';
    export let processes = [];
    export let testId = '';
    export let allowCustomId = false;
    export let customIdLabel = 'Custom process ID';
    export let customIdPlaceholder = 'Enter custom process ID';
    export let customIdButtonLabel = 'Use custom ID';
    $: controlId = testId ? `${testId}-control` : '';

    const dispatch = createEventDispatcher();

    function handleSelect(event) {
        const processId = event.detail.itemId;
        selectedProcessId = processId;
        dispatch('select', { ...event.detail, processId });
    }

    const formatDuration = (duration) => {
        if (duration == null || duration === '') {
            return '';
        }
        return `Duration: ${duration}`;
    };
</script>

<CatalogSelector
    items={processes}
    selectedId={selectedProcessId}
    {label}
    buttonLabel="Select Process"
    getId={(process) => process?.id ?? ''}
    getName={(process) => process?.title ?? ''}
    getDescription={(process) => process?.description ?? ''}
    getMeta={(process) => formatDuration(process?.duration)}
    {allowCustomId}
    {customIdLabel}
    {customIdPlaceholder}
    {customIdButtonLabel}
    {controlId}
    {testId}
    on:select={handleSelect}
/>
