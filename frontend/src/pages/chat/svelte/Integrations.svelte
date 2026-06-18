<script>
    import { derived } from 'svelte/store';
    import { state as gameState } from '../../../utils/gameState/common.js';
    import { normalizeSettings } from '../../../utils/settingsDefaults.js';
    import OpenAIChat from './OpenAIChat.svelte';
    import TokenPlaceChat from './TokenPlaceChat.svelte';
    import { isTokenPlaceEnabled } from '../../../utils/tokenPlace.js';

    const tokenPlaceEnabled = derived(gameState, ($gameState) =>
        isTokenPlaceEnabled({ state: $gameState })
    );
    const chatProvider = derived(
        gameState,
        ($gameState) => normalizeSettings($gameState?.settings).chatProvider
    );
    const showTokenPlaceChat = derived(
        [tokenPlaceEnabled, chatProvider],
        ([$tokenPlaceEnabled, $chatProvider]) =>
            $tokenPlaceEnabled && $chatProvider === 'token-place'
    );
</script>

<div class="container">
    {#if !$tokenPlaceEnabled}
        <div class="notice" data-testid="token-place-disabled-banner">
            Chat works now with your OpenAI API key. Soon (in v3.1), chat will be powered by
            <a href="https://token.place" target="_blank" rel="noopener">token.place</a> — no key needed.
        </div>
    {/if}
    {#if $showTokenPlaceChat}
        <TokenPlaceChat />
    {:else}
        <OpenAIChat />
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
</style>
