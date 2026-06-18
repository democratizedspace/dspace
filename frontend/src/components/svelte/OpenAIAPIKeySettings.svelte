<script>
    import { onMount } from 'svelte';
    import { loadGameState, saveGameState, ready } from '../../utils/gameState/common.js';

    let apiKey = '';

    let hydrated = false;
    let isEditing = true;
    let draftApiKey = '';
    let statusMessage = '';

    onMount(async () => {
        await ready;
        const state = loadGameState();
        apiKey = state.openAI?.apiKey || '';
        draftApiKey = '';
        isEditing = !apiKey;
        hydrated = true;
    });

    async function saveAPIKey() {
        const trimmedApiKey = draftApiKey.trim();
        if (!trimmedApiKey) return;

        await ready;
        const gameState = loadGameState();
        gameState.openAI = gameState.openAI || {};
        gameState.openAI.apiKey = trimmedApiKey;
        await saveGameState(gameState);
        apiKey = gameState.openAI.apiKey;
        draftApiKey = '';
        isEditing = !apiKey;
        statusMessage = apiKey ? 'OpenAI API key saved.' : 'OpenAI API key cleared.';
    }

    async function deleteAPIKey() {
        await ready;
        const gameState = loadGameState();
        gameState.openAI = gameState.openAI || {};
        gameState.openAI.apiKey = '';
        await saveGameState(gameState);
        apiKey = '';
        draftApiKey = '';
        isEditing = true;
        statusMessage = 'OpenAI API key cleared.';
    }

    function editAPIKey() {
        draftApiKey = '';
        isEditing = true;
        statusMessage = '';
    }
</script>

{#if hydrated}
    <div class="openai-key-settings" data-testid="openai-api-key-settings">
        <p>
            Enter your <a href="https://platform.openai.com/account/api-keys">OpenAI API Key</a>
            to integrate GPT-5. Make sure you place
            <a href="https://platform.openai.com/account/billing/limits">usage limits</a>. You can
            monitor your usage <a href="https://platform.openai.com/account/usage">here.</a>
        </p>

        {#if apiKey && !isEditing}
            <p class="configured" data-testid="openai-key-status">OpenAI API key configured.</p>
            <div class="actions">
                <button type="button" on:click={editAPIKey}>Edit API key</button>
                <button class="danger" type="button" on:click={deleteAPIKey}>Clear API key</button>
            </div>
        {:else}
            <form on:submit|preventDefault={saveAPIKey}>
                <label for="openai-api-key">OpenAI API key</label>
                <input
                    id="openai-api-key"
                    type="password"
                    bind:value={draftApiKey}
                    autocomplete="off"
                />
                <div class="actions">
                    <button type="submit">Save OpenAI API key</button>
                    <button class="danger" type="button" on:click={deleteAPIKey}
                        >Clear API key</button
                    >
                </div>
            </form>
        {/if}

        {#if statusMessage}
            <p class="status" role="status">{statusMessage}</p>
        {/if}

        <p>
            When you connect your API key, the chat can tap a curated knowledge base covering quest
            lore, items, and highlights from your local inventory so NPCs can answer gameplay
            questions and show their unique personalities right away.
        </p>
    </div>
{/if}

<style>
    .openai-key-settings {
        display: grid;
        gap: 0.75rem;
    }

    p {
        margin: 0;
        color: #cbd5e1;
        line-height: 1.5;
    }

    a {
        color: #93c5fd;
    }

    form {
        display: grid;
        gap: 0.5rem;
    }

    label {
        color: #e2e8f0;
        font-weight: 600;
    }

    input {
        border: 1px solid #475569;
        border-radius: 8px;
        padding: 0.65rem 0.75rem;
        background: #0f172a;
        color: #f8fafc;
        font-size: 1rem;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    button {
        background: #2563eb;
        border: 1px solid #60a5fa;
        border-radius: 8px;
        color: #fff;
        cursor: pointer;
        font-size: 1rem;
        padding: 0.65rem 1rem;
    }

    .danger {
        background: #7f1d1d;
        border-color: #ef4444;
    }

    .configured,
    .status {
        color: #86efac;
        font-weight: 600;
    }
</style>
