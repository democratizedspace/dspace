<script>
    import OpenAIAPIKeySettings from './OpenAIAPIKeySettings.svelte';
    import { writable } from 'svelte/store';
    import { loadGameState } from '../../../utils/gameState.js';
    import OpenAIChat from './OpenAIChat.svelte';

    const apiKey = writable(loadGameState().openAI?.apiKey || '');
</script>

<div class="container">
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
