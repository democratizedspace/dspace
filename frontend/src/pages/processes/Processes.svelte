<script>
    import { onDestroy, onMount } from 'svelte';
    import Chip from '../../components/svelte/Chip.svelte';
    import { db, ENTITY_TYPES } from '../../utils/customcontent.js';
    import { getItemMap } from '../../utils/itemResolver.js';
    import ProcessListRow from './ProcessListRow.svelte';

    export let builtInProcesses = [];

    let customProcesses = [];
    let itemMetadataMap = new Map();
    let itemMetadataRequestId = 0;

    const actionButtons = [
        { text: 'Create a new process', href: '/processes/create' },
        { text: 'Manage processes', href: '/processes/manage' },
    ];

    const normalizeProcessId = (id) => String(id ?? '').trim();

    const summarizeEntries = (entries = []) => {
        if (!Array.isArray(entries) || entries.length === 0) {
            return { types: 0, total: 0 };
        }

        return entries.reduce(
            (summary, entry) => {
                const count = Number(entry?.count);
                const normalizedCount = Number.isFinite(count) ? count : 0;
                return {
                    types: summary.types + 1,
                    total: summary.total + normalizedCount,
                };
            },
            { types: 0, total: 0 }
        );
    };

    const toListProcess = (process, fallbackCustom = false) => {
        const requireSummary = summarizeEntries(process?.requireItems);
        const consumeSummary = summarizeEntries(process?.consumeItems);
        const createSummary = summarizeEntries(process?.createItems);

        return {
            ...process,
            custom: Boolean(process?.custom ?? fallbackCustom),
            requireItemTypes: Number(process?.requireItemTypes ?? requireSummary.types),
            requireItemTotal: Number(process?.requireItemTotal ?? requireSummary.total),
            consumeItemTypes: Number(process?.consumeItemTypes ?? consumeSummary.types),
            consumeItemTotal: Number(process?.consumeItemTotal ?? consumeSummary.total),
            createItemTypes: Number(process?.createItemTypes ?? createSummary.types),
            createItemTotal: Number(process?.createItemTotal ?? createSummary.total),
        };
    };

    const dedupeByNormalizedId = (processes) => {
        const seenIds = new Set();
        const deduped = [];

        for (const process of processes) {
            const processId = normalizeProcessId(process?.id);
            if (processId.length === 0 || seenIds.has(processId)) {
                continue;
            }
            seenIds.add(processId);
            deduped.push(process);
        }

        return deduped;
    };

    const getProcessItemIds = (process) => {
        const sections = [
            ...(Array.isArray(process?.requireItems) ? process.requireItems : []),
            ...(Array.isArray(process?.consumeItems) ? process.consumeItems : []),
            ...(Array.isArray(process?.createItems) ? process.createItems : []),
        ];

        return sections
            .map((entry) =>
                typeof entry?.id === 'string' || typeof entry?.id === 'number'
                    ? String(entry.id)
                    : null
            )
            .filter((id) => Boolean(id));
    };

    const releaseItemImages = (map) => {
        if (!map) {
            return;
        }

        Array.from(map.values()).forEach((item) => item?.releaseImage?.());
    };

    const loadItemMetadata = async (processes) => {
        const requestId = ++itemMetadataRequestId;
        const uniqueIds = Array.from(
            new Set(processes.flatMap((process) => getProcessItemIds(process)))
        );
        const map = await getItemMap(uniqueIds);

        if (requestId !== itemMetadataRequestId) {
            releaseItemImages(map);
            return;
        }

        releaseItemImages(itemMetadataMap);
        itemMetadataMap = map;
    };

    $: resolvedBuiltIns = (Array.isArray(builtInProcesses) ? builtInProcesses : []).map((process) =>
        toListProcess(process, false)
    );

    $: allProcesses = dedupeByNormalizedId([
        ...resolvedBuiltIns,
        ...(Array.isArray(customProcesses) ? customProcesses : []).map((process) =>
            toListProcess(process, true)
        ),
    ]);

    $: if (allProcesses.length > 0) {
        loadItemMetadata(allProcesses);
    } else {
        releaseItemImages(itemMetadataMap);
        itemMetadataMap = new Map();
    }

    onMount(async () => {
        try {
            customProcesses = (await db.list(ENTITY_TYPES.PROCESS)) ?? [];
        } catch (error) {
            console.error('Failed to load custom processes:', error);
            customProcesses = [];
        }
    });

    onDestroy(() => {
        itemMetadataRequestId += 1;
        releaseItemImages(itemMetadataMap);
    });
</script>

<div class="processes-page">
    <div class="action-buttons">
        {#each actionButtons as button}
            <Chip text={button.text} href={button.href} inverted={true} />
        {/each}
    </div>

    <div class="processes-list">
        {#if allProcesses.length === 0}
            <div class="no-processes">No processes found</div>
        {:else}
            {#each allProcesses as process (normalizeProcessId(process.id))}
                <ProcessListRow {process} {itemMetadataMap} />
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
