<script>
    import {
        loadCloudGistId,
        uploadGameStateToGist,
        downloadGameStateFromGist,
        clearCloudGistId,
    } from '../../../utils/cloudSync.js';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { onMount } from 'svelte';
    import {
        isValidGitHubToken,
        loadGitHubToken,
        saveGitHubToken,
        clearGitHubToken,
    } from '../../../utils/githubToken.js';

    const githubTokenDocsUrl =
        'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/' +
        'creating-a-personal-access-token';
    const githubTokenSettingsUrl = 'https://github.com/settings/tokens?type=beta';
    const gistUrl = 'https://gist.github.com/';

    let root;
    let token = '';
    let gistId = '';
    let message = '';
    let messageType = '';

    const announce = (text, type = '') => {
        message = text;
        messageType = type;
    };

    onMount(async () => {
        token = await loadGitHubToken();
        gistId = await loadCloudGistId();
        root?.setAttribute('data-hydrated', 'true');
        if (typeof window !== 'undefined') {
            window.__cloudSyncReady = true;
        }
    });

    const saveToken = async () => {
        await saveGitHubToken(token);
    };

    const clearTokenLocal = async () => {
        token = '';
        await clearGitHubToken();
    };

    const handleUpload = async () => {
        try {
            if (!isValidGitHubToken(token)) {
                announce('GitHub token looks invalid', 'error');
                return;
            }
            const id = await uploadGameStateToGist(token);
            gistId = id;
            announce('Upload successful', 'success');
        } catch (err) {
            console.error(err);
            announce('Upload failed', 'error');
        }
    };

    const clearGistId = async () => {
        gistId = '';
        await clearCloudGistId();
    };

    const handleDownload = async () => {
        try {
            if (!gistId) {
                announce('Gist ID required', 'error');
                return;
            }
            await downloadGameStateFromGist(token, gistId);
            announce('Download successful', 'success');
        } catch (err) {
            console.error(err);
            announce('Download failed', 'error');
        }
    };
</script>

<div class="chip-container" bind:this={root} data-testid="cloud-sync-form">
    <div class="vertical">
        <div class="intro">
            <h2>Set up Cloud Sync</h2>
            <p>
                Use a GitHub personal access token with the
                <a
                    href={githubTokenDocsUrl}
                    >gist</a
                >
                scope. Generate one at
                <a href={githubTokenSettingsUrl}>github.com/settings/tokens</a>
                and save it here so uploads and downloads can talk to GitHub directly.
            </p>
            <p>
                Create a secret gist at
                <a href={gistUrl}>gist.github.com</a> and copy the ID at the end of the URL.
                It looks like <code>https://gist.github.com/&lt;user&gt;/gist-id</code>.
                After your first upload we'll remember the ID for you.
            </p>
        </div>

        <div class="form-group">
            <label for="token">GitHub Token*</label>
            <div class="token-input">
                <input id="token" type="password" bind:value={token} />
                <div class="chips">
                    <Chip text="Save token" onClick={saveToken} />
                    <Chip text="Clear" onClick={clearTokenLocal} data-testid="clear-sync-token" />
                </div>
            </div>
        </div>
        <div class="form-group">
            <label for="gist">Gist ID</label>
            <div class="token-input">
                <input id="gist" type="text" bind:value={gistId} />
                <div class="chips">
                    <Chip text="Clear" onClick={clearGistId} data-testid="clear-gist-id" />
                </div>
            </div>
        </div>
        <div class="chips">
            <Chip text="Upload" onClick={handleUpload} />
            <Chip text="Download" onClick={handleDownload} />
        </div>
        {#if message}
            <p
                class={`message ${messageType}`}
                role={messageType === 'error' ? 'alert' : 'status'}
                data-testid={messageType === 'error'
                    ? 'sync-error'
                    : messageType === 'success'
                      ? 'sync-success'
                      : undefined}
            >
                {message}
            </p>
        {/if}
    </div>
</div>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
        width: 100%;
    }

    .intro {
        background: linear-gradient(135deg, #0d2d0f, #0a1c0b);
        border-radius: 12px;
        padding: 1rem;
        display: grid;
        gap: 0.5rem;
        color: #e8f5e9;
        border: 1px solid rgba(104, 212, 109, 0.35);
    }

    .intro h2 {
        margin: 0;
        font-size: 1.2rem;
    }

    .intro a {
        color: #b4f5b8;
    }

    .token-input {
        display: grid;
        gap: 0.5rem;
    }

    @media (min-width: 640px) {
        .token-input {
            grid-template-columns: 1fr auto;
            align-items: center;
        }
    }

    .form-group label {
        font-weight: bold;
    }

    .message {
        color: #90ee90;
    }

    .message.error {
        color: #ff9f9f;
    }
    input {
        flex: 1;
        padding: 8px;
        border-radius: 6px;
        border: none;
    }

    .chip-container {
        text-align: center;
        display: inline-flex;
        flex-wrap: wrap;
        justify-content: center;
        background-color: #007006;
        border-radius: 0.4rem;
        color: white;
        margin: 1px;
        padding: 12px;
        gap: 0.5rem;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: flex-start;
    }
</style>
