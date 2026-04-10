<script>
    import { onDestroy, onMount } from 'svelte';
    import { getItemMap } from '../../utils/itemResolver.js';

    export let process;

    const PREVIEW_LIMIT = 2;

    const normalizeProcessId = (id) => String(id ?? '').trim();

    const formatItemSummary = (types, total) =>
        Number(types) > 0 ? `${types} item${types === 1 ? '' : 's'} (${total})` : 'none';

    const normalizeListEntries = (entries = []) => {
        if (!Array.isArray(entries) || entries.length === 0) {
            return [];
        }

        return entries
            .map((entry) => {
                const id = String(entry?.id ?? '').trim();
                if (!id) {
                    return null;
                }

                const count = Number(entry?.count);
                return {
                    id,
                    count: Number.isFinite(count) ? count : 0,
                };
            })
            .filter(Boolean);
    };

    const toPreviewItems = (entries, itemMap) =>
        entries.map((entry) => {
            const item = itemMap.get(entry.id);
            return {
                id: entry.id,
                count: entry.count,
                name: item?.name ?? 'Unknown item',
                image: item?.image ?? '/favicon.ico',
                releaseImage: item?.releaseImage ?? null,
            };
        });

    const releasePreviewItems = (items) => {
        items.forEach((item) => item?.releaseImage?.());
    };

    const loadPreviews = async () => {
        const requireEntries = normalizeListEntries(process?.requireItems).slice(0, PREVIEW_LIMIT);
        const consumeEntries = normalizeListEntries(process?.consumeItems).slice(0, PREVIEW_LIMIT);
        const createEntries = normalizeListEntries(process?.createItems).slice(0, PREVIEW_LIMIT);

        const ids = [...requireEntries, ...consumeEntries, ...createEntries].map((entry) => entry.id);
        if (ids.length === 0) {
            requirePreview = [];
            consumePreview = [];
            createPreview = [];
            return;
        }

        const requestId = ++previewRequestId;
        const uniqueIds = Array.from(new Set(ids));
        const itemMap = await getItemMap(uniqueIds);

        if (requestId !== previewRequestId) {
            releasePreviewItems(Array.from(itemMap.values()));
            return;
        }

        releasePreviewItems(requirePreview);
        releasePreviewItems(consumePreview);
        releasePreviewItems(createPreview);

        requirePreview = toPreviewItems(requireEntries, itemMap);
        consumePreview = toPreviewItems(consumeEntries, itemMap);
        createPreview = toPreviewItems(createEntries, itemMap);
    };

    let requirePreview = [];
    let consumePreview = [];
    let createPreview = [];
    let previewRequestId = 0;

    $: processId = normalizeProcessId(process?.id);
    $: processTitle = process?.title || processId || 'Untitled process';
    $: duration = process?.duration || '—';
    $: requireSummary = formatItemSummary(process?.requireItemTypes, process?.requireItemTotal);
    $: consumeSummary = formatItemSummary(process?.consumeItemTypes, process?.consumeItemTotal);
    $: createSummary = formatItemSummary(process?.createItemTypes, process?.createItemTotal);
    $: previewKey = [
        processId,
        JSON.stringify(process?.requireItems ?? []),
        JSON.stringify(process?.consumeItems ?? []),
        JSON.stringify(process?.createItems ?? []),
    ].join('|');

    $: if (previewKey) {
        loadPreviews();
    }

    onMount(() => {
        loadPreviews();
    });

    onDestroy(() => {
        releasePreviewItems(requirePreview);
        releasePreviewItems(consumePreview);
        releasePreviewItems(createPreview);
    });
</script>

<article class="process-row" data-process-id={processId}>
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
        </div>
        {#if requirePreview.length > 0}
            <div class="item-preview-row">
                <dd>
                    <ul class="item-preview-list" aria-label="Requires item preview">
                        {#each requirePreview as item}
                            <li>
                                <img src={item.image} alt={`${item.name} icon`} loading="lazy" width="20" height="20" />
                                <span>{item.name} ({item.count})</span>
                            </li>
                        {/each}
                    </ul>
                </dd>
            </div>
        {/if}
        <div>
            <dt>Consumes</dt>
            <dd>{consumeSummary}</dd>
        </div>
        {#if consumePreview.length > 0}
            <div class="item-preview-row">
                <dd>
                    <ul class="item-preview-list" aria-label="Consumes item preview">
                        {#each consumePreview as item}
                            <li>
                                <img src={item.image} alt={`${item.name} icon`} loading="lazy" width="20" height="20" />
                                <span>{item.name} ({item.count})</span>
                            </li>
                        {/each}
                    </ul>
                </dd>
            </div>
        {/if}
        <div>
            <dt>Creates</dt>
            <dd>{createSummary}</dd>
        </div>
        {#if createPreview.length > 0}
            <div class="item-preview-row">
                <dd>
                    <ul class="item-preview-list" aria-label="Creates item preview">
                        {#each createPreview as item}
                            <li>
                                <img src={item.image} alt={`${item.name} icon`} loading="lazy" width="20" height="20" />
                                <span>{item.name} ({item.count})</span>
                            </li>
                        {/each}
                    </ul>
                </dd>
            </div>
        {/if}
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
        display: flex;
        justify-content: space-between;
        gap: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        padding-bottom: 2px;
        font-size: 0.9rem;
    }

    .process-row__summary .item-preview-row {
        grid-column: 1 / -1;
        border-bottom: 0;
        padding-bottom: 0;
    }

    .item-preview-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        list-style: none;
        padding: 0;
        margin: 2px 0 4px;
    }

    .item-preview-list li {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 2px 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 999px;
        font-size: 0.8rem;
        max-width: 100%;
    }

    .item-preview-list img {
        border-radius: 999px;
        object-fit: cover;
        flex-shrink: 0;
    }

    .item-preview-list span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    dt,
    dd {
        margin: 0;
    }

    .details-link {
        display: inline-block;
        color: #fff;
        text-decoration: underline;
    }
</style>
