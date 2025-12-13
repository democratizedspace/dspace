<script>
    import { createEventDispatcher, onMount } from 'svelte';
    export let token = '';
    export let branch = '';
    export let bundleJson = '';
    let prUrl = '';
    let validationErrors = {};
    let submitError = '';
    let hydrated = false;
    const dispatch = createEventDispatcher();
    import {
        isValidGitHubToken,
        loadGitHubToken,
        saveGitHubToken,
        clearGitHubToken,
    } from '../../utils/githubToken.js';
    import { submitBundlePR } from '../../utils/submitBundlePR.js';

    onMount(async () => {
        try {
            token = await loadGitHubToken();
        } finally {
            hydrated = true;
        }
    });

    function validateForm() {
        const errors = {};
        if (!isValidGitHubToken(token)) {
            errors.token = 'GitHub token looks invalid';
        }
        if (!bundleJson.trim()) {
            errors.bundle = 'Bundle JSON is required';
        } else {
            try {
                const parsed = JSON.parse(bundleJson);
                if (!parsed.quests && !parsed.items && !parsed.processes) {
                    errors.bundle =
                        'Bundle must contain at least one of: quests, items, or processes';
                }
            } catch (e) {
                errors.bundle = 'Invalid JSON format';
            }
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
            prUrl = await submitBundlePR(token, branch, bundleJson);
            submitError = '';
            dispatch('success', { message: 'Pull request created', url: prUrl });
            await saveGitHubToken(token);
        } catch (err) {
            console.error(err);
            submitError = 'Failed to submit bundle';
            dispatch('error', { message: 'Failed to submit bundle' });
        }
    }

    async function clearToken() {
        token = '';
        await clearGitHubToken();
    }

    export { handleSubmit, clearToken };
</script>

<form on:submit={handleSubmit} class="pr-form" data-hydrated={hydrated ? 'true' : 'false'}>
    <div class="form-description">
        <p>
            Submit a custom content bundle containing quests, items, and/or processes. Bundles keep
            related content together and are easier to review.
        </p>
        <p>
            See the <a href="/docs/custom-bundles">Custom Content Bundles guide</a> for the JSON format.
        </p>
    </div>
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
            <span class="error-message" data-testid="token-error">{validationErrors.token}</span>
        {/if}
    </div>
    <div class="form-group">
        <label for="branch">Branch Name</label>
        <input id="branch" type="text" bind:value={branch} placeholder="bundle-my-feature" />
    </div>
    <div class="form-group">
        <label for="bundle">Bundle JSON*</label>
        <textarea
            id="bundle"
            bind:value={bundleJson}
            rows="15"
            class:error={validationErrors.bundle}
            placeholder={'{\n  "quests": [...],\n  "items": [...],\n  "processes": [...]\n}'}
            required
        />
        {#if validationErrors.bundle}
            <span class="error-message" data-testid="bundle-json-error"
                >{validationErrors.bundle}</span
            >
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
    .form-description {
        margin-bottom: 20px;
        line-height: 1.5;
    }
    .form-description a {
        color: #90ee90;
        text-decoration: underline;
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
    input {
        width: 95%;
        padding: 8px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        border: 2px solid #007006;
    }
    textarea {
        width: 95%;
        padding: 8px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        border: 2px solid #007006;
        font-family: monospace;
        font-size: 13px;
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
