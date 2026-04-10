<script>
    export let process;
    export let itemMetadataMap = new Map();

    const normalizeProcessId = (id) => String(id ?? '').trim();

    const formatItemSummary = (types, total) =>
        Number(types) > 0 ? `${types} item${types === 1 ? '' : 's'} (${total})` : 'none';

    $: processId = normalizeProcessId(process?.id);
    $: processTitle = process?.title || processId || 'Untitled process';
    $: duration = process?.duration || '—';
    $: requireSummary = formatItemSummary(process?.requireItemTypes, process?.requireItemTotal);
    $: consumeSummary = formatItemSummary(process?.consumeItemTypes, process?.consumeItemTotal);
    $: createSummary = formatItemSummary(process?.createItemTypes, process?.createItemTotal);

    const toPreviewLine = (entry) => {
        const entryId = normalizeProcessId(entry?.id);
        const metadata = itemMetadataMap?.get(entryId);
        const count = Number(entry?.count);
        const normalizedCount = Number.isFinite(count) ? count : 0;
        const countLabel = Number.isFinite(count) ? normalizedCount : 0;

        return {
            id: entryId,
            countLabel,
            name: metadata?.name || entry?.name || entryId || 'Unknown item',
            image: metadata?.image || entry?.image || '/favicon.ico',
        };
    };

    const getPreviewLines = (entries = []) =>
        Array.isArray(entries)
            ? entries
                  .filter((entry) => entry?.id !== undefined && entry?.id !== null)
                  .slice(0, 2)
                  .map((entry) => toPreviewLine(entry))
            : [];

    $: requirePreviewLines = getPreviewLines(process?.requirePreviewEntries);
    $: consumePreviewLines = getPreviewLines(process?.consumePreviewEntries);
    $: createPreviewLines = getPreviewLines(process?.createPreviewEntries);
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
            {#if requirePreviewLines.length > 0}
                <ul class="item-preview-list">
                    {#each requirePreviewLines as item, index (`require-${item.id}-${index}`)}
                        <li>
                            <img src={item.image} alt={item.name} />
                            <span>{item.countLabel}x {item.name}</span>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
        <div>
            <dt>Consumes</dt>
            <dd>{consumeSummary}</dd>
            {#if consumePreviewLines.length > 0}
                <ul class="item-preview-list">
                    {#each consumePreviewLines as item, index (`consume-${item.id}-${index}`)}
                        <li>
                            <img src={item.image} alt={item.name} />
                            <span>{item.countLabel}x {item.name}</span>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
        <div>
            <dt>Creates</dt>
            <dd>{createSummary}</dd>
            {#if createPreviewLines.length > 0}
                <ul class="item-preview-list">
                    {#each createPreviewLines as item, index (`create-${item.id}-${index}`)}
                        <li>
                            <img src={item.image} alt={item.name} />
                            <span>{item.countLabel}x {item.name}</span>
                        </li>
                    {/each}
                </ul>
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
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        padding-bottom: 2px;
        font-size: 0.9rem;
    }

    dt,
    dd {
        margin: 0;
    }

    .item-preview-list {
        grid-column: 1 / -1;
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 3px;
    }

    .item-preview-list li {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.82rem;
        opacity: 0.95;
    }

    .item-preview-list img {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
    }

    .details-link {
        display: inline-block;
        color: #fff;
        text-decoration: underline;
    }
</style>
