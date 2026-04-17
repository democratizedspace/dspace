<script>
    import { onMount } from 'svelte';
    import { clearGitHubToken, loadGitHubToken } from '../../utils/githubToken.js';
    import { clearCloudGistId, loadCloudGistId } from '../../utils/cloudSync.js';

    let token = '';
    let gistId = '';
    let loading = true;
    let clearing = false;
    let statusMessage = '';
    let errorMessage = '';
    let hydrated = false;

    onMount(async () => {
        token = await loadGitHubToken();
        gistId = await loadCloudGistId();
        loading = false;
        hydrated = true;
    });

    async function handleLogout() {
        clearing = true;
        statusMessage = '';
        errorMessage = '';
        try {
            await clearGitHubToken();
            await clearCloudGistId();
            try {
                localStorage.removeItem('avatarUrl');
            } catch (err) {
                console.warn('Failed to clear avatar preference', err);
            }
            token = '';
            gistId = '';
            statusMessage = 'Credentials cleared from this device.';
        } catch (err) {
            console.error(err);
            errorMessage = 'Unable to clear credentials. Please try again.';
        } finally {
            clearing = false;
        }
    }
</script>

<div class="logout-panel" data-hydrated={hydrated ? 'true' : 'false'}>
    <h3>Log out</h3>
    <p>
        Remove saved GitHub Cloud Sync credentials from this device. Use this if you're on a shared
        computer or want to disconnect your account.
    </p>
    <button type="button" on:click={handleLogout} disabled={clearing}>
        {clearing ? 'Clearing…' : 'Log out'}
    </button>
    {#if statusMessage}
        <p class="status" role="status">{statusMessage}</p>
    {/if}
    {#if errorMessage}
        <p class="error" role="alert">{errorMessage}</p>
    {/if}
    {#if !loading}
        <p class="state" data-testid="logout-state">
            {token || gistId
                ? 'Credentials stored on this device.'
                : 'No saved credentials detected.'}
        </p>
    {/if}
</div>

<style>
    .logout-panel {
        border: 1px solid #1f6b3f;
        border-radius: 12px;
        padding: 1.25rem;
        color: #f0fdf4;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: linear-gradient(135deg, #0e2a1b, #08150f);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
    }

    h3 {
        margin: 0;
        color: #dcfce7;
    }

    p {
        margin: 0;
        line-height: 1.5;
        color: #bbf7d0;
    }

    button {
        align-self: flex-start;
        background: #15803d;
        border: 1px solid #22c55e;
        border-radius: 8px;
        color: #fff;
        cursor: pointer;
        font-size: 1rem;
        padding: 10px 20px;
    }

    button[disabled] {
        opacity: 0.7;
        cursor: progress;
    }

    .status {
        color: #86efac;
    }

    .error {
        color: #fecaca;
    }

    .state {
        font-style: italic;
        color: #dcfce7;
    }
</style>
