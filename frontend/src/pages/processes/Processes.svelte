<script>
    import { onMount } from 'svelte';
    import Chip from '../../components/svelte/Chip.svelte';
    import { db, ENTITY_TYPES } from '../../utils/customcontent.js';
    import { getItemMap } from '../../utils/itemResolver.js';
    import ProcessListRow from './ProcessListRow.svelte';

    export let builtInProcesses = [];

    let customProcesses = [];
    let itemMetadataMap = new Map();
    let metadataRequestId = 0;
    let isMounted = false;
    let previousMetadataIdsKey = '';

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
            requirePreviewEntries: Array.isArray(process?.requirePreviewEntries)
                ? process.requirePreviewEntries
                : (process?.requireItems ?? []),
            consumePreviewEntries: Array.isArray(process?.consumePreviewEntries)
                ? process.consumePreviewEntries
                : (process?.consumeItems ?? []),
            createPreviewEntries: Array.isArray(process?.createPreviewEntries)
                ? process.createPreviewEntries
                : (process?.createItems ?? []),
        };
    };

    const releaseMapImages = (map) => {
        if (!map) {
            return;
        }
        Array.from(map.values()).forEach((item) => item?.releaseImage?.());
    };

    const getPreviewIds = (processes) =>
        processes.flatMap((process) =>
            [
                ...(process?.requirePreviewEntries ?? []),
                ...(process?.consumePreviewEntries ?? []),
                ...(process?.createPreviewEntries ?? []),
            ]
                .map((entry) =>
                    typeof entry?.id === 'string' || typeof entry?.id === 'number'
                        ? String(entry.id)
                        : ''
                )
                .filter((id) => id.length > 0)
        );

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

    $: resolvedBuiltIns = (Array.isArray(builtInProcesses) ? builtInProcesses : []).map((process) =>
        toListProcess(process, false)
    );

    $: allProcesses = dedupeByNormalizedId([
        ...resolvedBuiltIns,
        ...(Array.isArray(customProcesses) ? customProcesses : []).map((process) =>
            toListProcess(process, true)
        ),
    ]);

    onMount(async () => {
        isMounted = true;
        try {
            customProcesses = (await db.list(ENTITY_TYPES.PROCESS)) ?? [];
        } catch (error) {
            console.error('Failed to load custom processes:', error);
            customProcesses = [];
        }

        return () => {
            isMounted = false;
            releaseMapImages(itemMetadataMap);
            itemMetadataMap = new Map();
        };
    });

    $: if (isMounted) {
        const uniqueIds = Array.from(new Set(getPreviewIds(allProcesses)));
        const nextMetadataIdsKey = uniqueIds.join('|');
        if (nextMetadataIdsKey !== previousMetadataIdsKey) {
            previousMetadataIdsKey = nextMetadataIdsKey;
            const requestId = ++metadataRequestId;
            getItemMap(uniqueIds)
                .then((nextMap) => {
                    if (!isMounted || requestId !== metadataRequestId) {
                        releaseMapImages(nextMap);
                        return;
                    }

                    releaseMapImages(itemMetadataMap);
                    itemMetadataMap = nextMap;
                })
                .catch((error) => {
                    console.error('Failed to load process item metadata:', error);
                });
        }
    }
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
