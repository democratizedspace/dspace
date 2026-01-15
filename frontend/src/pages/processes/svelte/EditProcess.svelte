<script>
    import { onMount } from 'svelte';
    import ProcessForm from '../../../components/svelte/ProcessForm.svelte';
    import { db, ENTITY_TYPES } from '../../../utils/customcontent.js';

    export let processId;

    let processData = null;
    let isLoading = true;
    let errorMessage = '';

    onMount(async () => {
        try {
            const process = await db.get(ENTITY_TYPES.PROCESS, processId);
            if (!process) {
                errorMessage = 'Custom process not found.';
            } else if (!process.custom) {
                errorMessage = 'Only custom processes can be edited here.';
            } else {
                processData = process;
            }
        } catch (error) {
            console.error('Failed to load custom process', error);
            errorMessage = 'Unable to load this process right now.';
        } finally {
            isLoading = false;
        }
    });
</script>

{#if isLoading}
    <p class="status">Loading process...</p>
{:else if errorMessage}
    <div class="status error">
        <p>{errorMessage}</p>
        <a class="manage-link" href="/processes/manage">Back to Manage Processes</a>
        <a class="manage-link" href="/processes/create">Create a process</a>
    </div>
{:else}
    <ProcessForm isEdit={true} {processData} />
{/if}

<style>
    .status {
        text-align: center;
        padding: 1.5rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        color: var(--color-text);
    }

    .status.error {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .manage-link {
        color: #68d46d;
        font-weight: 600;
    }
</style>
