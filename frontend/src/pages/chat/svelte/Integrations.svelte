<script>
    import OpenAIAPIKeySettings from './OpenAIAPIKeySettings.svelte';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { loadGameState, ready } from '../../../utils/gameState/common.js';
    import OpenAIChat from './OpenAIChat.svelte';
    import TokenPlaceChat from './TokenPlaceChat.svelte';
    import { isTokenPlaceEnabled } from '../../../utils/tokenPlace.js';

    const apiKey = writable('');
    const tokenPlaceEnabled = writable(false);

    onMount(async () => {
        await ready;
        const state = loadGameState();
        apiKey.set(state.openAI?.apiKey || '');
        tokenPlaceEnabled.set(isTokenPlaceEnabled({ state }));
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
