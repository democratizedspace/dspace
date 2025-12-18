<script>
    export let title = '';
    export let duration = '';
    export let requireItems = [];
    export let consumeItems = [];
    export let createItems = [];

    const safeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
    const normalizeItems = (items = []) =>
        safeArray(items).map((item, index) => ({
            id: item?.id ?? `unknown-item-${index}`,
            count: typeof item?.count === 'number' ? item.count : item?.count ?? null,
        }));

    $: safeTitle = typeof title === 'string' ? title : '';
    $: safeDuration = duration ?? '';
    $: safeRequireItems = normalizeItems(requireItems);
    $: safeConsumeItems = normalizeItems(consumeItems);
    $: safeCreateItems = normalizeItems(createItems);
</script>

<div class="process-preview">
    <h3>{safeTitle}</h3>
    <p>Duration: {safeDuration}</p>

    {#if safeRequireItems.length > 0}
        <h4>Requires:</h4>
        <ul>
            {#each safeRequireItems as item (item.id)}
                <li>{item.id} x {item.count}</li>
            {/each}
        </ul>
    {/if}

    {#if safeConsumeItems.length > 0}
        <h4>Consumes:</h4>
        <ul>
            {#each safeConsumeItems as item (item.id)}
                <li>{item.id} x {item.count}</li>
            {/each}
        </ul>
    {/if}

    {#if safeCreateItems.length > 0}
        <h4>Creates:</h4>
        <ul>
            {#each safeCreateItems as item (item.id)}
                <li>{item.id} x {item.count}</li>
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
