<script>
    import ChatPanel from './ChatPanel.svelte';
</script>

<div class="container">
    <ChatPanel />
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
