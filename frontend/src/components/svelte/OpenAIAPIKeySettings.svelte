<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { loadGameState, saveGameState, ready } from '../../utils/gameState/common.js';

    export let apiKey = writable('');

    let hydrated = false;
    let isEditing = true;
    let statusMessage = '';
    let saving = false;

    onMount(async () => {
        await ready;
        const state = loadGameState();
        const current = state.openAI?.apiKey || '';
        apiKey.set(current);
        isEditing = !current;
        hydrated = true;
    });

    async function persistAPIKey(nextKey) {
        await ready;
        const gameState = loadGameState();
        gameState.openAI = gameState.openAI || {};
        gameState.openAI.apiKey = nextKey;
        await saveGameState(gameState);
    }

    async function saveAPIKey() {
        saving = true;
        statusMessage = '';
        await persistAPIKey($apiKey);
        isEditing = false;
        statusMessage = $apiKey ? 'OpenAI API key saved.' : 'OpenAI API key cleared.';
        saving = false;
    }

    async function deleteAPIKey() {
        saving = true;
        statusMessage = '';
        await persistAPIKey('');
        apiKey.set('');
        isEditing = true;
        statusMessage = 'OpenAI API key cleared.';
        saving = false;
    }

    function editAPIKey() {
        isEditing = true;
        statusMessage = '';
    }
</script>

{#if hydrated}
    <div class="openai-key-settings" data-testid="openai-api-key-settings">
        <div class={isEditing ? 'vertical editing' : 'vertical'}>
            {#if isEditing}
                <p>
                    Enter your <a href="https://platform.openai.com/account/api-keys"
                        >OpenAI API Key</a
                    >
                    to integrate GPT-5. Make sure you place
                    <a href="https://platform.openai.com/account/billing/limits">usage limits</a>.
                    You can monitor your usage
                    <a href="https://platform.openai.com/account/usage">here.</a>
                </p>
                <form on:submit|preventDefault={saveAPIKey}>
                    <label for="openai-api-key">OpenAI API key</label>
                    <input
                        id="openai-api-key"
                        type="password"
                        autocomplete="off"
                        bind:value={$apiKey}
                    />
                    <div class="horizontal">
                        <button type="submit" disabled={saving}>Save OpenAI key</button>
                        <button class="red" type="button" disabled={saving} on:click={deleteAPIKey}
                            >Clear OpenAI key</button
                        >
                    </div>
                </form>
            {:else}
                <p class="configured" data-testid="openai-key-configured">
                    OpenAI API key configured on this device.
                </p>
                <div class="horizontal">
                    <button type="button" on:click={editAPIKey}>Edit OpenAI key</button>
                    <button class="red" type="button" disabled={saving} on:click={deleteAPIKey}
                        >Clear OpenAI key</button
                    >
                </div>
            {/if}
        </div>

        <p>
            When you connect your API key, the chat can tap a curated knowledge base covering quest
            lore, items, and highlights from your local inventory so NPCs can answer gameplay
            questions and show their unique personalities right away.
        </p>
        {#if statusMessage}
            <p class="status" role="status">{statusMessage}</p>
        {/if}
    </div>
{/if}

<style>
    .openai-key-settings {
        display: grid;
        gap: 0.75rem;
    }

    .vertical,
    form {
        display: grid;
        gap: 0.6rem;
    }

    .horizontal {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    a {
        color: #93c5fd;
    }

    button {
        border-radius: 8px;
        padding: 0.65rem 1rem;
        background-color: #1f2937;
        color: white;
        border: 1px solid #475569;
        font-size: 1rem;
        cursor: pointer;
    }

    button:hover:not([disabled]) {
        background-color: #374151;
    }

    button[disabled] {
        opacity: 0.7;
        cursor: progress;
    }

    .red {
        background-color: #8a2c2c;
        color: white;
    }

    label {
        font-weight: 600;
    }

    input {
        min-height: 2.5rem;
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        font-size: 1rem;
        border: 1px solid #64748b;
        background: #0f172a;
        color: #e2e8f0;
    }

    p {
        margin: 0;
        color: #cbd5e1;
        line-height: 1.5;
    }

    .configured,
    .status {
        color: #bbf7d0;
        font-weight: 600;
    }

    .editing {
        opacity: 0;
        animation: fadeIn 0.5s forwards;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
</style>
