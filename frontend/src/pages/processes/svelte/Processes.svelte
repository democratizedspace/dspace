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
    const getProcessTitle = (process) => (typeof process?.title === 'string' ? process.title : '');

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
    $: visibleProcesses = allProcesses
        .filter((process) => normalizeProcessId(process?.id))
        .sort((a, b) => getProcessTitle(a).localeCompare(getProcessTitle(b)));
</script>

<div class="processes" data-hydrated={mounted ? 'true' : 'false'}>
    <div class="action-buttons">
        {#each actionButtons as button}
            <Chip text={button.text} href={button.href} inverted={true} />
        {/each}
    </div>

    <div class="processes-grid" data-testid="processes-grid">
        {#if visibleProcesses.length === 0}
            <div class="empty-state">No processes available yet.</div>
        {:else}
            {#each visibleProcesses as process (normalizeProcessId(process?.id))}
                {@const processId = normalizeProcessId(process?.id)}
                {@const processTitle = getProcessTitle(process)}
                <a
                    class="process-card"
                    href={`/processes/${processId}`}
                    aria-label={processTitle || `Process ${processId}`}
                >
                    <ProcessPreview
                        title={processTitle}
                        duration={process?.duration}
                        requireItems={process?.requireItems || []}
                        consumeItems={process?.consumeItems || []}
                        createItems={process?.createItems || []}
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
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;
    }

    .process-card {
        text-decoration: none;
        color: inherit;
        display: block;
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
        font-style: italic;
        color: #ccc;
    }
</style>
