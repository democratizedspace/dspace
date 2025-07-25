<script>
    export let title = '';
    export let duration = '';
    export let requireItems = [];
    export let consumeItems = [];
    export let createItems = [];
</script>

<div class="process-preview">
    <h3>{title}</h3>
    <p>Duration: {duration}</p>

    {#if requireItems.length > 0}
        <h4>Requires:</h4>
        <ul>
            {#each requireItems as item}
                <li>{item.id} x {item.count}</li>
            {/each}
        </ul>
    {/if}

    {#if consumeItems.length > 0}
        <h4>Consumes:</h4>
        <ul>
            {#each consumeItems as item}
                <li>{item.id} x {item.count}</li>
            {/each}
        </ul>
    {/if}

    {#if createItems.length > 0}
        <h4>Creates:</h4>
        <ul>
            {#each createItems as item}
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
