<script>
    export let title = '';
    export let duration = '';
    export let requireItems = [];
    export let consumeItems = [];
    export let createItems = [];

    let safeRequireItems = [];
    let safeConsumeItems = [];
    let safeCreateItems = [];
    let safeDuration = '';

    $: safeRequireItems = Array.isArray(requireItems) ? requireItems : [];
    $: safeConsumeItems = Array.isArray(consumeItems) ? consumeItems : [];
    $: safeCreateItems = Array.isArray(createItems) ? createItems : [];
    $: safeDuration =
        typeof duration === 'number' || typeof duration === 'string' ? duration : duration ?? '';
</script>

<div class="process-preview">
    <h3>{title}</h3>
    <p>Duration: {safeDuration}</p>

    {#if safeRequireItems.length > 0}
        <h4>Requires:</h4>
        <ul>
            {#each safeRequireItems as item}
                <li>{item?.id ?? 'unknown'} x {item?.count ?? 0}</li>
            {/each}
        </ul>
    {/if}

    {#if safeConsumeItems.length > 0}
        <h4>Consumes:</h4>
        <ul>
            {#each safeConsumeItems as item}
                <li>{item?.id ?? 'unknown'} x {item?.count ?? 0}</li>
            {/each}
        </ul>
    {/if}

    {#if safeCreateItems.length > 0}
        <h4>Creates:</h4>
        <ul>
            {#each safeCreateItems as item}
                <li>{item?.id ?? 'unknown'} x {item?.count ?? 0}</li>
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
