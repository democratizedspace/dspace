<script>
    import { onMount } from 'svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { db, ENTITY_TYPES } from '../../../utils/customcontent.js';

    export let processes = [];

    let customProcesses = [];
    let mounted = false;

    const actionButtons = [
        { text: 'Create a new process', href: '/processes/create' },
        { text: 'Manage processes', href: '/processes/manage' },
    ];

    const normalizeProcessId = (process) => String(process?.id ?? '').trim();
    const getProcessTitle = (process) =>
        typeof process?.title === 'string' ? process.title : 'Untitled process';

    onMount(async () => {
        mounted = true;
        try {
            customProcesses = (await db.list(ENTITY_TYPES.PROCESS)) ?? [];
        } catch (error) {
            console.error('Failed to load custom processes:', error);
            customProcesses = [];
        }
    });

    const dedupeProcesses = (entries) => {
        const byId = new Map();
        (entries ?? []).forEach((process) => {
            const id = normalizeProcessId(process);
            if (id) {
                byId.set(id, process);
            }
        });
        return Array.from(byId.values());
    };

    $: combinedProcesses = dedupeProcesses([
        ...(Array.isArray(processes) ? processes : []),
        ...(Array.isArray(customProcesses) ? customProcesses : []),
    ]);
    $: sortedProcesses = [...combinedProcesses].sort((a, b) =>
        getProcessTitle(a).localeCompare(getProcessTitle(b))
    );
</script>

<div class="processes" data-hydrated={mounted ? 'true' : 'false'}>
    <div class="action-buttons">
        {#each actionButtons as button}
            <Chip text={button.text} href={button.href} inverted={true} />
        {/each}
    </div>

    <div class="processes-grid" data-testid="processes-grid">
        {#if sortedProcesses.length === 0}
            <div class="no-processes">No processes found</div>
        {:else}
            {#each sortedProcesses as process (normalizeProcessId(process))}
                {@const processId = normalizeProcessId(process)}
                <a class="process-card" href={`/processes/${processId}`}>
                    <h3>{getProcessTitle(process)}</h3>
                    <p>{processId}</p>
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
        overflow-x: clip;
    }

    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
    }

    .processes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;
    }

    .process-card {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 16px;
        border-radius: 12px;
        text-decoration: none;
        background: #2c5837;
        border: 2px solid #007006;
        color: white;
    }

    .process-card:hover {
        border-color: #1cb226;
    }

    .process-card h3 {
        margin: 0;
        font-size: 1rem;
    }

    .process-card p {
        margin: 0;
        font-size: 0.85rem;
        color: #d0ffd0;
        word-break: break-word;
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
