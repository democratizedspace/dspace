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
    let npc = '';
    let startNodeId = '';
    let dialogueNodes = [];
    let newNodeId = '';
    let newNodeText = '';
    let nodeDraftError = '';
    const MIN_TITLE_LENGTH = 3;
    const MIN_DESC_LENGTH = 10;

    let touched = { title: false, description: false };

    const dispatch = createEventDispatcher();

    const OPTION_TYPES = [
        { value: 'goto', label: 'Go to node' },
        { value: 'finish', label: 'Finish quest' },
        { value: 'process', label: 'Run process' },
        { value: 'grantsItems', label: 'Grant items' },
    ];

    function normalizeOption(option) {
        const normalized = { ...option };

        if (normalized.type === 'goto') {
            normalized.goto = normalized.goto ?? '';
        } else {
            delete normalized.goto;
        }

        if (normalized.type === 'process') {
            normalized.process = normalized.process ?? '';
        } else {
            delete normalized.process;
        }

        if (normalized.type === 'grantsItems') {
            normalized.grantsItems = Array.isArray(normalized.grantsItems)
                ? normalized.grantsItems
                : [];
        } else {
            delete normalized.grantsItems;
        }

        return normalized;
    }

    function createOptionDraft() {
        return normalizeOption({
            type: 'goto',
            text: '',
            goto: '',
            process: '',
            grantsItems: [],
        });
    }

    // If in edit mode, load the quest data
    onMount(async () => {
        if (isEdit && questId) {
            try {
                const questData = await db.quests.get(questId);
                title = questData.title;
                description = questData.description;
                requiresQuests = questData.requiresQuests || [];
                npc = questData.npc || '';
                startNodeId = questData.start || '';
                dialogueNodes = (questData.dialogue || []).map((node) => ({
                    id: node.id,
                    text: node.text,
                    options: (node.options || []).map((option) => normalizeOption(option)),
                    newOption: createOptionDraft(),
                    optionError: '',
                }));
                if (questData.image) {
                    previewUrl = questData.image;
                }
            } catch (error) {
                console.error('Error loading quest:', error);
            }
        }

        if (dialogueNodes.length === 0 && startNodeId) {
            startNodeId = '';
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

    function handleNpcInput(event) {
        npc = event.target.value;
        validateForm();
    }

    function handleStartNodeChange(event) {
        startNodeId = event.target.value;
        validateForm();
    }

    function updateNodeText(index, value) {
        dialogueNodes = dialogueNodes.map((node, idx) =>
            idx === index ? { ...node, text: value } : node
        );
        validateForm();
    }

    function updateOptionField(nodeIndex, optionIndex, field, value) {
        dialogueNodes = dialogueNodes.map((node, idx) => {
            if (idx !== nodeIndex) {
                return node;
            }

            const updatedOptions = node.options.map((option, optIdx) => {
                if (optIdx !== optionIndex) {
                    return option;
                }

                return normalizeOption({ ...option, [field]: value });
            });

            return { ...node, options: updatedOptions };
        });
        validateForm();
    }

    function updateOptionDraft(nodeIndex, field, value) {
        dialogueNodes = dialogueNodes.map((node, idx) => {
            if (idx !== nodeIndex) {
                return node;
            }

            const draft = normalizeOption({
                ...node.newOption,
                [field]: value,
            });

            return { ...node, newOption: draft };
        });
    }

    function addOption(nodeIndex) {
        const node = dialogueNodes[nodeIndex];
        const draft = node.newOption;
        const optionText = (draft.text || '').trim();
        const optionType = draft.type || 'goto';

        if (!optionText) {
            dialogueNodes = dialogueNodes.map((n, idx) =>
                idx === nodeIndex ? { ...n, optionError: 'Option text is required' } : n
            );
            return;
        }

        if (optionType === 'goto') {
            const target = (draft.goto || '').trim();
            if (!target) {
                dialogueNodes = dialogueNodes.map((n, idx) =>
                    idx === nodeIndex
                        ? { ...n, optionError: 'Target node is required for goto options' }
                        : n
                );
                return;
            }
        }

        if (optionType === 'process') {
            const processId = (draft.process || '').trim();
            if (!processId) {
                dialogueNodes = dialogueNodes.map((n, idx) =>
                    idx === nodeIndex
                        ? { ...n, optionError: 'Process options require a process ID' }
                        : n
                );
                return;
            }
        }

        const newOption = normalizeOption({
            type: optionType,
            text: optionText,
            goto: optionType === 'goto' ? (draft.goto || '').trim() : undefined,
            process: optionType === 'process' ? (draft.process || '').trim() : undefined,
            grantsItems: optionType === 'grantsItems' ? draft.grantsItems : undefined,
        });

        dialogueNodes = dialogueNodes.map((n, idx) =>
            idx === nodeIndex
                ? {
                      ...n,
                      options: [...n.options, newOption],
                      newOption: createOptionDraft(),
                      optionError: '',
                  }
                : n
        );
        validateForm();
    }

    function removeOption(nodeIndex, optionIndex) {
        dialogueNodes = dialogueNodes.map((node, idx) =>
            idx === nodeIndex
                ? {
                      ...node,
                      options: node.options.filter((_, optIdx) => optIdx !== optionIndex),
                  }
                : node
        );
        validateForm();
    }

    function addDialogueNode() {
        const id = newNodeId.trim();
        const text = newNodeText.trim();

        if (!id || !text) {
            nodeDraftError = 'Node ID and text are required';
            return;
        }

        if (dialogueNodes.some((node) => node.id === id)) {
            nodeDraftError = 'Node ID must be unique';
            return;
        }

        const newNode = {
            id,
            text,
            options: [],
            newOption: createOptionDraft(),
            optionError: '',
        };

        dialogueNodes = [...dialogueNodes, newNode];
        newNodeId = '';
        newNodeText = '';
        nodeDraftError = '';

        if (!startNodeId) {
            startNodeId = id;
        }

        validateForm();
    }

    function removeDialogueNode(index) {
        const removedNode = dialogueNodes[index];
        dialogueNodes = dialogueNodes.filter((_, idx) => idx !== index);

        if (startNodeId === removedNode?.id) {
            startNodeId = dialogueNodes[0]?.id ?? '';
        }

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
            npc: npc.trim(),
            start: startNodeId,
            dialogue: dialogueNodes.map((node) => ({
                id: node.id,
                text: node.text,
                options: node.options,
            })),
        });
        if (!valid && schemaErrors) {
            schemaErrors.forEach((err) => {
                const field = err.instancePath.replace('/', '');
                if (!field) return;
                if (field === 'image' && !errors.image) {
                    errors.image = 'Invalid image format';
                } else if (field === 'requiresQuests' && !errors.requiresQuests) {
                    errors.requiresQuests = 'Invalid quest dependency';
                } else if (field === 'npc' && !errors.npc) {
                    errors.npc = 'NPC is required';
                } else if (field.startsWith('dialogue') && !errors.dialogue) {
                    errors.dialogue = 'Dialogue nodes are invalid';
                } else if (field === 'start' && !errors.startNode) {
                    errors.startNode = 'Start node is required';
                } else if (!errors[field]) {
                    errors[field] = 'Invalid characters';
                }
            });
        }

        if (!npc.trim()) {
            errors.npc = errors.npc || 'NPC is required';
        }

        if (dialogueNodes.length === 0) {
            errors.dialogue = errors.dialogue || 'Add at least one dialogue node';
        }

        const nodeIds = new Set();
        for (const node of dialogueNodes) {
            const trimmedId = (node.id || '').trim();
            const trimmedText = (node.text || '').trim();

            if (!trimmedId) {
                errors.dialogue = 'Dialogue nodes require an ID';
                break;
            }

            if (nodeIds.has(trimmedId)) {
                errors.dialogue = 'Dialogue node IDs must be unique';
                break;
            }

            nodeIds.add(trimmedId);

            if (!trimmedText) {
                errors.dialogue = 'Dialogue nodes require text';
                break;
            }

            if (!node.options || node.options.length === 0) {
                errors.dialogue = 'Each dialogue node needs at least one option';
                break;
            }

            const missingOptionText = node.options.find((option) => !(option.text || '').trim());
            if (missingOptionText) {
                errors.dialogue = 'Dialogue options require text';
                break;
            }

            const missingGotoTarget = node.options.find(
                (option) => option.type === 'goto' && !(option.goto || '').trim()
            );
            if (missingGotoTarget) {
                errors.dialogue = 'Goto options require a target node';
                break;
            }
        }

        if (!startNodeId) {
            errors.startNode = 'Select a start node';
        } else if (!nodeIds.has(startNodeId)) {
            errors.startNode = 'Start node must reference an existing dialogue node';
        }

        if (!errors.dialogue) {
            const invalidTarget = dialogueNodes
                .flatMap((node) =>
                    node.options
                        .filter((option) => option.type === 'goto')
                        .map((option) => ({ from: node.id, target: option.goto }))
                )
                .find(({ target }) => target && !nodeIds.has(target));

            if (invalidTarget) {
                errors.dialogue = `Option target not found: ${invalidTarget.target}`;
            }
        }

        if (!errors.dialogue) {
            const missingProcess = dialogueNodes
                .flatMap((node) =>
                    node.options
                        .filter((option) => option.type === 'process')
                        .map((option) => option.process)
                )
                .find((processId) => processId != null && !(processId || '').trim());

            if (missingProcess !== undefined) {
                errors.dialogue = 'Process options require a process ID';
            }
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
                    npc: npc.trim(),
                    start: startNodeId,
                    dialogue: dialogueNodes.map((node) => ({
                        id: node.id,
                        text: node.text,
                        options: node.options.map((option) => normalizeOption(option)),
                    })),
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
                    npc: npc.trim(),
                    start: startNodeId,
                    dialogue: dialogueNodes.map((node) => ({
                        id: node.id,
                        text: node.text,
                        options: node.options.map((option) => normalizeOption(option)),
                    })),
                });

                dispatch('success', { message: 'Quest created successfully', id: newQuestId });

                // Reset form after successful submission
                title = '';
                description = '';
                image = null;
                previewUrl = null;
                requiresQuests = [];
                npc = '';
                startNodeId = '';
                dialogueNodes = [];
                nodeDraftError = '';
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

    <div class="form-group">
        <label for="npc">NPC Identifier*</label>
        <input
            id="npc"
            type="text"
            bind:value={npc}
            placeholder="e.g. /assets/npc/dChat.jpg"
            class:error={validationErrors.npc}
            on:input={handleNpcInput}
        />
        {#if validationErrors.npc}
            <span class="error-message">{validationErrors.npc}</span>
        {/if}
    </div>

    <section class="dialogue-builder">
        <h2>Dialogue</h2>
        <div class="new-node">
            <div class="form-group">
                <label for="new-node-id">New node ID</label>
                <input id="new-node-id" type="text" bind:value={newNodeId} placeholder="start" />
            </div>
            <div class="form-group">
                <label for="new-node-text">Node text</label>
                <textarea id="new-node-text" bind:value={newNodeText} placeholder="NPC dialogue" />
            </div>
            <button type="button" class="add-button" on:click={addDialogueNode}>
                Add Dialogue Node
            </button>
            {#if nodeDraftError}
                <span class="error-message">{nodeDraftError}</span>
            {/if}
        </div>

        {#if dialogueNodes.length > 0}
            <div class="form-group">
                <label for="start-node">Start node*</label>
                <select id="start-node" bind:value={startNodeId} on:change={handleStartNodeChange}>
                    <option value="" disabled>Select start node</option>
                    {#each dialogueNodes as node}
                        <option value={node.id}>{node.id}</option>
                    {/each}
                </select>
                {#if validationErrors.startNode}
                    <span class="error-message">{validationErrors.startNode}</span>
                {/if}
            </div>

            {#each dialogueNodes as node, index (node.id)}
                <section class="dialogue-node">
                    <header class="dialogue-header">
                        <h3>{node.id}</h3>
                        <button
                            type="button"
                            class="delete-button"
                            on:click={() => removeDialogueNode(index)}
                        >
                            Remove node
                        </button>
                    </header>
                    <div class="form-group">
                        <label for={`node-text-${node.id}`}>Dialogue text</label>
                        <textarea
                            id={`node-text-${node.id}`}
                            value={node.text}
                            on:input={(event) => updateNodeText(index, event.target.value)}
                        />
                    </div>

                    <div class="options-list">
                        <h4>Options</h4>
                        {#each node.options as option, optionIndex (optionIndex)}
                            <div class="option-row">
                                <label for={`option-${node.id}-${optionIndex}-text`}>Text</label>
                                <input
                                    id={`option-${node.id}-${optionIndex}-text`}
                                    type="text"
                                    value={option.text}
                                    on:input={(event) =>
                                        updateOptionField(
                                            index,
                                            optionIndex,
                                            'text',
                                            event.target.value
                                        )}
                                />
                                <label for={`option-${node.id}-${optionIndex}-type`}>Type</label>
                                <select
                                    id={`option-${node.id}-${optionIndex}-type`}
                                    value={option.type}
                                    on:change={(event) =>
                                        updateOptionField(
                                            index,
                                            optionIndex,
                                            'type',
                                            event.target.value
                                        )}
                                >
                                    {#each OPTION_TYPES as typeOption}
                                        <option value={typeOption.value}>{typeOption.label}</option>
                                    {/each}
                                </select>
                                {#if option.type === 'goto'}
                                    <label for={`option-${node.id}-${optionIndex}-goto`}
                                        >Target node</label
                                    >
                                    <input
                                        id={`option-${node.id}-${optionIndex}-goto`}
                                        type="text"
                                        value={option.goto}
                                        on:input={(event) =>
                                            updateOptionField(
                                                index,
                                                optionIndex,
                                                'goto',
                                                event.target.value
                                            )}
                                    />
                                {:else if option.type === 'process'}
                                    <label for={`option-${node.id}-${optionIndex}-process`}
                                        >Process ID</label
                                    >
                                    <input
                                        id={`option-${node.id}-${optionIndex}-process`}
                                        type="text"
                                        value={option.process}
                                        on:input={(event) =>
                                            updateOptionField(
                                                index,
                                                optionIndex,
                                                'process',
                                                event.target.value
                                            )}
                                    />
                                {/if}
                                <button
                                    type="button"
                                    class="delete-button"
                                    on:click={() => removeOption(index, optionIndex)}
                                >
                                    Remove option
                                </button>
                            </div>
                        {/each}

                        <div class="option-draft">
                            <label for={`option-text-${node.id}`}>New option text</label>
                            <input
                                id={`option-text-${node.id}`}
                                type="text"
                                value={node.newOption.text || ''}
                                on:input={(event) =>
                                    updateOptionDraft(index, 'text', event.target.value)}
                            />
                            <label for={`option-type-${node.id}`}>Type</label>
                            <select
                                id={`option-type-${node.id}`}
                                value={node.newOption.type || 'goto'}
                                on:change={(event) =>
                                    updateOptionDraft(index, 'type', event.target.value)}
                            >
                                {#each OPTION_TYPES as typeOption}
                                    <option value={typeOption.value}>{typeOption.label}</option>
                                {/each}
                            </select>
                            {#if (node.newOption.type || 'goto') === 'goto'}
                                <label for={`option-target-${node.id}`}>Target node</label>
                                <input
                                    id={`option-target-${node.id}`}
                                    type="text"
                                    value={node.newOption.goto || ''}
                                    on:input={(event) =>
                                        updateOptionDraft(index, 'goto', event.target.value)}
                                />
                            {:else if (node.newOption.type || 'goto') === 'process'}
                                <label for={`option-process-${node.id}`}>Process ID</label>
                                <input
                                    id={`option-process-${node.id}`}
                                    type="text"
                                    value={node.newOption.process || ''}
                                    on:input={(event) =>
                                        updateOptionDraft(index, 'process', event.target.value)}
                                />
                            {/if}
                            <button
                                type="button"
                                class="add-button"
                                on:click={() => addOption(index)}
                            >
                                Add Option
                            </button>
                        </div>
                        {#if node.optionError}
                            <span class="error-message">{node.optionError}</span>
                        {/if}
                    </div>
                </section>
            {/each}
        {/if}

        {#if validationErrors.dialogue}
            <span class="error-message">{validationErrors.dialogue}</span>
        {/if}
    </section>

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
    .quest-form,
    .quest-form * {
        box-sizing: border-box;
    }

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
        outline: 3px solid #0f0;
        outline-offset: 2px;
    }

    select:focus {
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

    .dialogue-builder {
        margin-top: 20px;
        padding: 15px;
        border: 2px dashed #00b33c;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.15);
    }

    .dialogue-builder h2 {
        margin-top: 0;
        color: #00ff88;
    }

    .new-node {
        border: 2px solid #007006;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
        background: rgba(0, 0, 0, 0.1);
    }

    .dialogue-node {
        margin-top: 20px;
        padding: 15px;
        border: 2px solid #007006;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.08);
    }

    .dialogue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }

    .dialogue-header h3 {
        margin: 0;
        color: #00ff88;
    }

    .options-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .option-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px;
        align-items: end;
        background: rgba(0, 0, 0, 0.06);
        padding: 10px;
        border-radius: 8px;
    }

    .option-row input,
    .option-row select {
        width: 100%;
    }

    .option-draft {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 10px;
        align-items: end;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 12px;
    }

    .add-button {
        margin-top: 10px;
        background-color: #0055cc;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
        align-self: start;
    }

    .add-button:hover {
        background-color: #003d99;
    }

    .delete-button {
        background-color: #aa1b1b;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
    }

    .delete-button:hover {
        background-color: #800f0f;
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
