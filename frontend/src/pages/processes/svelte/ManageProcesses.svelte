<script>
    import { onDestroy, onMount } from 'svelte';
    import Process from '../../../components/svelte/Process.svelte';
    import ProcessPreview from '../../../components/svelte/ProcessPreview.svelte';
    import { db, ENTITY_TYPES } from '../../../utils/customcontent.js';

    export let processes = [];
    let customProcesses = [];
    let mounted = false;
    let searchTerm = '';
    let openPreviewProcessId = '';
    let availableProcessIds = new Set();
    let lastToggleProcessId = '';
    let invalidPreviewTimeout;

    const normalizeProcessId = (id) => String(id ?? '').trim();

    onMount(async () => {
        mounted = true;
        try {
            customProcesses = (await db.list(ENTITY_TYPES.PROCESS)) ?? [];
        } catch (error) {
            console.error('Failed to load custom processes:', error);
            customProcesses = [];
        }
    });

    onDestroy(() => {
        clearInvalidPreviewTimeout();
    });

    $: allProcesses = [...processes, ...customProcesses];
    $: availableProcessIds = new Set(allProcesses.map((process) => normalizeProcessId(process?.id)));
    $: filteredProcesses = allProcesses.filter((process) => {
        if (!process || typeof process !== 'object') {
            return false;
        }

        const title = (process.title ?? '').toString();
        return title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    function handleEdit(id) {
        window.location.href = `/processes/${id}/edit`;
    }

    function incrementWindowCounter(counterName) {
        if (typeof window === 'undefined') {
            return;
        }

        const globalWindow = window;
        const currentValue = Number(globalWindow[counterName]) || 0;
        globalWindow[counterName] = currentValue + 1;
    }

    async function handleDelete(id) {
        if (confirm('Are you sure you want to delete this process?')) {
            try {
                await db.processes.delete(id);
                customProcesses = customProcesses.filter((p) => p.id !== id);
            } catch (err) {
                console.error('Error deleting process:', err);
                alert('Failed to delete process');
            }
        }
    }

    function clearInvalidPreviewTimeout() {
        if (invalidPreviewTimeout) {
            clearTimeout(invalidPreviewTimeout);
            invalidPreviewTimeout = undefined;
        }
    }

    $: {
        const hasOpenPreview = mounted && Boolean(openPreviewProcessId);
        const hasKnownIds = availableProcessIds.size > 0;
        const previewIsUnavailable =
            hasOpenPreview && hasKnownIds && !availableProcessIds.has(openPreviewProcessId);

        if (!hasOpenPreview || !previewIsUnavailable) {
            clearInvalidPreviewTimeout();
        } else if (!invalidPreviewTimeout) {
            const stalePreviewId = openPreviewProcessId;

            if (typeof window !== 'undefined') {
                incrementWindowCounter('__dspace_cleanup_scheduled');
            }

            invalidPreviewTimeout = setTimeout(() => {
                const shouldStillClear =
                    Boolean(openPreviewProcessId) &&
                    openPreviewProcessId === stalePreviewId &&
                    availableProcessIds.size > 0 &&
                    !availableProcessIds.has(openPreviewProcessId);

                if (shouldStillClear) {
                    openPreviewProcessId = '';

                    if (typeof window !== 'undefined') {
                        incrementWindowCounter('__dspace_cleanup_ran');
                    }
                }

                invalidPreviewTimeout = undefined;
            }, 350);
        }
    }

    function togglePreview(id) {
        if (!mounted) {
            return;
        }

        clearInvalidPreviewTimeout();

        const normalizedId = normalizeProcessId(id);
        const isOpen = openPreviewProcessId === normalizedId;
        const nextPreviewId = isOpen ? '' : normalizedId;
        lastToggleProcessId = normalizedId;

        if (typeof window !== 'undefined') {
            const globalWindow = window;
            incrementWindowCounter('__dspace_toggle_preview_calls');
            globalWindow.__dspace_open_preview_before = openPreviewProcessId;
            globalWindow.__dspace_last_toggle_process_id = normalizedId;
        }

        openPreviewProcessId = nextPreviewId;

        if (typeof window !== 'undefined') {
            const globalWindow = window;
            globalWindow.__dspace_open_preview_after = openPreviewProcessId;
        }
    }
</script>

<div
    class="manage-processes"
    data-testid="manage-processes"
    data-hydrated={mounted ? 'true' : 'false'}
>
    {#if mounted}
        <div class="controls">
            <input type="text" bind:value={searchTerm} placeholder="Search processes..." />
        </div>

        <div
            class="processes-list"
            data-testid="processes-list"
            data-preview-open={openPreviewProcessId || ''}
            data-last-toggle={lastToggleProcessId || ''}
        >
            {#if filteredProcesses.length === 0}
                <div class="no-processes">No processes found</div>
            {:else}
                {#each filteredProcesses as process (process.id)}
                    {@const processId = normalizeProcessId(process.id)}
                    <div class="process-row" data-testid="process-row" data-process-id={processId}>
                        <Process processId={process.id} processData={process} />
                        <div class="process-actions">
                            <button
                                class="preview-button"
                                type="button"
                                data-testid="process-preview-toggle"
                                data-process-id={processId}
                                aria-expanded={openPreviewProcessId === processId
                                    ? 'true'
                                    : 'false'}
                                aria-controls={`process-preview-${processId}`}
                                aria-pressed={openPreviewProcessId === processId ? 'true' : 'false'}
                                on:click|stopPropagation={() => togglePreview(processId)}
                            >
                                Preview
                            </button>
                            {#if process.custom}
                                <button
                                    class="edit-button"
                                    type="button"
                                    on:click={() => handleEdit(process.id)}
                                >
                                    Edit
                                </button>
                                <button
                                    class="delete-button"
                                    type="button"
                                    on:click={() => handleDelete(process.id)}
                                >
                                    Delete
                                </button>
                            {/if}
                        </div>
                        {#if openPreviewProcessId === processId}
                            <div
                                id={`process-preview-${processId}`}
                                data-testid="process-preview"
                                data-preview-id={openPreviewProcessId}
                                data-process-id={processId}
                            >
                                <ProcessPreview
                                    title={process?.title ?? ''}
                                    duration={process?.duration ?? ''}
                                    requireItems={Array.isArray(process?.requireItems)
                                        ? process.requireItems
                                        : []}
                                    consumeItems={Array.isArray(process?.consumeItems)
                                        ? process.consumeItems
                                        : []}
                                    createItems={Array.isArray(process?.createItems)
                                        ? process.createItems
                                        : []}
                                />
                            </div>
                        {/if}
                    </div>
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style>
    .manage-processes {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    .controls {
        margin-bottom: 30px;
    }

    .controls input {
        padding: 10px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        border: 2px solid #007006;
        font-size: 16px;
        width: 200px;
    }

    .process-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding: 15px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
    }

    .process-actions {
        display: flex;
        gap: 10px;
    }

    .preview-button,
    .edit-button,
    .delete-button {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    }

    .preview-button {
        background-color: #666;
        color: white;
    }

    .edit-button {
        background-color: #007006;
        color: white;
    }

    .delete-button {
        background-color: #dd3333;
        color: white;
    }

    .edit-button:hover {
        background-color: #005004;
    }

    .delete-button:hover {
        background-color: #bb2222;
    }

    .preview-button:hover {
        background-color: #555;
    }

    .no-processes {
        text-align: center;
        padding: 40px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        color: white;
    }
</style>
