<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { loadGameState, saveGameState, ready } from '../../../utils/gameState/common.js';

    export let apiKey = writable('');

    const isMounted = writable(false);
    const isEditing = writable(true);

    onMount(async () => {
        await ready;
        const state = loadGameState();
        const current = state.openAI?.apiKey || '';
        apiKey.set(current);
        isEditing.set(!current);
        isMounted.set(true);
    });

    async function saveAPIKey() {
        await ready;
        let gameState = loadGameState();
        gameState.openAI = gameState.openAI || {};
        gameState.openAI.apiKey = $apiKey;
        await saveGameState(gameState);
        isEditing.set(false);
    }

    async function deleteAPIKey() {
        await ready;
        let gameState = loadGameState();
        gameState.openAI = gameState.openAI || {};
        gameState.openAI.apiKey = '';
        await saveGameState(gameState);
        apiKey.set('');
        isEditing.set(true);
    }

    async function handleSubmit() {
        await saveAPIKey();
        // reload the page
        window.location.reload();
    }

    function editAPIKey() {
        isEditing.set(true);
    }
</script>

{#if $isMounted}
    <div>
        <div class={$isEditing ? 'vertical editing' : 'vertical'}>
            {#if $isEditing}
                <p>
                    Enter your <a href="https://platform.openai.com/account/api-keys"
                        >OpenAI API Key</a
                    >
                    to integrate GPT-5. Make sure you place
                    <a href="https://platform.openai.com/account/billing/limits">usage limits</a>.
                    You can monitor your usage
                    <a href="https://platform.openai.com/account/usage">here.</a>
                </p>
                <form on:submit|preventDefault={handleSubmit}>
                    <input type="text" bind:value={$apiKey} />
                    <div class="horizontal">
                        <button type="submit">Submit</button>
                        <button class="red" type="button" on:click={() => deleteAPIKey()}
                            >Clear</button
                        >
                    </div>
                </form>
            {:else}
                <button type="button" on:click={() => editAPIKey()}>Edit API Key</button>
            {/if}
        </div>

        <p>
            When you connect your API key, dChat includes a curated knowledge base covering quest
            lore, items, and highlights from your local inventory so it can answer gameplay
            questions right away.
        </p>
    </div>
{/if}

<style>
    button {
        width: 100%;
        height: 40px;
        border-radius: 5px;
        margin-top: 10px;
        margin-bottom: 10px;
        background-color: #1f2937;
        color: white;
        border: none;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    }

    button:hover {
        background-color: #374151;
    }

    .red {
        background-color: #8a2c2c;
        color: white;
    }

    input {
        height: 30px;
        border-radius: 5px;
        padding: 10px;
        font-size: 16px;
        border: none;
        margin-bottom: 10px;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
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
