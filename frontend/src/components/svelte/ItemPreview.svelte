<script>
    export let name = '';
    export let description = '';
    export let imageUrl = '';
    export let price = '';
    export let unit = '';
    export let type = '';
    export let dependencies = [];
</script>

<div class="item-preview">
    {#if imageUrl}
        <img src={imageUrl} alt="Item preview" class="item-image" />
    {/if}
    <h3>{name}</h3>
    <p>{description}</p>
    {#if price}
        <p class="detail">Price: {price}</p>
    {/if}
    {#if unit}
        <p class="detail">Unit: {unit}</p>
    {/if}
    {#if type}
        <p class="detail">Type: {type}</p>
    {/if}
    {#if dependencies.length}
        <div class="detail">
            <span class="detail-label">Dependencies:</span>
            <ul>
                {#each dependencies as dependency}
                    <li>{dependency}</li>
                {/each}
            </ul>
        </div>
    {/if}
</div>

<style>
    .item-preview {
        border: 2px dashed #007006;
        padding: 1rem;
        margin-top: 1rem;
        border-radius: 8px;
        background: #19331f;
        color: #fff;
        text-align: left;
    }
    .item-image {
        max-width: 100%;
        border-radius: 4px;
        margin-bottom: 0.5rem;
    }
    .detail {
        margin: 0.25rem 0;
    }

    .detail-label {
        font-weight: bold;
        display: block;
        margin-bottom: 0.25rem;
    }

    ul {
        margin: 0;
        padding-left: 1.25rem;
    }
</style>
