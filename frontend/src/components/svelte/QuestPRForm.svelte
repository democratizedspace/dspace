<script>
    import { createEventDispatcher, onMount } from 'svelte';
    export let token = '';
    export let branch = '';
    export let questJson = '';
    let prUrl = '';
    let validationErrors = {};
    let submitError = '';
    const dispatch = createEventDispatcher();
    import {
        isValidGitHubToken,
        loadGitHubToken,
        saveGitHubToken,
        clearGitHubToken,
    } from '../../utils/githubToken.js';
    import { submitQuestPR } from '../../utils/submitQuestPR.js';

    onMount(() => {
        token = loadGitHubToken();
    });

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
        submitError = '';
        if (!validateForm()) {
            submitError = 'Please fix the errors above';
            dispatch('error', { message: 'Validation failed' });
            return;
        }
        try {
            prUrl = await submitQuestPR(token, branch, questJson);
            submitError = '';
            dispatch('success', { message: 'Pull request created', url: prUrl });
            saveGitHubToken(token);
        } catch (err) {
            console.error(err);
            submitError = 'Failed to submit quest';
            dispatch('error', { message: 'Failed to submit quest' });
        }
    }

    function clearToken() {
        token = '';
        clearGitHubToken();
    }

    export { handleSubmit, clearToken };
</script>

<form on:submit={handleSubmit} class="pr-form">
    <div class="form-group token-group">
        <label for="token">GitHub Token*</label>
        <div class="token-input">
            <input
                id="token"
                type="password"
                bind:value={token}
                class:error={validationErrors.token}
                required
            />
            <button type="button" on:click={clearToken} data-testid="clear-token"
                >Clear Token</button
            >
        </div>
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

{#if submitError}
    <p class="error-message" data-testid="submit-error">{submitError}</p>
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

    .token-input {
        display: flex;
        gap: 10px;
        align-items: center;
    }

    .token-group button {
        padding: 6px 10px;
    }
</style>
