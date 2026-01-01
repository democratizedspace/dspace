<script>
    import OpenAIAPIKeySettings from './OpenAIAPIKeySettings.svelte';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { loadGameState, ready } from '../../../utils/gameState/common.js';
    import { isTokenPlaceEnabled } from '../../../utils/tokenPlace.js';
    import OpenAIChat from './OpenAIChat.svelte';
    import TokenPlaceChat from './TokenPlaceChat.svelte';

    const apiKey = writable('');
    const tokenPlaceEnabled = writable(false);
    onMount(async () => {
        await ready;
        apiKey.set(loadGameState().openAI?.apiKey || '');
        tokenPlaceEnabled.set(isTokenPlaceEnabled());
    });
</script>

<div class="container">
    {#if $tokenPlaceEnabled}
        <TokenPlaceChat />
    {:else}
        <div class="tokenplace-disabled" data-testid="tokenplace-disabled">
            token.place chat is temporarily disabled. OpenAI chat remains available below.
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

    .api-container {
        min-height: 70px;
        transition: opacity 0.5s;
    }

    .tokenplace-disabled {
        width: 100%;
        background: #fef08a;
        color: #1f2937;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #f59e0b;
        margin-bottom: 12px;
        text-align: center;
        font-weight: 600;
    }
</style>
