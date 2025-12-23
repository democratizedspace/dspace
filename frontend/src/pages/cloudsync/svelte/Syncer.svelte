<script>
    import { onDestroy, onMount } from 'svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import {
        clearCloudGistId,
        downloadGameStateFromGist,
        fetchBackupList,
        loadCloudGistId,
        uploadGameStateToGist,
    } from '../../../utils/cloudSync.js';
    import {
        clearGitHubToken,
        isValidGitHubToken,
        loadGitHubToken,
        saveGitHubToken,
    } from '../../../utils/githubToken.js';
    import { validateToken } from '../../../lib/cloudsync/githubGists';

    let root;
    let token = '';
    let gistId = '';
    let message = '';
    let messageType = '';
    let toastMessage = '';
    let toastType = '';
    let toastTimer;
    let savingToken = false;
    let uploading = false;
    let downloading = false;
    let refreshing = false;
    let backups = [];
    let backupError = '';

    const announce = (text, type = '') => {
        message = text;
        messageType = type;
        if (!type) return;
        toastMessage = text;
        toastType = type;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastMessage = '';
            toastType = '';
        }, 3200);
    };

    const loadBackups = async (providedToken = token) => {
        const trimmedToken = providedToken?.trim?.();
        if (!trimmedToken) return;
        refreshing = true;
        backupError = '';
        try {
            backups = await fetchBackupList(trimmedToken);
        } catch (err) {
            console.error(err);
            backupError = 'Unable to load backups right now.';
        } finally {
            refreshing = false;
        }
    };

    onMount(async () => {
        token = await loadGitHubToken();
        gistId = await loadCloudGistId();
        root?.setAttribute('data-hydrated', 'true');
        if (token) {
            await loadBackups(token);
        }
        if (typeof window !== 'undefined') {
            window.__cloudSyncReady = true;
        }
    });

    const saveToken = async () => {
        const trimmedToken = token.trim();
        if (!isValidGitHubToken(trimmedToken)) {
            announce('GitHub token looks invalid', 'error');
            return;
        }
        savingToken = true;
        try {
            await validateToken(trimmedToken);
            await saveGitHubToken(trimmedToken);
            announce('Token saved and validated', 'success');
            await loadBackups(trimmedToken);
        } catch (err) {
            console.error(err);
            await clearGitHubToken();
            token = '';
            announce('Token validation failed', 'error');
        } finally {
            savingToken = false;
        }
    };

    const clearTokenLocal = async () => {
        token = '';
        backups = [];
        await clearGitHubToken();
    };

    const handleUpload = async () => {
        const trimmedToken = token.trim();
        if (!isValidGitHubToken(trimmedToken)) {
            announce('GitHub token looks invalid', 'error');
            return;
        }
        uploading = true;
        try {
            const result = await uploadGameStateToGist(trimmedToken);
            gistId = '';
            await clearCloudGistId();
            announce('Upload successful', 'success');
            if (result?.id) {
                backups = [result, ...backups];
            }
        } catch (err) {
            console.error(err);
            announce('Upload failed', 'error');
        } finally {
            uploading = false;
        }
    };

    const clearGistId = async () => {
        gistId = '';
        await clearCloudGistId();
    };

    const handleDownload = async () => {
        if (!gistId) {
            announce('Gist ID required', 'error');
            return;
        }
        downloading = true;
        try {
            await downloadGameStateFromGist(token, gistId);
            announce('Download successful', 'success');
        } catch (err) {
            console.error(err);
            announce('Download failed', 'error');
        } finally {
            downloading = false;
        }
    };

    const copyGistId = async (id) => {
        if (!navigator?.clipboard) {
            announce('Clipboard unavailable', 'error');
            return;
        }
        try {
            await navigator.clipboard.writeText(id);
            announce('Gist ID copied', 'success');
        } catch (err) {
            console.error(err);
            announce('Failed to copy Gist ID', 'error');
        }
    };

    const friendlyDate = (value) => {
        if (!value) return '';
        return new Date(value).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    onDestroy(() => {
        clearTimeout(toastTimer);
    });
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
                    <Chip
                        text={savingToken ? 'Saving…' : 'Save'}
                        onClick={saveToken}
                        inverted={true}
                        disabled={savingToken}
                        dataTestId="save-token"
                    >
                        {#if savingToken}
                            <span class="spinner" aria-hidden="true"></span>
                        {/if}
                    </Chip>
                    <Chip
                        text="Clear"
                        onClick={clearTokenLocal}
                        hazard={true}
                        dataTestId="clear-sync-token"
                        disabled={savingToken || uploading || downloading}
                    />
                </div>
            </div>
            <p class="hint">Token is stored locally after validation.</p>
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
                <Chip
                    text="Clear"
                    onClick={clearGistId}
                    hazard={true}
                    dataTestId="clear-gist-id"
                    disabled={uploading || downloading}
                />
            </div>
        </div>
        <div class="buttons">
            <Chip
                text={uploading ? 'Uploading…' : 'Upload'}
                onClick={handleUpload}
                inverted={true}
                disabled={uploading || savingToken}
            >
                {#if uploading}
                    <span class="spinner" aria-hidden="true"></span>
                {/if}
            </Chip>
            <Chip
                text={downloading ? 'Downloading…' : 'Download'}
                onClick={handleDownload}
                disabled={downloading || savingToken}
            >
                {#if downloading}
                    <span class="spinner" aria-hidden="true"></span>
                {/if}
            </Chip>
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
        <section class="backups">
            <div class="backups-header">
                <h3>Backups</h3>
                <Chip
                    text={refreshing ? 'Refreshing…' : 'Refresh'}
                    onClick={() => loadBackups()}
                    inverted={true}
                    disabled={refreshing || !token}
                    dataTestId="refresh-backups"
                >
                    {#if refreshing}
                        <span class="spinner" aria-hidden="true"></span>
                    {/if}
                </Chip>
            </div>
            {#if !token}
                <p class="hint">Connect a token to load backups.</p>
            {:else if backupError}
                <p class="message error" role="alert">{backupError}</p>
            {:else if refreshing}
                <p class="hint">Loading backups…</p>
            {:else if backups.length === 0}
                <p class="hint">No backups found yet.</p>
            {:else}
                <ul class="backup-list" data-testid="backup-list">
                    {#each backups as backup}
                        <li>
                            <div class="backup-line">
                                <div class="backup-meta">
                                    <a
                                        href={backup.htmlUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        data-testid={`backup-link-${backup.id}`}
                                    >
                                        {backup.filename || 'Backup'}
                                    </a>
                                    <span class="timestamp">{friendlyDate(backup.createdAt)}</span>
                                </div>
                                <div class="backup-actions">
                                    <code class="backup-id">{backup.id}</code>
                                    <Chip
                                        text="Copy ID"
                                        onClick={() => copyGistId(backup.id)}
                                        inverted={true}
                                        dataTestId={`copy-backup-${backup.id}`}
                                    />
                                </div>
                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>
    </div>

    {#if toastMessage}
        <div class={`toast ${toastType}`} role="status" aria-live="polite">{toastMessage}</div>
    {/if}
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
        position: relative;
    }

    .chip-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .backups {
        background: rgba(0, 0, 0, 0.25);
        border-radius: 0.5rem;
        padding: 0.75rem;
        display: grid;
        gap: 0.5rem;
    }

    .backups-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
    }

    .backup-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.5rem;
    }

    .backup-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .backup-meta {
        display: grid;
        gap: 0.25rem;
    }

    .backup-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
    }

    .backup-id {
        background: rgba(0, 0, 0, 0.2);
        padding: 0.25rem 0.35rem;
        border-radius: 0.35rem;
        font-size: 0.9rem;
    }

    .timestamp {
        color: #c1eac1;
        font-size: 0.95rem;
    }

    .hint {
        color: #e6ffe6;
        margin: 0;
    }

    .spinner {
        width: 1rem;
        height: 1rem;
        border-radius: 9999px;
        border: 2px solid rgba(255, 255, 255, 0.6);
        border-top-color: transparent;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .toast {
        position: absolute;
        bottom: 0.75rem;
        right: 0.75rem;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        padding: 0.5rem 0.75rem;
        border-radius: 0.45rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .toast.error {
        background: rgba(155, 28, 49, 0.85);
    }

    .toast.success {
        background: rgba(0, 128, 64, 0.85);
    }

    @media (max-width: 640px) {
        .token-input {
            flex-direction: column;
            align-items: stretch;
        }

        .chip-row {
            justify-content: flex-start;
        }

        .backups-header {
            flex-direction: column;
            align-items: flex-start;
        }
    }
</style>
