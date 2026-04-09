<script>
    import { onMount } from 'svelte';
    import Chip from '../../components/svelte/Chip.svelte';
    import generatedProcesses from '../../generated/processes.json';
    import { db, ENTITY_TYPES } from '../../utils/customcontent.js';
    import ProcessListRow from './ProcessListRow.svelte';

    export let builtInProcesses = null;

    let mounted = false;
    let customProcesses = [];

    const actionButtons = [
        { text: 'Create a new process', href: '/processes/create' },
        { text: 'Manage processes', href: '/processes/manage' },
    ];

    const normalizeProcessId = (id) => String(id ?? '').trim();

    const builtInsFromGenerated = (Array.isArray(generatedProcesses) ? generatedProcesses : []).map(
        (process) => ({
            ...process,
            custom: false,
        })
    );

    const builtInsFromProps = (Array.isArray(builtInProcesses) ? builtInProcesses : [])
        .map((process) => ({
            ...process,
            custom: false,
        }))
        .filter((process) => normalizeProcessId(process?.id));

    $: resolvedBuiltIns = builtInsFromProps.length ? builtInsFromProps : builtInsFromGenerated;

    $: allProcesses = [...resolvedBuiltIns, ...(Array.isArray(customProcesses) ? customProcesses : [])]
        .filter((process) => normalizeProcessId(process?.id))
        .filter((process, index, list) => {
            const processId = normalizeProcessId(process?.id);
            return list.findIndex((entry) => normalizeProcessId(entry?.id) === processId) === index;
        });

    onMount(async () => {
        mounted = true;

        try {
            customProcesses = ((await db.list(ENTITY_TYPES.PROCESS)) ?? []).filter(
                (process) => normalizeProcessId(process?.id)
            );
        } catch (error) {
            console.error('Failed to load custom processes:', error);
            customProcesses = [];
        }
    });
</script>

<div class="processes-page" data-hydrated={mounted ? 'true' : 'false'}>
    <div class="action-buttons">
        {#each actionButtons as button}
            <Chip text={button.text} href={button.href} inverted={true} />
        {/each}
    </div>

    <div class="processes-list">
        {#if allProcesses.length === 0}
            <div class="no-processes">No processes found</div>
        {:else}
            {#each allProcesses as process (normalizeProcessId(process?.id))}
                <ProcessListRow {process} />
            {/each}
        {/if}
    </div>
</div>

<style>
    .processes-page {
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
    }

    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
    }

    .processes-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
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
