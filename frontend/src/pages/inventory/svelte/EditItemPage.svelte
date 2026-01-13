<script>
    import { onMount } from 'svelte';
    import ItemForm from '../../../components/svelte/ItemForm.svelte';
    import { db } from '../../../utils/customcontent.js';

    export let itemId = null;
    let itemData = null;
    let loadError = '';
    let isLoading = true;

    onMount(async () => {
        try {
            itemData = await db.items.get(itemId);
        } catch (error) {
            console.error('Unable to load custom item for editing.', error);
            loadError = 'Unable to load this custom item. Try returning to manage items.';
        } finally {
            isLoading = false;
        }
    });
</script>

{#if isLoading}
    <div class="status-message" role="status" aria-live="polite">Loading item…</div>
{:else if loadError}
    <div class="status-message error" role="alert">
        {loadError}
        <a href="/inventory/manage">Back to manage items</a>
    </div>
{:else}
    <ItemForm isEdit={true} {itemData} />
{/if}

<style>
    .status-message {
        text-align: center;
        padding: 20px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        color: white;
    }

    .status-message.error {
        color: #ffb3b3;
    }

    .status-message a {
        color: #68d46d;
        margin-left: 8px;
    }
</style>
