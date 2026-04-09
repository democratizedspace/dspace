<script>
    export let process;

    const normalizeProcessId = (id) => String(id ?? '').trim();

    const formatItemSummary = (types, total) =>
        Number(types) > 0 ? `${types} item${types === 1 ? '' : 's'} (${total})` : 'none';

    $: processId = normalizeProcessId(process?.id);
    $: processTitle = process?.title || processId || 'Untitled process';
    $: duration = process?.duration || '—';
    $: requireSummary = formatItemSummary(process?.requireItemTypes, process?.requireItemTotal);
    $: consumeSummary = formatItemSummary(process?.consumeItemTypes, process?.consumeItemTotal);
    $: createSummary = formatItemSummary(process?.createItemTypes, process?.createItemTotal);
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
</style>
