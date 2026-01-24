<script>
    import { createEventDispatcher } from 'svelte';
    import CatalogPicker from './CatalogPicker.svelte';

    export let selectedProcessId = '';
    export let label = 'Select Process';
    export let processes = [];
    export let controlId = 'process-select-control';
    export let testId = null;

    const dispatch = createEventDispatcher();

    const buildFallbackProcess = (processId) => ({
        id: processId,
        name: `Custom process (${processId})`,
        description: 'Custom process ID',
    });

    const buildProcessMeta = (process) => {
        if (!process) {
            return '';
        }
        const duration = process.duration ?? '';
        if (!duration) {
            return '';
        }
        return `Duration: ${duration}`;
    };

    $: normalizedProcesses = Array.isArray(processes) ? processes : [];

    $: processItems = normalizedProcesses.map((process) => ({
        id: process?.id ?? '',
        name: process?.title ?? process?.name ?? '',
        description: process?.description ?? '',
        image: process?.image ?? '',
        meta: buildProcessMeta(process),
    }));

    $: resolvedItems =
        selectedProcessId && !processItems.some((process) => process.id === selectedProcessId)
            ? [...processItems, buildFallbackProcess(selectedProcessId)]
            : processItems;

    function handleSelect(event) {
        selectedProcessId = event.detail.selectedId;
        dispatch('select', { processId: event.detail.selectedId });
    }
</script>

<CatalogPicker
    items={resolvedItems}
    selectedId={selectedProcessId}
    {label}
    {controlId}
    {testId}
    emptyLabel="Select Process"
    on:select={handleSelect}
/>
