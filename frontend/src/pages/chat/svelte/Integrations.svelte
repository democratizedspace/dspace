<script>
    import ChatPanel from './ChatPanel.svelte';

    export let tokenPlace = null;
</script>

<div class="container">
    <ChatPanel {tokenPlace} />
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
