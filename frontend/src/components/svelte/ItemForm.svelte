<script>
    import { createEventDispatcher } from 'svelte';
    import ItemPreview from './ItemPreview.svelte';

    export let name = '';
    export let description = '';
    export let image = null;
    export let previewUrl = null;
    export let price = '';
    export let unit = '';
    export let type = '';
    export let requires = [];

    import items from '../../pages/inventory/json/items.json';

    const dispatch = createEventDispatcher();

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewUrl = e.target.result;
            };
            reader.readAsDataURL(file);
            image = file;
        } else {
            previewUrl = null;
            image = null;
        }
    }

    function addDependency() {
        requires = [...requires, ''];
    }

    function removeDependency(index) {
        requires = requires.filter((_, i) => i !== index);
    }

    function handleDependencyChange(event, index) {
        requires[index] = event.target.value;
    }

    function handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        if (image) {
            formData.append('image', image);
        }
        if (price) {
            formData.append('price', price);
        }
        if (unit) {
            formData.append('unit', unit);
        }
        if (type) {
            formData.append('type', type);
        }
        formData.append('requires', JSON.stringify(requires));

        dispatch('submit', formData);
    }
</script>

<form on:submit={handleSubmit} enctype="multipart/form-data" class="item-form">
    <div class="form-group">
        <label for="name">Name*</label>
        <input type="text" id="name" bind:value={name} placeholder="Item name" required />
    </div>

    <div class="form-group">
        <label for="description">Description*</label>
        <textarea
            id="description"
            bind:value={description}
            placeholder="Describe the item in detail"
            required
        />
    </div>

    <div class="form-group">
        <label for="image">Attach an Image</label>
        <input type="file" id="image" accept="image/*" on:change={handleImageUpload} />
        {#if previewUrl}
            <div class="image-preview-container">
                <img src={previewUrl} class="image-preview" alt="Preview" />
            </div>
        {/if}
    </div>

    <div class="form-group">
        <label for="price">Price (optional)</label>
        <input type="text" id="price" bind:value={price} placeholder="e.g. 100 dUSD" />
    </div>

    <div class="form-group">
        <label for="unit">Unit (optional)</label>
        <input type="text" id="unit" bind:value={unit} placeholder="e.g. kg, m, L" />
    </div>

    <div class="form-group">
        <label for="type">Type (optional)</label>
        <input type="text" id="type" bind:value={type} placeholder="e.g. 3dprint" />
    </div>

    <div class="form-group">
        <label>Dependencies (optional)</label>
        {#each requires as req, index}
            <div class="dependency-row">
                <select on:change={(e) => handleDependencyChange(e, index)} bind:value={requires[index]}>
                    <option value="">Select item</option>
                    {#each items as item}
                        <option value={item.id}>{item.name}</option>
                    {/each}
                </select>
                <button type="button" class="remove-button" on:click={() => removeDependency(index)}>Remove</button>
            </div>
        {/each}
        <button type="button" class="add-button" on:click={addDependency}>Add Dependency</button>
    </div>

    <div class="form-submit">
        <button type="submit" class="submit-button">Create Item</button>
    </div>
</form>

{#if name || description || previewUrl}
    <ItemPreview {name} {description} imageUrl={previewUrl} {price} {unit} {type} />
{/if}

<style>
    .item-form {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        color: #fff;
        font-family: Arial, sans-serif;
        text-align: center;
    }

    .form-group {
        margin-bottom: 15px;
        text-align: left;
    }

    label {
        display: block;
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 6px;
        color: white;
    }

    input,
    textarea {
        width: 85%;
        padding: 10px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        font-size: 16px;
        border: 2px solid #007006;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:focus,
    textarea:focus {
        border-color: #0f0;
        box-shadow: 0 0 8px rgba(0, 255, 0, 0.8);
    }

    textarea {
        height: 120px;
        resize: vertical;
    }

    input[type='file'] {
        width: 100%;
        background: #fff;
        border: 2px solid #007006;
        padding: 8px;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
    }

    .image-preview-container {
        text-align: center;
        margin-top: 10px;
    }

    .image-preview {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        border: 2px solid #007006;
        box-shadow: 0px 0px 10px rgba(0, 255, 0, 0.5);
        margin-top: 10px;
    }

    .submit-button {
        font-size: 16px;
        padding: 10px 20px;
        background-color: #007006;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s ease-in-out;
    }

    .submit-button:hover {
        background-color: #005004;
    }

    .dependency-row {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
    }

    .remove-button {
        margin-left: 8px;
        padding: 5px 10px;
        background-color: #ff4444;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .remove-button:hover {
        background-color: #cc0000;
    }

    .add-button {
        margin-top: 10px;
        padding: 8px 16px;
        background-color: #4488ff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .add-button:hover {
        background-color: #0055cc;
    }
</style>
