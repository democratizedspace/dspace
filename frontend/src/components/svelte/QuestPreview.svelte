<script>
    export let title = '';
    export let description = '';
    export let imageUrl = '';
</script>

<div class="quest-preview">
    {#if imageUrl}
        <img src={imageUrl} alt="Quest preview" class="quest-image" />
    {/if}
    <h3>{title}</h3>
    <p>{description}</p>
</div>

<style>
    .quest-preview {
        border: 2px dashed #007006;
        padding: 1rem;
        margin-top: 1rem;
        border-radius: 8px;
        background: #19331f;
        color: #fff;
        text-align: left;
    }
    .quest-image {
        max-width: 100%;
        border-radius: 4px;
        margin-bottom: 0.5rem;
    }
</style>
