<script>
    export let title = '';
    export let duration = '';
    export let requireItems = [];
    export let consumeItems = [];
    export let createItems = [];

    const normalizeItems = (items = []) => {
        if (!Array.isArray(items)) {
            return [];
        }

        return items
            .filter(Boolean)
            .map((item) => ({
                id: item?.id ?? '',
                count: Number.isFinite(Number(item?.count)) ? Number(item?.count) : 0,
            }))
            .map((item) => ({
                ...item,
                id: String(item.id ?? '').trim(),
            }));
    };

    $: safeRequireItems = normalizeItems(requireItems);
    $: safeConsumeItems = normalizeItems(consumeItems);
    $: safeCreateItems = normalizeItems(createItems);
    $: safeTitle = title ?? '';
    $: safeDuration = duration ?? '';
</script>

<div class="process-preview">
    <h3>{safeTitle}</h3>
    <p>Duration: {safeDuration}</p>

    {#if safeRequireItems.length > 0}
        <h4>Requires:</h4>
        <ul>
            {#each safeRequireItems as item}
                <li>{item.id || 'Unknown item'} x {item.count}</li>
            {/each}
        </ul>
    {/if}

    {#if safeConsumeItems.length > 0}
        <h4>Consumes:</h4>
        <ul>
            {#each safeConsumeItems as item}
                <li>{item.id || 'Unknown item'} x {item.count}</li>
            {/each}
        </ul>
    {/if}

    {#if safeCreateItems.length > 0}
        <h4>Creates:</h4>
        <ul>
            {#each safeCreateItems as item}
                <li>{item.id || 'Unknown item'} x {item.count}</li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .process-preview {
        border: 2px dashed #007006;
        padding: 1rem;
        margin-top: 1rem;
        border-radius: 8px;
        background: #19331f;
        color: #fff;
        text-align: left;
    }
</style>
