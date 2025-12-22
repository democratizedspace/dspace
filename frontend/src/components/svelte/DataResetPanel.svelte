<script>
    import { onMount } from 'svelte';
    import Chip from './Chip.svelte';
    import { clearBrowserData } from '../../utils/clearBrowserData.js';

    let clearing = false;
    let statusMessage = '';
    let errorMessage = '';
    let hydrated = false;

    onMount(() => {
        hydrated = true;
    });

    async function handleWipe() {
        if (clearing) return;
        clearing = true;
        statusMessage = '';
        errorMessage = '';
        try {
            await clearBrowserData();
            statusMessage = 'All local app data has been removed.';
        } catch (error) {
            console.error('Failed to clear app data', error);
            errorMessage = 'Unable to clear app data. Please try again.';
        } finally {
            clearing = false;
        }
    }
</script>

<div class="data-reset" data-hydrated={hydrated ? 'true' : 'false'}>
    <h3>Danger zone</h3>
    <p>
        Wipe all locally stored DSPACE data from this browser, including saved sessions, quest
        progress, and synced content. This will clear localStorage, IndexedDB, session data, and
        cookies for this app.
    </p>
    <Chip
        text={clearing ? 'Clearing…' : 'Wipe all app data'}
        hazard={true}
        disabled={clearing}
        onClick={handleWipe}
        data-testid="wipe-data-button"
    />
    {#if statusMessage}
        <p class="status" role="status">{statusMessage}</p>
    {/if}
    {#if errorMessage}
        <p class="error" role="alert">{errorMessage}</p>
    {/if}
</div>

<style>
    .data-reset {
        background: #2c5837;
        border: 2px solid #5f1111;
        border-radius: 12px;
        padding: 16px;
        max-width: 480px;
        color: #fff;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    h3 {
        margin: 0;
    }

    p {
        margin: 0;
        line-height: 1.5;
    }

    .status {
        color: #90ee90;
    }

    .error {
        color: #ff9f9f;
    }
</style>
