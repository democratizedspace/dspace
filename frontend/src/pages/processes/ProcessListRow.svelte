<script>
    export let process;

    const normalizedDuration = (duration) => {
        if (typeof duration === 'string' && duration.trim().length > 0) {
            return duration;
        }
        return 'Unknown';
    };

    const toCountSummary = (items) => {
        if (!Array.isArray(items) || items.length === 0) {
            return 'None';
        }

        const total = items.reduce((sum, item) => sum + Number(item?.count ?? 0), 0);
        return `${items.length} type${items.length === 1 ? '' : 's'} (${total} total)`;
    };
</script>

<article class="process-list-row" data-process-id={process?.id ?? ''}>
    <div class="process-header">
        <h3>{process?.title || process?.id || 'Untitled process'}</h3>
        {#if process?.custom}
            <span class="custom-badge">Custom</span>
        {/if}
    </div>
    <p class="duration">Duration: {normalizedDuration(process?.duration)}</p>
    <p class="summary">Requires: {toCountSummary(process?.requireItems)}</p>
    <p class="summary">Consumes: {toCountSummary(process?.consumeItems)}</p>
    <p class="summary">Creates: {toCountSummary(process?.createItems)}</p>
    <a class="details-link" href={`/processes/${process?.id ?? ''}`}>View details</a>
</article>

<style>
    .process-list-row {
        background: #2c5837;
        border: 2px solid #007006;
        border-radius: 12px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .process-header {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
    }

    h3 {
        margin: 0;
        font-size: 1.1rem;
        line-height: 1.3;
    }

    .custom-badge {
        background: #175cd3;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 2px 8px;
        white-space: nowrap;
    }

    .duration,
    .summary {
        margin: 0;
    }

    .details-link {
        align-self: flex-start;
        color: #fff;
        font-weight: 600;
        text-decoration: underline;
    }
</style>
