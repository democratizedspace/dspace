<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import ItemSelector from './ItemSelector.svelte';
    import ProcessPreview from './ProcessPreview.svelte';
    import items from '../../pages/inventory/json/items.json';
    import { durationInSeconds } from '../../utils.js';

    export let title = '';
    export let duration = '';
    export let requireItems = [];
    export let consumeItems = [];
    export let createItems = [];

    let isClientSide = false;
    let showPreview = false;
    let validationErrors = {};

    const dispatch = createEventDispatcher();

    onMount(() => {
        isClientSide = true;
    });

    function addItemRequirement() {
        requireItems = [...requireItems, { id: '', count: 1 }];
    }

    function addItemConsumption() {
        consumeItems = [...consumeItems, { id: '', count: 1 }];
    }

    function addItemCreation() {
        createItems = [...createItems, { id: '', count: 1 }];
    }

    function removeItemRequirement(index) {
        requireItems = requireItems.filter((_, i) => i !== index);
    }

    function removeItemConsumption(index) {
        consumeItems = consumeItems.filter((_, i) => i !== index);
    }

    function removeItemCreation(index) {
        createItems = createItems.filter((_, i) => i !== index);
    }

    function handleItemSelect(event, itemType, index) {
        const { itemId } = event.detail;
        if (itemType === 'require') {
            requireItems[index].id = itemId;
        } else if (itemType === 'consume') {
            consumeItems[index].id = itemId;
        } else if (itemType === 'create') {
            createItems[index].id = itemId;
        }
    }

    function validateDuration(duration) {
        // Accept durations like "1h 30m", "45s", "0.5h" or any combination
        // cspell:ignore dhms
        const pattern = /^(\d+(?:\.\d+)?[dhms]\s*)+$/;
        const trimmed = duration.trim();
        if (!pattern.test(trimmed)) {
            return false;
        }
        return durationInSeconds(trimmed) > 0;
    }

    function validateItems() {
        // Check if any item has negative or zero count
        const allItems = [...requireItems, ...consumeItems, ...createItems];
        return allItems.every((item) => item.count > 0);
    }

    function validateForm() {
        const errors = {};

        if (!title.trim()) {
            errors.title = 'Title is required';
        }

        if (!duration.trim() || !validateDuration(duration)) {
            errors.duration = 'Invalid duration';
        }

        if (!validateItems()) {
            errors.items = 'Item counts must be positive';
        }

        validationErrors = errors;
        return Object.keys(errors).length === 0;
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('duration', duration);
        formData.append('requireItems', JSON.stringify(requireItems));
        formData.append('consumeItems', JSON.stringify(consumeItems));
        formData.append('createItems', JSON.stringify(createItems));

        dispatch('submit', formData);
    }
</script>

