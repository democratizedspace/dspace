<script>
    import ChatPanel from './ChatPanel.svelte';

    export let tokenPlace = null;
    export let openAIChatProxy = null;
    export let defaultChatProvider = 'token-place';
</script>

<div class="container">
    <ChatPanel {tokenPlace} {openAIChatProxy} {defaultChatProvider} />
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
</style>
