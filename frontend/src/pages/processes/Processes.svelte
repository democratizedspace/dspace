<script>
    import { onMount } from 'svelte';
    import Chip from '../../components/svelte/Chip.svelte';
    import processes from '../../generated/processes.json';
    import { db, ENTITY_TYPES } from '../../utils/customcontent.js';
    import ProcessView from '../process/[slug]/ProcessView.svelte';

    let mounted = false;
    let customProcesses = [];

    const actionButtons = [
        { text: 'Create a new process', href: '/processes/create' },
        { text: 'Manage processes', href: '/processes/manage' },
    ];

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

    const builtInProcesses = (Array.isArray(processes) ? processes : []).map((process) => ({
        ...process,
        custom: false,
    }));

    $: allProcesses = [
        ...builtInProcesses,
        ...(Array.isArray(customProcesses) ? customProcesses : []),
    ].filter(Boolean);
</script>

<div class="processes-page" data-hydrated={mounted ? 'true' : 'false'}>
    <div class="action-buttons">
        {#each actionButtons as button}
            <Chip text={button.text} href={button.href} inverted={true} />
        {/each}
    </div>

    {#if mounted}
        <div class="processes-list">
            {#if allProcesses.length === 0}
                <div class="no-processes">No processes found</div>
            {:else}
                {#each allProcesses as process (normalizeProcessId(process?.id))}
                    {@const processId = normalizeProcessId(process?.id)}
                    <div class="process-row" data-process-id={processId}>
                        <ProcessView slug={processId} />
                    </div>
                {/each}
            {/if}
        </div>
    {:else}
        <div class="loading">Loading processes...</div>
    {/if}
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
        gap: 20px;
    }

    .process-row {
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        padding: 15px;
    }

    .no-processes,
    .loading {
        text-align: center;
        padding: 40px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        color: white;
    }
</style>
