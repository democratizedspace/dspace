<script>
    import { onMount } from 'svelte';
    import ItemCard from '../../../components/svelte/ItemCard.svelte';
    import ItemPreview from '../../../components/svelte/ItemPreview.svelte';
    import { db, ENTITY_TYPES } from '../../../utils/customcontent.js';
    import { togglePreviewId } from '../../../utils/preview.js';

    export let items = [];
    let customItems = [];
    let mounted = false;
    let searchTerm = '';
    let previewItemId = null;

    onMount(async () => {
        customItems = await db.list(ENTITY_TYPES.ITEM);
        mounted = true;
    });

    $: allItems = [...items, ...customItems];
    $: filteredItems = allItems.filter((item) => {
        const term = searchTerm.toLowerCase();
        return (
            item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term)
        );
    });

    function handleEdit(id) {
        window.location.href = `/inventory/item/${id}/edit`;
    }

    async function handleDelete(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await db.items.delete(id);
                customItems = customItems.filter((i) => i.id !== id);
            } catch (err) {
                console.error('Error deleting item:', err);
                alert('Failed to delete item');
            }
        }
    }

    function togglePreview(id) {
        previewItemId = togglePreviewId(previewItemId, id);
    }
</script>

<div class="manage-items">
    {#if mounted}
        <div class="controls">
            <input type="text" bind:value={searchTerm} placeholder="Search items..." />
        </div>

        <div class="items-list">
            {#if filteredItems.length === 0}
                <div class="no-items">No items found</div>
            {:else}
                {#each filteredItems as item (item.id)}
                    <div class="item-row">
                        <ItemCard itemId={item.id} />
                        <div class="item-actions">
                            <button class="preview-button" on:click={() => togglePreview(item.id)}>
                                Preview
                            </button>
                            {#if item.custom}
                                <button class="edit-button" on:click={() => handleEdit(item.id)}>
                                    Edit
                                </button>
                                <button
                                    class="delete-button"
                                    on:click={() => handleDelete(item.id)}
                                >
                                    Delete
                                </button>
                            {/if}
                        </div>
                        {#if previewItemId === item.id}
                            <ItemPreview
                                name={item.name}
                                description={item.description}
                                imageUrl={item.image}
                                price={item.price}
                                unit={item.unit}
                                type={item.type}
                                dependencies={item.dependencies || []}
                            />
                        {/if}
                    </div>
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style>
    .manage-items {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    .controls {
        margin-bottom: 30px;
    }

    .controls input {
        padding: 10px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        border: 2px solid #007006;
        font-size: 16px;
        width: 200px;
    }

    .item-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding: 15px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
    }

    .item-actions {
        display: flex;
        gap: 10px;
    }

    .preview-button,
    .edit-button,
    .delete-button {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    }

    .preview-button {
        background-color: #666;
        color: white;
    }

    .edit-button {
        background-color: #007006;
        color: white;
    }

    .delete-button {
        background-color: #dd3333;
        color: white;
    }

    .edit-button:hover {
        background-color: #005004;
    }

    .delete-button:hover {
        background-color: #bb2222;
    }

    .preview-button:hover {
        background-color: #555;
    }

    .no-items {
        text-align: center;
        padding: 40px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        color: white;
    }
</style>
