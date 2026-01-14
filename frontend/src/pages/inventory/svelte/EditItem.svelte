<script>
    import { onMount } from 'svelte';
    import ItemForm from '../../../components/svelte/ItemForm.svelte';
    import { db, ENTITY_TYPES } from '../../../utils/customcontent.js';

    export let itemId;

    let itemData = null;
    let isLoading = true;
    let errorMessage = '';

    onMount(async () => {
        try {
            const item = await db.get(ENTITY_TYPES.ITEM, itemId);
            if (!item) {
                errorMessage = 'Custom item not found.';
            } else if (!item.custom) {
                errorMessage = 'Only custom items can be edited here.';
            } else {
                itemData = item;
            }
        } catch (error) {
            console.error('Failed to load custom item', error);
            errorMessage = 'Unable to load this item right now.';
        } finally {
            isLoading = false;
        }
    });
</script>

{#if isLoading}
    <p class="status">Loading item...</p>
{:else if errorMessage}
    <div class="status error">
        <p>{errorMessage}</p>
        <a class="manage-link" href="/inventory/manage">Back to Manage Items</a>
    </div>
{:else}
    <ItemForm isEdit={true} {itemData} />
{/if}

<style>
    .status {
        text-align: center;
        padding: 1.5rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        color: var(--color-text);
    }

    .status.error {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .manage-link {
        color: #68d46d;
        font-weight: 600;
    }
</style>
