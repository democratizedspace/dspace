<script>
    import { createEventDispatcher } from 'svelte';
    import ItemSelector from './ItemSelector.svelte';
    import items from '../../pages/inventory/json/items.json';

    export let title = '';
    export let duration = '';
    export let requireItems = [];
    export let consumeItems = [];
    export let createItems = [];

    const dispatch = createEventDispatcher();

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
        // Duration should be in format like "1h 30m", "2h", "45m", etc.
        const pattern = /^(\d+h\s*)?(\d+m\s*)?$/;
        return pattern.test(duration.trim());
    }

    function validateItems() {
        // Check if any item has negative or zero count
        const allItems = [...requireItems, ...consumeItems, ...createItems];
        return allItems.every((item) => item.count > 0);
    }

    function handleSubmit(event) {
        event.preventDefault();

        // Validate duration format
        if (!validateDuration(duration)) {
            return;
        }

        // Validate item counts
        if (!validateItems()) {
            return;
        }

        // Validate required fields
        if (!title || !duration) {
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

<form on:submit={handleSubmit} class="process-form">
    <div class="form-group">
        <label for="title">Title*</label>
        <input type="text" id="title" bind:value={title} placeholder="Process title" required />
    </div>

    <div class="form-group">
        <label for="duration">Duration*</label>
        <input type="text" id="duration" bind:value={duration} placeholder="e.g. 1h 30m" required />
    </div>

    <div class="form-group">
        <label>Required Items</label>
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

    <div class="form-group">
        <label>Consumed Items</label>
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

    <div class="form-group">
        <label>Created Items</label>
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
        <button type="button" class="add-button" on:click={addItemCreation}>Add Created Item</button
        >
    </div>

    <div class="form-submit">
        <button type="submit" class="submit-button">Create Process</button>
    </div>
</form>

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
        padding: 8px 16px;
        background-color: #44ff44;
        color: black;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s ease-in-out;
        margin-top: 10px;
    }

    .add-button:hover {
        background-color: #00cc00;
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
</style>
