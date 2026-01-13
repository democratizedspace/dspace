<script>
    import { onMount } from 'svelte';
    import ItemForm from '../../../components/svelte/ItemForm.svelte';
    import { db } from '../../../utils/customcontent.js';

    export let itemId;

    let itemData = null;
    let isLoading = true;
    let errorMessage = '';

    onMount(async () => {
        isLoading = true;
        errorMessage = '';

        try {
            itemData = await db.items.get(itemId);
        } catch (error) {
            console.error('Failed to load custom item', error);
            errorMessage =
                error?.message || 'Unable to load this item. It may have been deleted.';
        } finally {
            isLoading = false;
        }
    });
</script>

<div class="edit-item">
    {#if isLoading}
        <p class="status">Loading item…</p>
    {:else if errorMessage}
        <p class="status error" role="alert">{errorMessage}</p>
    {:else if itemData}
        <ItemForm isEdit={true} {itemData} />
    {/if}
</div>

<style>
    .status {
        margin: 0;
        padding: 1rem 0;
        font-size: 1rem;
        color: var(--color-text);
    }

    .status.error {
        color: #ffb3b3;
    }
</style>
