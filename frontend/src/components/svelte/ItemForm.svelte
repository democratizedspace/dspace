<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import ItemPreview from './ItemPreview.svelte';
    import { addItems } from '../../utils/gameState/inventory.js';
    import { db } from '../../utils/customcontent.js';
    import { downsampleAndCompressToJpeg } from '../../utils/images/downsample.js';

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
    let dependenciesInput = '';
    let submitError = '';
    let submitSuccess = '';
    let savedItemId = null;
    let isSubmitting = false;

    function parseDependencies(value) {
        return value
            .split(/[\n,]/)
            .map((entry) => entry.trim())
            .filter(Boolean);
    }

    async function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                const processed = await downsampleAndCompressToJpeg(file);
                previewUrl = processed.dataUrl;
                image = processed.dataUrl;
                delete validationErrors.image;
            } catch (error) {
                console.error('Failed to process item image', error);
                validationErrors = {
                    ...validationErrors,
                    image: 'Image processing failed. Please try another file.',
                };
                previewUrl = null;
                image = null;
            }
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
        if (isSubmitting) {
            return;
        }
        submitError = '';
        submitSuccess = '';
        savedItemId = null;
        if (!validateForm()) {
            return;
        }

        const imageUrl = image || previewUrl;

        const parsedDependencies = parseDependencies(dependenciesInput);
        const hasDependenciesInput = dependenciesInput.trim().length > 0;
        const payload = {
            name,
            description,
            image: imageUrl,
            ...(price && { price }),
            ...(unit && { unit }),
            ...(type && { type }),
            ...((hasDependenciesInput || (isEdit && itemData?.dependencies?.length)) && {
                dependencies: parsedDependencies,
            }),
        };

        isSubmitting = true;
        let storedId = itemData?.id ?? null;
        try {
            if (isEdit && itemData?.id) {
                await db.items.update(itemData.id, payload);
                storedId = itemData.id;
                submitSuccess = 'Item updated successfully.';
            } else {
                storedId = await db.items.add(payload);
                addItems([{ id: storedId, count: 0 }]);
                submitSuccess = 'Item created successfully.';
            }
            savedItemId = storedId;
        } catch (error) {
            console.error('Failed to save item', error);
            submitError =
                error?.message ||
                'Unable to save the item right now. Please try again or refresh the page.';
            return;
        } finally {
            isSubmitting = false;
        }

        dispatch('submit', { ...payload, id: storedId });
    }

    onMount(() => {
        if (isEdit && itemData) {
            name = itemData.name || '';
            description = itemData.description || '';
            price = itemData.price || '';
            unit = itemData.unit || '';
            type = itemData.type || '';
            previewUrl = itemData.image || null;
            dependenciesInput = (itemData.dependencies || []).join('\n');
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
        ></textarea>
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

    <div class="form-group">
        <label for="dependencies">Dependencies (optional)</label>
        <textarea
            id="dependencies"
            bind:value={dependenciesInput}
            placeholder="Enter item IDs separated by commas or new lines"
        ></textarea>
        <p class="helper-text">Separate dependencies with commas or new lines.</p>
    </div>

    <div class="form-submit">
        <button type="submit" class="submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Update Item' : 'Create Item'}
        </button>
    </div>

    {#if submitError}
        <p class="submit-message error" role="alert">{submitError}</p>
    {/if}
    {#if submitSuccess}
        <p class="submit-message success" role="status">
            {submitSuccess}
            {#if savedItemId}
                <a href={`/inventory/item/${savedItemId}`}>View item</a>
                <span class="separator">•</span>
                <a href="/inventory/manage">Manage items</a>
            {/if}
        </p>
    {/if}
</form>

{#if name || description || previewUrl}
    <ItemPreview
        {name}
        {description}
        imageUrl={previewUrl}
        {price}
        {unit}
        {type}
        dependencies={parseDependencies(dependenciesInput)}
    />
{/if}

<style>
    .item-form {
        width: min(100%, 600px);
        box-sizing: border-box;
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
        width: 100%;
        box-sizing: border-box;
        padding: 10px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        font-size: 16px;
        border: 2px solid #007006;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }

    input:focus,
    textarea:focus {
        border-color: #0f0;
        box-shadow: 0 0 8px rgba(0, 255, 0, 0.8);
        outline: 3px solid #0f0;
        outline-offset: 2px;
    }

    textarea {
        height: 120px;
        resize: vertical;
    }

    input[type='file'] {
        width: 100%;
        box-sizing: border-box;
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

    .helper-text {
        font-size: 14px;
        color: #c4f5c6;
        margin-top: 6px;
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

    .form-submit {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
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

    .submit-button:disabled {
        cursor: wait;
        opacity: 0.7;
    }

    .submit-button:disabled:hover {
        background-color: #007006;
        cursor: wait;
        opacity: 0.7;
    }

    .submit-message {
        margin-top: 12px;
        font-size: 15px;
    }

    .submit-message.success {
        color: #baf9c0;
    }

    .submit-message.error {
        color: #ff3e3e;
    }

    .submit-message a {
        color: inherit;
        font-weight: bold;
        text-decoration: underline;
    }

    .separator {
        margin: 0 6px;
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

        .form-submit {
            flex-direction: column;
            align-items: stretch;
        }

        .submit-button {
            width: 100%;
        }
    }
</style>
