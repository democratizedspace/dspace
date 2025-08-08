<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import ItemPreview from './ItemPreview.svelte';
    import { addEntity, updateEntity } from '../../utils/indexeddb.js';

    export let name = '';
    export let description = '';
    export let image = null;
    export let previewUrl = null;
    export let price = '';
    export let unit = '';
    export let type = '';
    export let isEdit = false;
    export let itemData = null;

    const dispatch = createEventDispatcher();
    let validationErrors = {};

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewUrl = e.target.result;
            };
            reader.readAsDataURL(file);
            image = file;
            delete validationErrors.image;
        } else {
            previewUrl = null;
            image = null;
        }
    }

    function validateForm() {
        const errors = {};
        if (!name.trim()) {
            errors.name = 'Name is required';
        }
        if (!description.trim()) {
            errors.description = 'Description is required';
        }
        if (!image && !previewUrl) {
            errors.image = 'Image is required';
        }
        validationErrors = errors;
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }

        let imageUrl = previewUrl;
        if (image instanceof File) {
            const uploadData = new FormData();
            uploadData.append('image', image);
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
            });
            const data = await response.json();
            imageUrl = data.url;
        }

        const payload = {
            name,
            description,
            image: imageUrl,
            ...(price && { price }),
            ...(unit && { unit }),
            ...(type && { type }),
        };

        if (isEdit && itemData?.id) {
            payload.id = itemData.id;
            await updateEntity(payload);
        } else {
            await addEntity(payload);
        }

        dispatch('submit', payload);
    }

    onMount(() => {
        if (isEdit && itemData) {
            name = itemData.name || '';
            description = itemData.description || '';
            price = itemData.price || '';
            unit = itemData.unit || '';
            type = itemData.type || '';
            previewUrl = itemData.image || null;
        }
    });
</script>

<form on:submit={handleSubmit} enctype="multipart/form-data" class="item-form">
    <div class="form-group">
        <label for="name">Name*</label>
        <input
            type="text"
            id="name"
            bind:value={name}
            placeholder="Item name"
            class:error={validationErrors.name}
        />
        {#if validationErrors.name}
            <span class="error-message">{validationErrors.name}</span>
        {/if}
    </div>

    <div class="form-group">
        <label for="description">Description*</label>
        <textarea
            id="description"
            bind:value={description}
            placeholder="Describe the item in detail"
            class:error={validationErrors.description}
        />
        {#if validationErrors.description}
            <span class="error-message">{validationErrors.description}</span>
        {/if}
    </div>

    <div class="form-group">
        <label for="image">Upload an Image*</label>
        <input
            type="file"
            id="image"
            accept="image/*"
            on:change={handleImageUpload}
            class:error={validationErrors.image}
        />
        {#if validationErrors.image}
            <span class="error-message">{validationErrors.image}</span>
        {/if}
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

    <div class="form-submit">
        <button type="submit" class="submit-button">{isEdit ? 'Update Item' : 'Create Item'}</button
        >
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

    input.error,
    textarea.error,
    input[type='file'].error {
        border-color: #ff3e3e;
    }

    .error-message {
        color: #ff3e3e;
        font-size: 14px;
        display: block;
        margin-top: 5px;
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

    @media (max-width: 480px) {
        .item-form {
            padding: 10px;
        }

        input,
        textarea {
            width: 100%;
            font-size: 14px;
        }
    }
</style>
