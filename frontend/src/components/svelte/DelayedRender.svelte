<script>
    import { onMount } from 'svelte';

    export let delaySeconds = 5;
    let mounted = false;

    onMount(() => {
        setTimeout(() => {
            mounted = true;
        }, delaySeconds * 1000);
    });
</script>

<div>
    {#if mounted}
        <slot name="content" />
    {:else}
        <slot name="fallback" />
    {/if}
</div>

<style>
</style>