<div data-hydrated={isClientSide ? 'true' : 'false'}>
    {#if isClientSide}
        <form on:submit={handleSubmit} class="process-form">
            <div class="form-group">
                <label for="title">Title*</label>
                <input
                    type="text"
                    id="title"
                    bind:value={title}
                    placeholder="Process title"
                    class:error={validationErrors.title}
                    required
                />
                {#if validationErrors.title}
                    <span class="error-message">{validationErrors.title}</span>
                {/if}
            </div>

            <div class="form-group">
                <label for="duration">Duration*</label>
                <input
                    type="text"
                    id="duration"
                    bind:value={duration}
                    placeholder="e.g. 1h 30m"
                    class:error={validationErrors.duration}
                    required
                />
                {#if validationErrors.duration}
                    <span class="error-message">{validationErrors.duration}</span>
                {/if}
            </div>

            <div class="form-group">
                <label for="required-items-section">Required Items</label>
                <div id="required-items-section">
                    {#each requireItems as item, index}
                        <div class="item-row">
                            <ItemSelector
                                {items}
                                selectedItemId={item.id}
                                label="Select Required Item"
                                on:select={(e) => handleItemSelect(e, 'require', index)}
                            />
                            <input type="number" bind:value={item.count} placeholder="Count" />
                            <button
                                type="button"
                                class="remove-button"
                                on:click={() => removeItemRequirement(index)}>Remove</button
                            >
                        </div>
                    {/each}
                    <button type="button" class="add-button" on:click={addItemRequirement}
                        >Add Required Item</button
                    >
                </div>
            </div>

            <div class="form-group">
                <label for="consumed-items-section">Consumed Items</label>
                <div id="consumed-items-section">
                    {#each consumeItems as item, index}
                        <div class="item-row">
                            <ItemSelector
                                {items}
                                selectedItemId={item.id}
                                label="Select Consumed Item"
                                on:select={(e) => handleItemSelect(e, 'consume', index)}
                            />
                            <input type="number" bind:value={item.count} placeholder="Count" />
                            <button
                                type="button"
                                class="remove-button"
                                on:click={() => removeItemConsumption(index)}>Remove</button
                            >
                        </div>
                    {/each}
                    <button type="button" class="add-button" on:click={addItemConsumption}
                        >Add Consumed Item</button
                    >
                </div>
            </div>

            <div class="form-group">
                <label for="created-items-section">Created Items</label>
                <div id="created-items-section">
                    {#each createItems as item, index}
                        <div class="item-row">
                            <ItemSelector
                                {items}
                                selectedItemId={item.id}
                                label="Select Created Item"
                                on:select={(e) => handleItemSelect(e, 'create', index)}
                            />
                            <input type="number" bind:value={item.count} placeholder="Count" />
                            <button
                                type="button"
                                class="remove-button"
                                on:click={() => removeItemCreation(index)}>Remove</button
                            >
                        </div>
                    {/each}
                    <button type="button" class="add-button" on:click={addItemCreation}
                        >Add Created Item</button
                    >
                </div>
            </div>

            {#if validationErrors.items}
                <div class="error-message">{validationErrors.items}</div>
            {/if}

            <div class="form-submit">
                <button type="submit" class="submit-button">Create Process</button>
                <button
                    type="button"
                    class="preview-button"
                    on:click={async () => {
                        if (validateForm()) {
                            showPreview = true;
                        }
                    }}
                >
                    Preview
                </button>
            </div>
        </form>
    {:else}
        <div class="loading-container">
            <p class="loading-text">Loading process form...</p>
        </div>
    {/if}

    {#if showPreview}
        <ProcessPreview {title} {duration} {requireItems} {consumeItems} {createItems} />
    {/if}
</div>

<style>
    .process-form {
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

    .loading-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 40px 20px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        color: #fff;
        font-family: Arial, sans-serif;
        text-align: center;
    }

    .loading-text {
        font-size: 16px;
        font-style: italic;
        color: #d0ffd0;
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

    input {
        padding: 10px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        font-size: 16px;
        border: 2px solid #007006;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    input[type='text'] {
        width: 85%;
    }

    input.error {
        border-color: #ff3e3e;
        background-color: #ffecec;
    }

    input[type='number'] {
        width: 80px;
        text-align: center;
    }

    input:focus {
        border-color: #0f0;
        box-shadow: 0 0 8px rgba(0, 255, 0, 0.8);
    }

    .item-row {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
        align-items: center;
    }

    .item-row :global(.item-selector) {
        flex: 1;
        min-width: 0; /* Allows flex item to shrink below content size */
    }

    .remove-button {
        padding: 5px 10px;
        background-color: #ff4444;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s ease-in-out;
        white-space: nowrap;
        min-width: 80px;
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
        transition: background 0.2s ease-in-out;
    }

    .add-button:hover {
        background-color: #0055cc;
    }

    .submit-button {
        margin-top: 20px;
        padding: 12px 24px;
        background-color: #00cc00;
        color: white;
        font-size: 18px;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s ease-in-out;
    }

    .submit-button:hover {
        background-color: #009900;
    }

    .preview-button {
        margin-top: 20px;
        padding: 12px 24px;
        background-color: #0055cc;
        color: white;
        font-size: 16px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        margin-left: 10px;
    }

    .preview-button:hover {
        background-color: #003d99;
    }

    .error-message {
        color: #ff3e3e;
        font-size: 14px;
        display: block;
        margin-top: 5px;
    }

    .form-submit {
        text-align: center;
        margin-top: 20px;
    }
</style>
