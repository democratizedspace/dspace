<script>
    import { messages } from '../../stores/chat.js';
    $: tokenTotal = $messages.reduce((n, m) => n + (m.tokens || 0), 0);
</script>

<h2>
    dChat
    <span class="badge">{tokenTotal} tokens</span>
</h2>

<style>
    .badge {
        margin-left: 0.5rem;
        padding: 0 0.4rem;
        background: var(--grey-800);
        color: white;
        border-radius: 0.25rem;
        font-size: 0.8rem;
    }
</style>
