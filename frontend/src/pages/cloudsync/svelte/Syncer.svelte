<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import {
        loadCloudGistId,
        uploadGameStateToGist,
        downloadGameStateFromGist,
        clearCloudGistId,
    } from '../../../utils/cloudSync.js';
    import { onMount } from 'svelte';
    import {
        isValidGitHubToken,
        loadGitHubToken,
        saveGitHubToken,
        clearGitHubToken,
    } from '../../../utils/githubToken.js';

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
        <div class="helper" aria-live="polite">
            <h2>Set up cloud sync</h2>
            <ul>
                <li>
                    Create a GitHub personal access token with the <code>gist</code> scope at
                    <a href="https://github.com/settings/tokens">github.com/settings/tokens</a>.
                    It is only saved in your browser.
                </li>
                <li>
                    You can use any secret gist for backups. Create one at
                    <a href="https://gist.github.com/">gist.github.com</a> and copy the ID
                    from the URL (the part after <code>gist.github.com/</code>).
                    Leave the Gist ID blank and “Upload” will create a new private gist for you.
                </li>
            </ul>
        </div>
        <div class="form-group">
            <label for="token">GitHub Token*</label>
            <div class="token-input">
                <input id="token" type="password" bind:value={token} />
                <Chip text="Save" onClick={saveToken} />
                <Chip text="Clear" onClick={clearTokenLocal} data-testid="clear-sync-token" />
            </div>
        </div>
        <div class="form-group">
            <label for="gist">Gist ID</label>
            <div class="token-input">
                <input id="gist" type="text" bind:value={gistId} />
                <Chip text="Clear" onClick={clearGistId} data-testid="clear-gist-id" />
            </div>
        </div>
        <div class="buttons">
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

    .helper {
        background: linear-gradient(135deg, #0f3b17, #0b2b12);
        border-radius: 10px;
        padding: 1rem;
        color: #e9f7ec;
        text-align: left;
    }

    .helper h2 {
        margin: 0 0 0.35rem;
        font-size: 1.1rem;
    }

    .helper ul {
        margin: 0;
        padding-left: 1.2rem;
        display: grid;
        gap: 0.35rem;
    }

    .token-input {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
    }

    .form-group label {
        font-weight: bold;
    }

    .buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .message {
        color: #90ee90;
    }

    .message.error {
        color: #ff9f9f;
    }

    input {
        flex: 1;
        min-width: 200px;
        padding: 5px;
        border-radius: 6px;
    }

    .chip-container {
        text-align: center;
        display: inline-flex;
        flex-wrap: wrap;
        justify-content: center;
        opacity: 0.8;
        background-color: #007006;
        border-radius: 0.4rem;
        color: white;
        margin: 1px;
        padding: 5px;
    }

    .chip-container:hover {
        opacity: 1;
    }
</style>
