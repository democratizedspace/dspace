<script>
    import { createEventDispatcher } from 'svelte';
    export let token = '';
    export let branch = '';
    export let questJson = '';
    let prUrl = '';
    let validationErrors = {};
    const dispatch = createEventDispatcher();
    import { isValidGitHubToken } from '../../utils/githubToken.js';
    import { submitQuestPR } from '../../utils/submitQuestPR.js';

    function validateForm() {
        const errors = {};
        if (!isValidGitHubToken(token)) {
            errors.token = 'GitHub token looks invalid';
        }
        if (!questJson.trim()) {
            errors.quest = 'Quest JSON is required';
        }
        validationErrors = errors;
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!validateForm()) {
            dispatch('error', { message: 'Validation failed' });
            return;
        }
        try {
            prUrl = await submitQuestPR(token, branch, questJson);
            dispatch('success', { message: 'Pull request created', url: prUrl });
            token = '';
        } catch (err) {
            console.error(err);
            dispatch('error', { message: 'Failed to submit quest' });
            token = '';
        }
    }

    export { handleSubmit };
</script>

<form on:submit={handleSubmit} class="pr-form">
    <div class="form-group">
        <label for="token">GitHub Token*</label>
        <input
            id="token"
            type="password"
            bind:value={token}
            class:error={validationErrors.token}
            required
        />
        {#if validationErrors.token}
            <span class="error-message">{validationErrors.token}</span>
        {/if}
    </div>
    <div class="form-group">
        <label for="branch">Branch Name</label>
        <input id="branch" type="text" bind:value={branch} placeholder="quest-my-feature" />
    </div>
    <div class="form-group">
        <label for="quest">Quest JSON*</label>
        <textarea
            id="quest"
            bind:value={questJson}
            rows="10"
            class:error={validationErrors.quest}
            required
        />
        {#if validationErrors.quest}
            <span class="error-message">{validationErrors.quest}</span>
        {/if}
    </div>
    <div class="form-submit">
        <button type="submit">Create Pull Request</button>
    </div>
</form>

{#if prUrl}
    <p class="success-message" data-testid="pr-success">
        Pull request created:
        <a href={prUrl} target="_blank" rel="noopener" data-testid="pr-link"> View PR </a>
    </p>
{/if}

<style>
    .pr-form {
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
        margin-bottom: 4px;
        color: white;
    }
    input,
    textarea {
        width: 95%;
        padding: 8px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        border: 2px solid #007006;
    }
    .form-submit {
        text-align: center;
    }
    button {
        padding: 10px 20px;
        background: #007006;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
    }
    .success-message {
        margin-top: 10px;
        color: #90ee90;
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
</style>
