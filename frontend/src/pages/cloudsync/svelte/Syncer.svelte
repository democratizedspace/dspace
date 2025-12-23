<script>
    import { onMount } from 'svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import {
        loadCloudGistId,
        uploadGameStateToGist,
        downloadGameStateFromGist,
        clearCloudGistId,
        listCloudBackups,
    } from '../../../utils/cloudSync.js';
    import {
        isValidGitHubToken,
        loadGitHubToken,
        saveGitHubToken,
        clearGitHubToken,
    } from '../../../utils/githubToken.js';
    import { validateToken } from '../../../lib/cloudsync/githubGists';
    import { copyToClipboard } from '../../../utils/copyToClipboard.js';

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
    let backups = [];
    let backupsLoading = false;
    let backupsError = '';

    const announce = (text, type = '') => {
        message = text;
        messageType = type;
        showToast(text, type);
    };

    const showToast = (text, type = '') => {
        toastMessage = text;
        toastType = type;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastMessage = '';
        }, 3000);
    };

    const formatDate = (value) => {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const refreshBackups = async (authToken = token) => {
        if (!authToken) {
            backups = [];
            return;
        }
        backupsLoading = true;
        backupsError = '';
        try {
            backups = await listCloudBackups(authToken);
        } catch (err) {
            console.error(err);
            backupsError = 'Failed to load backups.';
        } finally {
            backupsLoading = false;
        }
    };

    onMount(async () => {
        token = await loadGitHubToken();
        gistId = await loadCloudGistId();
        if (token) {
            refreshBackups(token);
        }
        root?.setAttribute('data-hydrated', 'true');
        if (typeof window !== 'undefined') {
            window.__cloudSyncReady = true;
        }
    });

    const saveToken = async () => {
        const trimmed = token.trim();
        if (!trimmed) {
            announce('GitHub token is required', 'error');
            return;
        }
        if (!isValidGitHubToken(trimmed)) {
            announce('GitHub token format looks invalid', 'error');
            return;
        }
        savingToken = true;
        announce('Validating token...', '');
        try {
            const validation = await validateToken(trimmed);
            if (!validation.ok) {
                await clearGitHubToken();
                announce(validation.reason, 'error');
                return;
            }
            await saveGitHubToken(trimmed);
            announce('Token saved', 'success');
            await refreshBackups(trimmed);
        } catch (err) {
            console.error(err);
            await clearGitHubToken();
            announce('Failed to validate token', 'error');
        } finally {
            savingToken = false;
        }
    };

    const clearTokenLocal = async () => {
        token = '';
        backups = [];
        await clearGitHubToken();
        announce('Token cleared', '');
    };

    const handleUpload = async () => {
        if (!isValidGitHubToken(token)) {
            announce('GitHub token looks invalid', 'error');
            return;
        }
        uploading = true;
        announce('Uploading backup...', '');
        try {
            const gist = await uploadGameStateToGist(token);
            gistId = '';
            announce('Upload successful', 'success');
            backups = [
                {
                    id: gist.id,
                    htmlUrl: gist.htmlUrl,
                    createdAt: gist.createdAt ?? new Date().toISOString(),
                    filename: gist.filename,
                },
                ...backups,
            ];
            await refreshBackups(token);
        } catch (err) {
            console.error(err);
            announce('Upload failed', 'error');
        } finally {
            uploading = false;
        }
    };

    const clearGistIdLocal = async () => {
        gistId = '';
        await clearCloudGistId();
    };

    const handleDownload = async () => {
        const trimmed = gistId.trim();
        if (!trimmed) {
            announce('Gist ID required', 'error');
            return;
        }
        downloading = true;
        announce('Downloading backup...', '');
        try {
            await downloadGameStateFromGist(token, trimmed);
            announce('Download successful', 'success');
        } catch (err) {
            console.error(err);
            announce('Download failed', 'error');
        } finally {
            downloading = false;
        }
    };

    const copyId = async (id) => {
        await copyToClipboard(id);
        showToast('Gist ID copied', 'success');
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
                    aria-describedby="token-help"
                />
                <div class="chip-row">
                    <Chip
                        text={savingToken ? 'Saving…' : 'Save'}
                        onClick={saveToken}
                        inverted={true}
                        disabled={savingToken}
                        dataTestId="save-token"
                        aria-busy={savingToken}
                    >
                        {#if savingToken}
                            <span
                                class="spinner"
                                data-testid="token-save-spinner"
                                aria-hidden="true"
                            ></span>
                        {/if}
                    </Chip>
                    <Chip
                        text="Clear"
                        onClick={clearTokenLocal}
                        hazard={true}
                        dataTestId="clear-sync-token"
                        disabled={savingToken}
                    />
                </div>
            </div>
            <p id="token-help" class="help-text">
                Token is stored only in your browser after validation.
            </p>
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
                    onClick={clearGistIdLocal}
                    hazard={true}
                    dataTestId="clear-gist-id"
                />
            </div>
        </div>
        <div class="buttons">
            <Chip
                text={uploading ? 'Uploading…' : 'Upload'}
                onClick={handleUpload}
                inverted={true}
                disabled={uploading}
                dataTestId="upload"
                aria-busy={uploading}
            >
                {#if uploading}
                    <span class="spinner" data-testid="upload-spinner" aria-hidden="true"></span>
                {/if}
            </Chip>
            <Chip
                text={downloading ? 'Downloading…' : 'Download'}
                onClick={handleDownload}
                disabled={downloading}
                dataTestId="download"
                aria-busy={downloading}
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
                <div>
                    <h3>Backups</h3>
                    <p class="help-text">Newest backups appear first.</p>
                </div>
                <Chip
                    text={backupsLoading ? 'Refreshing…' : 'Refresh'}
                    onClick={() => refreshBackups()}
                    disabled={backupsLoading || !token}
                    dataTestId="refresh-backups"
                >
                    {#if backupsLoading}
                        <span class="spinner" aria-hidden="true"></span>
                    {/if}
                </Chip>
            </div>
            {#if backupsError}
                <p class="message error">{backupsError}</p>
            {/if}
            {#if backupsLoading}
                <p class="message info">Loading backups…</p>
            {:else if backups.length === 0}
                <p class="empty">No backups found yet.</p>
            {:else}
                <ul class="backup-list" data-testid="backup-list">
                    {#each backups as backup}
                        <li class="backup-item">
                            <div class="backup-title">
                                <a href={backup.htmlUrl} target="_blank" rel="noreferrer">
                                    {backup.filename || 'Backup'}
                                </a>
                            </div>
                            <div class="backup-meta">
                                <span class="id" aria-label={`Gist ${backup.id}`}>{backup.id}</span>
                                <Chip text="Copy ID" onClick={() => copyId(backup.id)} />
                                <span class="created">{formatDate(backup.createdAt)}</span>
                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>
    </div>

    {#if toastMessage}
        <div class={`toast message ${toastType}`} role="status" aria-live="polite">
            {toastMessage}
        </div>
    {/if}
</div>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 14px;
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

    .message.info {
        color: #e2e2e2;
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
        background: rgba(0, 0, 0, 0.15);
        border-radius: 0.5rem;
        padding: 0.75rem;
        display: grid;
        gap: 0.5rem;
    }

    .backups-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .backup-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.75rem;
    }

    .backup-item {
        display: grid;
        gap: 0.25rem;
        background: rgba(255, 255, 255, 0.06);
        padding: 0.5rem 0.75rem;
        border-radius: 0.4rem;
    }

    .backup-title a {
        color: #b2f5bf;
        word-break: break-all;
    }

    .backup-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .backup-meta .id {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }

    .backup-meta .created {
        color: #d2d2d2;
        font-size: 0.9rem;
    }

    .empty {
        color: #d2d2d2;
    }

    .help-text {
        margin: 0.25rem 0 0;
        color: #d2d2d2;
        font-size: 0.95rem;
    }

    .spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.5);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    .toast {
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.75);
        padding: 0.5rem 0.75rem;
        border-radius: 0.4rem;
        color: white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
