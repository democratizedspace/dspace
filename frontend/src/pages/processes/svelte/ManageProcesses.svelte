<script>
    import { onMount } from 'svelte';
    import Process from '../../../components/svelte/Process.svelte';
    import ProcessPreview from '../../../components/svelte/ProcessPreview.svelte';
    import { db, ENTITY_TYPES } from '../../../utils/customcontent.js';
    import { togglePreviewId } from '../../../utils/preview.js';

    export let processes = [];
    let customProcesses = [];
    let mounted = false;
    let searchTerm = '';
    let previewProcessId = null;

    onMount(async () => {
        customProcesses = await db.list(ENTITY_TYPES.PROCESS);
        mounted = true;
    });

    $: allProcesses = [...processes, ...customProcesses];
    $: filteredProcesses = allProcesses.filter((process) =>
        process.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    function handleEdit(id) {
        window.location.href = `/processes/${id}/edit`;
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

    function togglePreview(id) {
        previewProcessId = togglePreviewId(previewProcessId, id);
    }
</script>

<div class="manage-processes">
    {#if mounted}
        <div class="controls">
            <input type="text" bind:value={searchTerm} placeholder="Search processes..." />
        </div>

        <div class="processes-list">
            {#if filteredProcesses.length === 0}
                <div class="no-processes">No processes found</div>
            {:else}
                {#each filteredProcesses as process (process.id)}
                    <div class="process-row">
                        <Process processId={process.id} processData={process} />
                        <div class="process-actions">
                            <button
                                class="preview-button"
                                on:click={() => togglePreview(process.id)}
                            >
                                Preview
                            </button>
                            {#if process.custom}
                                <button class="edit-button" on:click={() => handleEdit(process.id)}>
                                    Edit
                                </button>
                                <button
                                    class="delete-button"
                                    on:click={() => handleDelete(process.id)}
                                >
                                    Delete
                                </button>
                            {/if}
                        </div>
                        {#if previewProcessId === process.id}
                            <ProcessPreview
                                title={process.title}
                                duration={process.duration}
                                requireItems={process.requireItems}
                                consumeItems={process.consumeItems}
                                createItems={process.createItems}
                            />
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
