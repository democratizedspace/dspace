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

    onMount(async () => {
        token = await loadGitHubToken();
        gistId = await loadCloudGistId();
        loading = false;
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

<div class="logout-panel">
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
        background: #2c5837;
        border: 2px solid #007006;
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

    button {
        align-self: flex-start;
        background: #007006;
        border: none;
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
        color: #90ee90;
    }

    .error {
        color: #ff9f9f;
    }

    .state {
        font-style: italic;
        color: #d1f7d1;
    }
</style>
