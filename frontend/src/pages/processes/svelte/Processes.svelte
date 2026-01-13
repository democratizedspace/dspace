<script>
    import { onMount } from 'svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import ProcessPreview from '../../../components/svelte/ProcessPreview.svelte';
    import { db, ENTITY_TYPES } from '../../../utils/customcontent.js';

    export let processes = [];
    let customProcesses = [];
    let mounted = false;

    const actionButtons = [
        { text: 'Create a new process', href: '/processes/create' },
        { text: 'Manage processes', href: '/processes/manage' },
    ];

    const normalizeProcessId = (id) => String(id ?? '').trim();
    const getProcessTitle = (process) =>
        typeof process?.title === 'string' && process.title.trim() !== ''
            ? process.title
            : normalizeProcessId(process?.id);

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
        ...(Array.isArray(processes) ? processes : []),
        ...(Array.isArray(customProcesses) ? customProcesses : []),
    ].filter(Boolean);

    $: sortedProcesses = allProcesses
        .filter((process) => normalizeProcessId(process?.id))
        .sort((a, b) => getProcessTitle(a).localeCompare(getProcessTitle(b)));
</script>

<div class="processes" data-hydrated={mounted ? 'true' : 'false'}>
    <div class="action-buttons">
        {#each actionButtons as button}
            <Chip text={button.text} href={button.href} inverted={true} />
        {/each}
    </div>

    <div class="processes-grid">
        {#if !mounted}
            <div class="loading">Loading processes...</div>
        {:else if sortedProcesses.length === 0}
            <div class="no-processes">No processes found</div>
        {:else}
            {#each sortedProcesses as process (normalizeProcessId(process?.id))}
                {@const processId = normalizeProcessId(process?.id)}
                <a
                    class="process-card"
                    href={`/processes/${processId}`}
                    aria-label={getProcessTitle(process)}
                >
                    <ProcessPreview
                        title={getProcessTitle(process)}
                        duration={process.duration}
                        requireItems={process.requireItems || []}
                        consumeItems={process.consumeItems || []}
                        createItems={process.createItems || []}
                    />
                </a>
            {/each}
        {/if}
    </div>
</div>

<style>
    .processes {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        box-sizing: border-box;
        margin-inline: auto;
        padding-inline: 0.5rem;
    }

    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
    }

    .processes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
    }

    .process-card {
        text-decoration: none;
        color: inherit;
    }

    .loading,
    .no-processes {
        text-align: center;
        padding: 40px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        color: white;
    }
</style>
