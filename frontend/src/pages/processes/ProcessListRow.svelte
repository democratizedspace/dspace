<script>
    export let process = {};

    const toCount = (value) => (Array.isArray(value) ? value.length : 0);
    const formatCount = (label, value) => `${label} ${toCount(value)}`;

    $: processId = String(process?.id ?? '').trim();
    $: title = process?.title || processId || 'Untitled process';
    $: duration = process?.duration || 'Unknown';
    $: requiresSummary = formatCount('Requires', process?.requireItems);
    $: consumesSummary = formatCount('Consumes', process?.consumeItems);
    $: createsSummary = formatCount('Creates', process?.createItems);
</script>

<article
    class="process-list-row"
    data-process-id={processId}
    data-custom={process?.custom ? 'true' : 'false'}
>
    <div class="header">
        <h2>{title}</h2>
        {#if process?.custom}
            <span class="custom-badge">Custom</span>
        {/if}
    </div>
    <div class="meta">Duration: {duration}</div>
    <div class="summary">{requiresSummary} • {consumesSummary} • {createsSummary}</div>
    <a class="detail-link" href={`/processes/${processId}`}>View details</a>
</article>

<style>
    .process-list-row {
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    h2 {
        margin: 0;
        font-size: 1.05rem;
    }

    .meta,
    .summary {
        font-size: 0.95rem;
    }

    .custom-badge {
        font-size: 0.75rem;
        background: #153320;
        border: 1px solid #8fcc9a;
        padding: 2px 6px;
        border-radius: 999px;
    }

    .detail-link {
        width: fit-content;
        color: white;
    }
</style>
