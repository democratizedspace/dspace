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
    {#if $tokenPlaceEnabled}
        <TokenPlaceChat />
    {/if}
    <div class="api-container">
        <OpenAIAPIKeySettings {apiKey} />
    </div>
    <OpenAIChat />
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
    }

    .api-container {
        min-height: 70px;
        transition: opacity 0.5s;
    }
</style>
