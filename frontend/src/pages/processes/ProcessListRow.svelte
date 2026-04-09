<script>
    export let process;

    const toCount = (items = []) => (Array.isArray(items) ? items.length : 0);

    const summarize = (label, items = []) => {
        const count = toCount(items);
        return `${label}: ${count}`;
    };

    $: processId = String(process?.id ?? '').trim();
    $: title = process?.title ?? processId;
    $: duration = process?.duration ?? 'Unknown';
    $: requireSummary = summarize('Requires', process?.requireItems);
    $: consumeSummary = summarize('Consumes', process?.consumeItems);
    $: createSummary = summarize('Creates', process?.createItems);
</script>

<article class="process-row" data-process-id={processId}>
    <div class="summary">
        <h2>{title}</h2>
        <p class="duration">Duration: {duration}</p>
        <p class="io-summary">{requireSummary} • {consumeSummary} • {createSummary}</p>
    </div>
    <div class="actions">
        {#if process?.custom}
            <span class="badge">Custom</span>
        {/if}
        <a class="details-link" href={`/processes/${processId}`}>View details</a>
    </div>
</article>

<style>
    .process-row {
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        padding: 14px 16px;
        display: flex;
        gap: 12px;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
    }

    .summary h2 {
        margin: 0;
        font-size: 1.1rem;
    }

    .duration,
    .io-summary {
        margin: 4px 0 0;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .badge {
        border: 1px solid #9ec9a3;
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 0.8rem;
    }

    .details-link {
        color: #fff;
        text-decoration: underline;
        font-weight: 600;
    }
</style>
