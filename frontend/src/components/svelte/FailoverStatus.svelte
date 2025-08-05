<script>
    import { onMount, onDestroy } from 'svelte';
    export let onlineText = 'Online';
    export let offlineText = 'Offline - changes will sync when connection restores';

    let online = true;
    let isClientSide = false;

    function updateStatus() {
        if (typeof navigator !== 'undefined') {
            online = navigator.onLine;
        }
    }

    onMount(() => {
        isClientSide = true;
        if (typeof window !== 'undefined') {
            updateStatus();
            window.addEventListener('online', updateStatus);
            window.addEventListener('offline', updateStatus);
        }
    });
    onDestroy(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
        }
    });
</script>

<div
    data-testid="connection-status"
    class="connection-status"
    data-hydrated={isClientSide ? 'true' : 'false'}
>
    {#if online}
        {onlineText}
    {:else}
        {offlineText}
    {/if}
</div>

<style>
    .connection-status {
        margin-top: 1rem;
        font-size: 0.9rem;
    }
</style>
