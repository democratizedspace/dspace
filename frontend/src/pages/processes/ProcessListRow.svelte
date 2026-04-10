<script>
    import { onDestroy, onMount } from 'svelte';
    import { getItemMap } from '../../utils/itemResolver.js';
    import { prettyPrintNumber } from '../../utils.js';

    export let process;

    const PREVIEW_LIMIT = 3;
    const normalizeProcessId = (id) => String(id ?? '').trim();

    const formatItemSummary = (types, total) =>
        Number(types) > 0 ? `${types} item${types === 1 ? '' : 's'} (${total})` : 'none';

    const normalizePreviewItem = (item, metadata = null) => {
        const itemId = String(item?.id ?? '');
        const parsedCount = Number(item?.count ?? 0);

        return {
            id: itemId,
            count: Number.isFinite(parsedCount) ? parsedCount : 0,
            name: metadata?.name ?? item?.name ?? `Item ${itemId}`,
            image: metadata?.image ?? item?.image ?? '/favicon.ico',
            releaseImage: metadata?.releaseImage ?? null,
        };
    };

    const toPreviewList = (entries = []) =>
        Array.isArray(entries) ? entries.slice(0, PREVIEW_LIMIT).map((entry) => normalizePreviewItem(entry)) : [];

    const releaseImages = (items = []) => {
        items.forEach((item) => item?.releaseImage?.());
    };

    let isMounted = false;
    let previewRequestId = 0;
    let requireItemsPreview = [];
    let consumeItemsPreview = [];
    let createItemsPreview = [];

    async function loadPreviewItems() {
        const requestId = ++previewRequestId;
        const previewEntries = [
            ...(process?.requireItems ?? []).slice(0, PREVIEW_LIMIT),
            ...(process?.consumeItems ?? []).slice(0, PREVIEW_LIMIT),
            ...(process?.createItems ?? []).slice(0, PREVIEW_LIMIT),
        ];
        const ids = previewEntries.map((entry) => String(entry?.id ?? '')).filter((id) => id.length > 0);
        const metadataById = ids.length > 0 ? await getItemMap(ids) : new Map();

        if (!isMounted || requestId !== previewRequestId) {
            releaseImages(Array.from(metadataById.values()));
            return;
        }

        releaseImages(requireItemsPreview);
        releaseImages(consumeItemsPreview);
        releaseImages(createItemsPreview);

        requireItemsPreview = (process?.requireItems ?? [])
            .slice(0, PREVIEW_LIMIT)
            .map((entry) => normalizePreviewItem(entry, metadataById.get(String(entry?.id ?? ''))));
        consumeItemsPreview = (process?.consumeItems ?? [])
            .slice(0, PREVIEW_LIMIT)
            .map((entry) => normalizePreviewItem(entry, metadataById.get(String(entry?.id ?? ''))));
        createItemsPreview = (process?.createItems ?? [])
            .slice(0, PREVIEW_LIMIT)
            .map((entry) => normalizePreviewItem(entry, metadataById.get(String(entry?.id ?? ''))));
    }

    onMount(() => {
        isMounted = true;
        if (process?.custom) {
            loadPreviewItems();
        }
    });

    onDestroy(() => {
        isMounted = false;
        releaseImages(requireItemsPreview);
        releaseImages(consumeItemsPreview);
        releaseImages(createItemsPreview);
    });

    $: processId = normalizeProcessId(process?.id);
    $: processTitle = process?.title || processId || 'Untitled process';
    $: duration = process?.duration || '—';
    $: requireSummary = formatItemSummary(process?.requireItemTypes, process?.requireItemTotal);
    $: consumeSummary = formatItemSummary(process?.consumeItemTypes, process?.consumeItemTotal);
    $: createSummary = formatItemSummary(process?.createItemTypes, process?.createItemTotal);
    $: serverRequirePreview = toPreviewList(process?.requireItemsPreview);
    $: serverConsumePreview = toPreviewList(process?.consumeItemsPreview);
    $: serverCreatePreview = toPreviewList(process?.createItemsPreview);
    $: resolvedRequirePreview = process?.custom ? requireItemsPreview : serverRequirePreview;
    $: resolvedConsumePreview = process?.custom ? consumeItemsPreview : serverConsumePreview;
    $: resolvedCreatePreview = process?.custom ? createItemsPreview : serverCreatePreview;
    $: requirePreviewRemainder = Math.max(
        Number(process?.requireItemsPreviewRemainder ?? (process?.requireItems?.length ?? 0) - PREVIEW_LIMIT),
        0
    );
    $: consumePreviewRemainder = Math.max(
        Number(process?.consumeItemsPreviewRemainder ?? (process?.consumeItems?.length ?? 0) - PREVIEW_LIMIT),
        0
    );
    $: createPreviewRemainder = Math.max(
        Number(process?.createItemsPreviewRemainder ?? (process?.createItems?.length ?? 0) - PREVIEW_LIMIT),
        0
    );
