<script>
    import OpenAIAPIKeySettings from './OpenAIAPIKeySettings.svelte';
    import { onMount } from 'svelte';
    import { derived, writable } from 'svelte/store';
    import { loadGameState, ready, state as gameState } from '../../../utils/gameState/common.js';
    import OpenAIChat from './OpenAIChat.svelte';
    import TokenPlaceChat from './TokenPlaceChat.svelte';
    import { isTokenPlaceEnabled } from '../../../utils/tokenPlace.js';

    const apiKey = writable('');
    const tokenPlaceEnabled = derived(gameState, ($gameState) =>
        isTokenPlaceEnabled({ state: $gameState })
    );

    onMount(async () => {
        await ready;
        const state = loadGameState();
        apiKey.set(state.openAI?.apiKey || '');
    });
</script>

<div class="container">
    {#if !$tokenPlaceEnabled}
        <div class="notice" data-testid="token-place-disabled-banner">
            Bring your own OpenAI API key to chat today. In v3.1, chat will run on
            <a href="https://token.place">token.place</a> with no key required.
        </div>
    {/if}
    <div class="api-container">
        <OpenAIAPIKeySettings {apiKey} />
    </div>
    <OpenAIChat />
    {#if $tokenPlaceEnabled}
        <TokenPlaceChat />
    {/if}
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #68d46d;
        color: black;
        border-radius: 10px;
        padding: 20px;
        gap: 1rem;
    }

    .notice {
        background: rgba(0, 0, 0, 0.08);
        border-radius: 8px;
        padding: 10px 14px;
        width: 100%;
        text-align: center;
        font-weight: 600;
        border: 1px dashed rgba(0, 0, 0, 0.2);
    }

    .api-container {
        min-height: 70px;
        transition: opacity 0.5s;
    }
</style>
