<script>
    import { onMount } from 'svelte';
    import ProcessListRow from './ProcessListRow.svelte';
    import { db, ENTITY_TYPES } from '../../utils/customcontent.js';

    let mounted = false;
    let customProcesses = [];

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

    $: allCustomProcesses = (Array.isArray(customProcesses) ? customProcesses : [])
        .filter(Boolean)
        .map((process) => ({
            ...process,
            custom: process?.custom ?? true,
        }));
</script>

<div class="custom-processes" data-hydrated={mounted ? 'true' : 'false'}>
    {#if allCustomProcesses.length > 0}
        <h2>Custom processes</h2>
        <div class="processes-list">
            {#each allCustomProcesses as process (normalizeProcessId(process?.id))}
                <ProcessListRow {process} />
            {/each}
        </div>
    {/if}
</div>

<style>
    .custom-processes {
        margin-top: 20px;
    }

    h2 {
        margin: 0 0 10px;
    }

    .processes-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
</style>