</script>

<article class="process-row" data-process-id={processId} data-testid="process-row">
    <div class="process-row__header">
        <h2>{processTitle}</h2>
        {#if process?.custom}
            <span class="custom-badge">Custom</span>
        {/if}
    </div>

    <dl class="process-row__summary">
        <div>
            <dt>Duration</dt>
            <dd>{duration}</dd>
        </div>
        <div>
            <dt>Requires</dt>
            <dd>{requireSummary}</dd>
            {#if resolvedRequirePreview.length > 0}
                <div class="item-preview-list">
                    {#each resolvedRequirePreview as item (item.id)}
                        <a class="item-preview" href={`/inventory/item/${item.id}`}>
                            <img src={item.image} alt={item.name} loading="lazy" />
                            <span>{prettyPrintNumber(item.count)}x {item.name}</span>
                        </a>
                    {/each}
                    {#if requirePreviewRemainder > 0}
                        <span class="preview-overflow">+{requirePreviewRemainder} more</span>
                    {/if}
                </div>
            {/if}
        </div>
        <div>
            <dt>Consumes</dt>
            <dd>{consumeSummary}</dd>
            {#if resolvedConsumePreview.length > 0}
                <div class="item-preview-list">
                    {#each resolvedConsumePreview as item (item.id)}
                        <a class="item-preview" href={`/inventory/item/${item.id}`}>
                            <img src={item.image} alt={item.name} loading="lazy" />
                            <span>{prettyPrintNumber(item.count)}x {item.name}</span>
                        </a>
                    {/each}
                    {#if consumePreviewRemainder > 0}
                        <span class="preview-overflow">+{consumePreviewRemainder} more</span>
                    {/if}
                </div>
            {/if}
        </div>
        <div>
            <dt>Creates</dt>
            <dd>{createSummary}</dd>
            {#if resolvedCreatePreview.length > 0}
                <div class="item-preview-list">
                    {#each resolvedCreatePreview as item (item.id)}
                        <a class="item-preview" href={`/inventory/item/${item.id}`}>
                            <img src={item.image} alt={item.name} loading="lazy" />
                            <span>{prettyPrintNumber(item.count)}x {item.name}</span>
                        </a>
                    {/each}
                    {#if createPreviewRemainder > 0}
                        <span class="preview-overflow">+{createPreviewRemainder} more</span>
                    {/if}
                </div>
            {/if}
        </div>
    </dl>

    <a class="details-link" href={`/processes/${processId}`}>View details</a>
</article>

<style>
    .process-row {
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        padding: 15px;
    }

    .process-row__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 12px;
    }

    h2 {
        margin: 0;
        font-size: 1.1rem;
    }

    .custom-badge {
        border: 1px solid #e8e8e8;
        border-radius: 999px;
        padding: 2px 10px;
        font-size: 0.75rem;
    }

    .process-row__summary {
        margin: 0 0 12px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px 12px;
    }

    .process-row__summary div {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        padding-bottom: 8px;
        font-size: 0.9rem;
    }

    dt,
    dd {
        margin: 0;
    }
    dd {
        text-align: right;
    }

    .item-preview-list {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .item-preview {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        text-decoration: none;
        color: inherit;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 999px;
        padding: 2px 8px 2px 3px;
    }

    .item-preview img {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        object-fit: cover;
    }

    .preview-overflow {
        font-size: 0.8rem;
        opacity: 0.9;
        align-self: center;
    }

    .details-link {
        display: inline-block;
        color: #fff;
        text-decoration: underline;
    }
</style>
