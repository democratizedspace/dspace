<script>
    import { onMount } from 'svelte';
    import ItemForm from '../../../components/svelte/ItemForm.svelte';
    import { db, ENTITY_TYPES } from '../../../utils/customcontent.js';

    export let itemId;

    let itemData = null;
    let errorMessage = '';
    let isLoading = true;

    onMount(async () => {
        if (!itemId) {
            errorMessage = 'Missing item ID.';
            isLoading = false;
            return;
        }

        try {
            itemData = await db.get(ENTITY_TYPES.ITEM, itemId);
        } catch (error) {
            console.error('Failed to load custom item for editing:', error);
            errorMessage = 'Unable to find that custom item.';
        } finally {
            isLoading = false;
        }
    });
</script>

{#if isLoading}
    <p class="status">Loading item…</p>
{:else if errorMessage}
    <p class="status error" role="alert">{errorMessage}</p>
{:else}
    <ItemForm {itemData} isEdit={true} />
{/if}

<style>
    .status {
        color: var(--color-text);
        font-size: 1rem;
    }

    .status.error {
        color: var(--color-danger, #f87171);
    }
</style>
