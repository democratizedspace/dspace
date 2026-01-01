<script>
    import OpenAIAPIKeySettings from './OpenAIAPIKeySettings.svelte';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { loadGameState, ready } from '../../../utils/gameState/common.js';
    import OpenAIChat from './OpenAIChat.svelte';
    import TokenPlaceChat from './TokenPlaceChat.svelte';
    import { getTokenPlaceUrl } from '../../../utils/tokenPlace.js';

    const apiKey = writable('');
    const tokenPlaceEnabled = writable(false);
    onMount(async () => {
        await ready;
        const gameState = loadGameState();
        apiKey.set(gameState.openAI?.apiKey || '');
        tokenPlaceEnabled.set(Boolean(getTokenPlaceUrl(gameState)));
    });
</script>

<div class="container">
    {#if $tokenPlaceEnabled}
        <TokenPlaceChat />
    {:else}
        <div class="info-banner" role="status">
            token.place chat is temporarily unavailable. Use the OpenAI chat below.
        </div>
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

    .info-banner {
        width: 100%;
        border-radius: 8px;
        padding: 12px 14px;
        background: #f2f2f2;
        color: #111827;
        border: 1px dashed #9ca3af;
        text-align: center;
        font-size: 0.95rem;
    }

    .api-container {
        min-height: 70px;
        transition: opacity 0.5s;
    }
</style>
