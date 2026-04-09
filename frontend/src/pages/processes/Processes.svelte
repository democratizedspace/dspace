<script>
    import { onMount } from 'svelte';
    import Chip from '../../components/svelte/Chip.svelte';
    import processes from '../../generated/processes.json';
    import { db, ENTITY_TYPES } from '../../utils/customcontent.js';
    import ProcessListRow from './ProcessListRow.svelte';

    let mounted = false;
    let customProcesses = [];

    const actionButtons = [
        { text: 'Create a new process', href: '/processes/create' },
        { text: 'Manage processes', href: '/processes/manage' },
    ];

    const normalizeProcessId = (id) => String(id ?? '').trim();

    const builtInProcesses = (Array.isArray(processes) ? processes : [])
        .filter(Boolean)
        .map((process) => ({
            ...process,
            custom: false,
        }));

    const processKey = (process, index) =>
        `${normalizeProcessId(process?.id)}:${process?.custom ? 'custom' : 'builtin'}:${index}`;

    onMount(async () => {
        mounted = true;
        try {
            customProcesses = (await db.list(ENTITY_TYPES.PROCESS)) ?? [];
        } catch (error) {
            console.error('Failed to load custom processes:', error);
            customProcesses = [];
        }
    });

    $: allProcesses = [
        ...builtInProcesses,
        ...(Array.isArray(customProcesses) ? customProcesses : []),
    ].filter((process) => normalizeProcessId(process?.id).length > 0);
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
            {#each allProcesses as process, index (processKey(process, index))}
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
