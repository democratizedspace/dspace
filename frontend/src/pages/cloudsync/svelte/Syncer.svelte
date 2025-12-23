<script>
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
    import Chip from '../../../components/svelte/Chip.svelte';

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
        <div class="form-group">
            <label for="token">GitHub Token*</label>
            <div class="token-input">
                <input
                    id="token"
                    type="password"
                    bind:value={token}
                    autocapitalize="none"
                    spellcheck={false}
                    autocomplete="new-password"
                />
                <div class="chip-row">
                    <Chip text="Save" onClick={saveToken} inverted={true} />
                    <Chip
                        text="Clear"
                        onClick={clearTokenLocal}
                        hazard={true}
                        dataTestId="clear-sync-token"
                    />
                </div>
            </div>
        </div>
        <div class="form-group">
            <label for="gist">Gist ID</label>
            <div class="token-input">
                <input
                    id="gist"
                    class="gist-input"
                    type="text"
                    bind:value={gistId}
                    autocapitalize="none"
                    spellcheck={false}
                    autocomplete="off"
                    placeholder="e.g. 0123456789abcdef..."
                />
                <Chip text="Clear" onClick={clearGistId} hazard={true} dataTestId="clear-gist-id" />
            </div>
        </div>
        <div class="buttons">
            <Chip text="Upload" onClick={handleUpload} inverted={true} />
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
        gap: 10px;
        width: 100%;
    }
    .token-input {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
    }
    .form-group label {
        font-weight: bold;
    }
    .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-start;
        align-items: center;
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

    .gist-input {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
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
        padding: 5px;
    }

    .chip-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    @media (max-width: 640px) {
        .token-input {
            flex-direction: column;
            align-items: stretch;
        }

        .chip-row {
            justify-content: flex-start;
        }
    }
</style>
