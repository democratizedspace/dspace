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
        <div class="instructions">
            <p>
                Cloud Sync keeps your saves in a private GitHub Gist. Bring a personal access token
                with the <code>gist</code> scope and a Gist to store your data.
            </p>
            <ol>
                <li>
                    Create a token with
                    <a href="https://github.com/settings/tokens">classic</a>
                    or
                    <a href="https://github.com/settings/personal-access-tokens/new">fine-grained</a>
                    permissions. Only the <code>gist</code> scope is required, and it stays in
                    your browser.
                </li>
                <li>
                    Make a new secret Gist at
                    <a href="https://gist.github.com/">gist.github.com</a>
                    (a blank file is fine). Copy the ID from the URL after saving — it is the
                    string after <code>gist.github.com/&lt;your-user&gt;/</code>.
                </li>
            </ol>
        </div>
        <div class="form-group">
            <label for="token">GitHub Token*</label>
            <div class="token-input">
                <input id="token" type="password" bind:value={token} />
                <div class="chip-row">
                    <Chip text="Save" onClick={saveToken} />
                    <Chip
                        text="Clear"
                        onClick={clearTokenLocal}
                        inverted={true}
                        dataTestId="clear-sync-token"
                    />
                </div>
            </div>
        </div>
        <div class="form-group">
            <label for="gist">Gist ID</label>
            <div class="token-input">
                <input id="gist" type="text" bind:value={gistId} />
                <div class="chip-row">
                    <Chip
                        text="Clear"
                        onClick={clearGistId}
                        inverted={true}
                        dataTestId="clear-gist-id"
                    />
                </div>
            </div>
        </div>
        <div class="buttons">
            <Chip text="Upload" onClick={handleUpload} />
            <Chip text="Download" onClick={handleDownload} inverted={true} />
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
        gap: 10px;
        width: 100%;
    }
    .token-input {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
    }
    .form-group label {
        font-weight: bold;
    }
    .instructions {
        text-align: left;
        background: linear-gradient(135deg, #0f3a12, #0a250c);
        border: 1px solid #68d46d;
        border-radius: 8px;
        padding: 12px;
        display: grid;
        gap: 8px;
    }
    .instructions p {
        margin: 0;
    }
    .instructions ol {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: 6px;
    }
    .chip-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
    }
    .buttons {
        display: flex;
        gap: 10px;
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
