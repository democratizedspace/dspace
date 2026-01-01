<script>
    import OpenAIAPIKeySettings from './OpenAIAPIKeySettings.svelte';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { loadGameState, ready } from '../../../utils/gameState/common.js';
    import OpenAIChat from './OpenAIChat.svelte';
    import TokenPlaceChat from './TokenPlaceChat.svelte';

    const apiKey = writable('');
    const tokenPlaceEnabled = writable(false);

    const parseBooleanFlag = (value) => {
        if (typeof value !== 'string') return false;
        const normalized = value.trim().toLowerCase();
        return ['1', 'true', 'yes', 'on', 'enabled'].includes(normalized);
    };

    const isTokenPlaceEnabled = (gameState) => {
        const envFlag =
            parseBooleanFlag(import.meta.env?.PUBLIC_ENABLE_TOKEN_PLACE) ||
            parseBooleanFlag(import.meta.env?.VITE_ENABLE_TOKEN_PLACE);
        const userConfiguredUrl = Boolean(gameState?.tokenPlace?.url);
        return envFlag || userConfiguredUrl;
    };

    onMount(async () => {
        await ready;
        const gameState = loadGameState();
        apiKey.set(gameState.openAI?.apiKey || '');
        tokenPlaceEnabled.set(isTokenPlaceEnabled(gameState));
    });
</script>

<div class="container">
    {#if $tokenPlaceEnabled}
        <TokenPlaceChat />
    {:else}
        <p class="tokenplace-disabled">
            token.place chat is disabled for now; conversations will use OpenAI when you enter an
            API key below.
        </p>
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

    .tokenplace-disabled {
        margin: 0 0 1rem;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.75);
        text-align: center;
    }
</style>
