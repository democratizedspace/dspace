<script>
    export let process;
    export let itemMetadataMap = new Map();

    const normalizeProcessId = (id) => String(id ?? '').trim();

    const formatItemSummary = (types, total) =>
        Number(types) > 0 ? `${types} item${types === 1 ? '' : 's'} (${total})` : 'none';

    const getPreviewEntries = (entries = [], metadataMap = new Map(), maxItems = 2) => {
        if (!Array.isArray(entries) || entries.length === 0) {
            return [];
        }

        return entries.slice(0, maxItems).map((entry) => {
            const itemId =
                typeof entry?.id === 'string' || typeof entry?.id === 'number'
                    ? String(entry.id)
                    : '';
            const metadata = metadataMap?.get(itemId);
            const count = Number(entry?.count);
            return {
                id: itemId,
                name: metadata?.name || entry?.name || itemId || 'Unknown item',
                image: metadata?.image || entry?.image || '/favicon.ico',
                count: Number.isFinite(count) ? count : null,
            };
        });
    };

    $: processId = normalizeProcessId(process?.id);
    $: processTitle = process?.title || processId || 'Untitled process';
    $: duration = process?.duration || '—';
    $: requireSummary = formatItemSummary(process?.requireItemTypes, process?.requireItemTotal);
    $: consumeSummary = formatItemSummary(process?.consumeItemTypes, process?.consumeItemTotal);
    $: createSummary = formatItemSummary(process?.createItemTypes, process?.createItemTotal);
    $: requirePreview = getPreviewEntries(process?.requireItems, itemMetadataMap);
    $: consumePreview = getPreviewEntries(process?.consumeItems, itemMetadataMap);
    $: createPreview = getPreviewEntries(process?.createItems, itemMetadataMap);
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
        <div>
            <dt>Consumes</dt>
            <dd>{consumeSummary}</dd>
        </div>
        <div>
            <dt>Creates</dt>
            <dd>{createSummary}</dd>
        </div>
    </dl>

    <div class="process-row__details">
        <div>
            <h3>Requires</h3>
            {#if requirePreview.length > 0}
                <ul>
                    {#each requirePreview as item}
                        <li>
                            <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
                            <span>{item.count ?? '—'} × {item.name}</span>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p>None</p>
            {/if}
        </div>
        <div>
            <h3>Consumes</h3>
            {#if consumePreview.length > 0}
                <ul>
                    {#each consumePreview as item}
                        <li>
                            <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
                            <span>{item.count ?? '—'} × {item.name}</span>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p>None</p>
            {/if}
        </div>
        <div>
            <h3>Creates</h3>
            {#if createPreview.length > 0}
                <ul>
                    {#each createPreview as item}
                        <li>
                            <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
                            <span>{item.count ?? '—'} × {item.name}</span>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p>None</p>
            {/if}
        </div>
    </div>

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

    dt,
    dd {
        margin: 0;
    }

    .details-link {
        display: inline-block;
        color: #fff;
        text-decoration: underline;
    }

    .process-row__details {
        margin: 0 0 10px;
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .process-row__details h3 {
        margin: 0 0 4px;
        font-size: 0.8rem;
        opacity: 0.9;
    }

    .process-row__details ul {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .process-row__details li {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.78rem;
    }

    .process-row__details img {
        width: 18px;
        height: 18px;
        border-radius: 999px;
        object-fit: cover;
    }

    .process-row__details p {
        margin: 0;
        font-size: 0.78rem;
        opacity: 0.85;
    }

    @media (max-width: 700px) {
        .process-row__details {
            grid-template-columns: 1fr;
        }
    }
</style>
