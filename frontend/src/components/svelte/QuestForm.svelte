<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { db, ENTITY_TYPES } from '../../utils/customcontent.js';
    import QuestPreview from './QuestPreview.svelte';
    import {
        validateQuestData,
        validateQuestDependencies,
    } from '../../utils/customQuestValidation.js';
    import { isQuestTitleUnique } from '../../utils/questHelpers.js';

    export let isEdit = false;
    export let questId = null;
    export let existingQuests = [];

    let title = '';
    let description = '';
    let image = null;
    let previewUrl = null;
    let showPreview = false;
    let requiresQuests = [];
    let allQuests = [];
    let validationErrors = {};
    let isSubmitting = false;
    const MIN_TITLE_LENGTH = 3;
    const MIN_DESC_LENGTH = 10;

    let touched = { title: false, description: false };

    const dispatch = createEventDispatcher();

    // If in edit mode, load the quest data
    onMount(async () => {
        if (isEdit && questId) {
            try {
                const questData = await db.quests.get(questId);
                title = questData.title;
                description = questData.description;
                requiresQuests = questData.requiresQuests || [];
                if (questData.image) {
                    previewUrl = questData.image;
                }
            } catch (error) {
                console.error('Error loading quest:', error);
            }
        }

        if (existingQuests.length === 0) {
            try {
                allQuests = await db.list(ENTITY_TYPES.QUEST);
            } catch (error) {
                console.error('Error loading quests:', error);
            }
        } else {
            allQuests = existingQuests;
        }
    });

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewUrl = e.target.result;
            };
            reader.readAsDataURL(file);
            image = file;
            validateForm();
        } else {
            previewUrl = null;
            image = null;
            validateForm();
        }
    }

    function handleRequirementsChange(event) {
        requiresQuests = Array.from(event.target.selectedOptions).map((opt) => opt.value);
    }

    function handleTitleInput(event) {
        title = event.target.value;
        touched.title = true;
        validateForm();
    }

    function handleDescriptionInput(event) {
        description = event.target.value;
        touched.description = true;
        validateForm();
    }

    async function validateForm() {
        const errors = {};

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            errors.title = 'Title is required';
        } else if (trimmedTitle.length < MIN_TITLE_LENGTH) {
            errors.title = `Title must be at least ${MIN_TITLE_LENGTH} characters`;
        } else if (!isQuestTitleUnique(trimmedTitle, allQuests, isEdit ? questId : null)) {
            errors.title = 'Title must be unique';
        }

        const trimmedDesc = description.trim();
        if (!trimmedDesc) {
            errors.description = 'Description is required';
        } else if (trimmedDesc.length < MIN_DESC_LENGTH) {
            errors.description = `Description must be at least ${MIN_DESC_LENGTH} characters`;
        }

        if (!isEdit && !image && !previewUrl) {
            errors.image = 'Image is required';
        }

        const { valid, errors: schemaErrors } = validateQuestData({
            title: title.trim(),
            description: description.trim(),
            image: previewUrl || '',
            requiresQuests,
        });
        if (!valid && schemaErrors) {
            schemaErrors.forEach((err) => {
                const field = err.instancePath.replace('/', '');
                if (!field) return;
                if (field === 'image' && !errors.image) {
                    errors.image = 'Invalid image format';
                } else if (field === 'requiresQuests' && !errors.requiresQuests) {
                    errors.requiresQuests = 'Invalid quest dependency';
                } else if (!errors[field]) {
                    errors[field] = 'Invalid characters';
                }
            });
        }

        if (
            requiresQuests.length > 0 &&
            !validateQuestDependencies(
                requiresQuests,
                allQuests.map((q) => q.id)
            )
        ) {
            errors.requiresQuests = 'Unknown quest dependency';
        }

        validationErrors = errors;
        return Object.keys(errors).length === 0;
    }

    async function uploadImage(file) {
        if (!file) return previewUrl; // Return existing image URL if no new file

        // For demo purposes, simulate an image upload
        // In production, you would use a real upload service
        // This is a placeholder for actual image upload logic
        const formData = new FormData();
        formData.append('image', file);

        try {
            // Simulate API call
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                return data.url;
            } else {
                throw new Error('Image upload failed');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            // Fall back to the data URL for demo/testing
            return previewUrl;
        }
    }

    async function handlePreview() {
        const isValid = await validateForm();
        if (isValid) {
            showPreview = true;
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        // Validate form
        const isValid = await validateForm();
        if (!isValid) return;

        isSubmitting = true;

        try {
            // Upload image if there's a new one
            const imageUrl = await uploadImage(image);

            if (isEdit) {
                // Update existing quest
                await db.quests.update(questId, {
                    title,
                    description,
                    image: imageUrl,
                    requiresQuests,
                    updatedAt: new Date().toISOString(),
                });

                dispatch('success', { message: 'Quest updated successfully', id: questId });
            } else {
                // Create new quest
                const newQuestId = await db.quests.add({
                    title,
                    description,
                    image: imageUrl,
                    requiresQuests,
                });

                dispatch('success', { message: 'Quest created successfully', id: newQuestId });

                // Reset form after successful submission
                title = '';
                description = '';
                image = null;
                previewUrl = null;
                requiresQuests = [];
            }
        } catch (error) {
            console.error('Error saving quest:', error);
            dispatch('error', { message: 'Failed to save quest' });
        } finally {
            isSubmitting = false;
        }
    }
</script>

<form on:submit={handleSubmit} class="quest-form">
    <div class="form-group">
        <label for="title">Title*</label>
        <input
            type="text"
            id="title"
            bind:value={title}
            placeholder="Gather resources"
            class:error={validationErrors.title}
            on:input={handleTitleInput}
        />
        {#if validationErrors.title}
            <span class="error-message">{validationErrors.title}</span>
        {/if}
    </div>

    <div class="form-group">
        <label for="description">Description*</label>
        <textarea
            id="description"
            bind:value={description}
            placeholder="Describe the quest in detail. What needs to be done?"
            class:error={validationErrors.description}
            on:input={handleDescriptionInput}
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
                <img src={previewUrl} class="image-preview" alt="Quest preview" />
            </div>
        {/if}
    </div>

    <div class="form-group">
        <label for="requires">Quest Requirements</label>
        <select id="requires" multiple on:change={handleRequirementsChange}>
            {#each allQuests as q}
                <option value={q.id} selected={requiresQuests.includes(q.id)}>
                    {q.title}
                </option>
            {/each}
        </select>
        {#if validationErrors.requiresQuests}
            <span class="error-message">{validationErrors.requiresQuests}</span>
        {/if}
    </div>

    <div class="form-submit">
        <button type="submit" class="submit-button" disabled={isSubmitting}>
            {#if isSubmitting}
                Saving...
            {:else if isEdit}
                Update Quest
            {:else}
                Create Quest
            {/if}
        </button>
        <button type="button" class="preview-button" on:click={handlePreview}> Preview </button>
    </div>
</form>

{#if showPreview}
    <QuestPreview {title} {description} imageUrl={previewUrl} />
{/if}

<style>
    .quest-form {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        color: #fff;
        font-family: Arial, sans-serif;
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
        width: 95%;
        padding: 10px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        font-size: 16px;
        border: 2px solid #007006;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    select {
        width: 95%;
        padding: 10px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        font-size: 16px;
        border: 2px solid #007006;
        outline: none;
    }

    input.error,
    textarea.error {
        border-color: #ff3e3e;
        background-color: #ffecec;
    }

    .error-message {
        color: #ff3e3e;
        font-size: 14px;
        display: block;
        margin-top: 5px;
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

    .form-submit {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
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
        margin-top: 10px;
    }

    .submit-button:hover:not(:disabled) {
        background-color: #005004;
    }

    .submit-button:disabled {
        background-color: #88a889;
        cursor: not-allowed;
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

    @media (max-width: 480px) {
        .quest-form {
            padding: 10px;
        }

        input,
        textarea,
        select {
            width: 100%;
            font-size: 14px;
        }

        .form-submit {
            flex-direction: column;
            align-items: stretch;
        }

        .preview-button {
            margin-left: 0;
            width: 100%;
        }

        .submit-button {
            width: 100%;
        }
    }
</style>
