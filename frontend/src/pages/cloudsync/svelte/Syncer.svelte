<script>
    import { onMount } from 'svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import Spinner from '../../../components/svelte/Spinner.svelte';
    import {
        clearCloudGistId,
        downloadGameStateFromGist,
        loadCloudGistId,
        uploadGameStateToGist,
    } from '../../../utils/cloudSync.js';
    import {
        clearGitHubToken,
        isValidGitHubToken,
        loadGitHubToken,
        saveGitHubToken,
    } from '../../../utils/githubToken.js';
    import { listBackups, validateToken } from '../../../lib/cloudsync/githubGists.js';

    let root;
    let token = '';
    let gistId = '';
    let message = '';
    let messageType = '';
    let savingToken = false;
    let uploading = false;
    let downloading = false;
    let backups = [];
    let backupsLoading = false;
    let backupsError = '';
    let validatedToken = '';

    const announce = (text, type = '') => {
        message = text;
        messageType = type;
    };

    const friendlyDate = (value) =>
        new Date(value).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
            hour12: false,
        });

    const resetMessages = () => {
        announce('', '');
        backupsError = '';
    };

    const ensureValidatedToken = async (persist = false) => {
        const trimmed = token?.trim() ?? '';
        if (!trimmed) {
            throw new Error('GitHub token required');
        }
        if (!isValidGitHubToken(trimmed)) {
            throw new Error('GitHub token looks invalid');
        }
        if (validatedToken === trimmed) {
            if (persist) {
                await saveGitHubToken(trimmed);
            }
            return trimmed;
        }
        const verified = await validateToken(trimmed);
        validatedToken = verified;
        if (persist) {
            await saveGitHubToken(verified);
        }
        return verified;
    };

    const refreshBackups = async (activeToken) => {
        const tokenForList = activeToken || validatedToken || token?.trim();
        if (!tokenForList) {
            backups = [];
            return;
        }
        backupsLoading = true;
        backupsError = '';
        try {
            const usableToken =
                validatedToken && validatedToken === tokenForList
                    ? validatedToken
                    : await ensureValidatedToken();
            const remoteBackups = await listBackups(usableToken);
            backups = remoteBackups;
        } catch (err) {
            backupsError = err?.message || 'Failed to load backups';
        } finally {
            backupsLoading = false;
        }
    };

    onMount(async () => {
        token = await loadGitHubToken();
        gistId = await loadCloudGistId();
        root?.setAttribute('data-hydrated', 'true');
        if (typeof window !== 'undefined') {
            window.__cloudSyncReady = true;
        }
        if (token) {
            await refreshBackups(token);
        }
    });

    const saveToken = async () => {
        savingToken = true;
        resetMessages();
        try {
            const verified = await ensureValidatedToken(true);
            announce('Token saved', 'success');
            await refreshBackups(verified);
        } catch (err) {
            announce(err?.message || 'Failed to save token', 'error');
        } finally {
            savingToken = false;
        }
    };

    const clearTokenLocal = async () => {
        token = '';
        validatedToken = '';
        backups = [];
        await clearGitHubToken();
        announce('Token cleared', 'success');
    };

    const handleUpload = async () => {
        uploading = true;
        resetMessages();
        try {
            const activeToken = await ensureValidatedToken(true);
            const id = await uploadGameStateToGist(activeToken);
            gistId = '';
            await clearCloudGistId();
            announce('Upload successful', 'success');
            await refreshBackups(activeToken);
            return id;
        } catch (err) {
            announce(err?.message || 'Upload failed', 'error');
            return undefined;
        } finally {
            uploading = false;
        }
    };

    const clearGistId = async () => {
        gistId = '';
        await clearCloudGistId();
    };

    const handleDownload = async () => {
        downloading = true;
        resetMessages();
        try {
            if (!gistId) {
                throw new Error('Gist ID required');
            }
            const activeToken = await ensureValidatedToken(true);
            await downloadGameStateFromGist(activeToken, gistId);
            announce('Download successful', 'success');
        } catch (err) {
            announce(err?.message || 'Download failed', 'error');
        } finally {
            downloading = false;
        }
    };

    const copyToClipboard = async (value) => {
        try {
            if (!navigator?.clipboard?.writeText) {
                throw new Error('Clipboard not available');
            }
            await navigator.clipboard.writeText(value);
            announce('Copied gist ID', 'success');
        } catch (err) {
            announce('Unable to copy gist ID', 'error');
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
                    <Chip
                        text={savingToken ? 'Saving…' : 'Save'}
                        onClick={saveToken}
                        inverted={true}
                        disabled={savingToken || !token.trim()}
                        dataTestId="save-github-token"
                    >
                        {#if savingToken}
                            <Spinner size={16} color="#000000" />
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
                disabled={uploading || savingToken || !isValidGitHubToken(token)}
                dataTestId="upload-backup"
            >
                {#if uploading}
                    <Spinner size={16} color="#000000" />
                {/if}
            </Chip>
            <Chip
                text={downloading ? 'Downloading…' : 'Download'}
                onClick={handleDownload}
                disabled={downloading ||
                    savingToken ||
                    !gistId.trim() ||
                    !isValidGitHubToken(token)}
                dataTestId="download-backup"
            >
                {#if downloading}
                    <Spinner size={16} color="#ffffff" />
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
                <div class="chip-row">
                    <Chip
                        text={backupsLoading ? 'Refreshing…' : 'Refresh'}
                        onClick={() => refreshBackups()}
                        inverted={true}
                        disabled={backupsLoading || !token.trim()}
                        dataTestId="refresh-backups"
                    >
                        {#if backupsLoading}
                            <Spinner size={14} color="#000000" />
                        {/if}
                    </Chip>
                </div>
            </div>
            {#if backupsError}
                <p class="message error" role="alert">{backupsError}</p>
            {:else if backupsLoading}
                <p class="subtle" aria-live="polite">
                    <Spinner size={14} color="#ffffff" /> Loading backups…
                </p>
            {:else if backups.length === 0}
                <p class="subtle">No backups found.</p>
            {:else}
                <ul class="backup-list" data-testid="backups-list">
                    {#each backups as backup}
                        <li>
                            <div class="backup-row">
                                <a
                                    href={backup.html_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    data-testid={`backup-link-${backup.id}`}
                                >
                                    {backup.filename || 'Backup'}
                                </a>
                                <span class="timestamp">{friendlyDate(backup.created_at)}</span>
                            </div>
                            <div class="backup-actions">
                                <code class="gist-id">{backup.id}</code>
                                <Chip
                                    text="Copy ID"
                                    onClick={() => copyToClipboard(backup.id)}
                                    inverted={true}
                                    dataTestId={`copy-gist-${backup.id}`}
                                />
                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>
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
        margin: 0;
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

    .backups {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        padding: 10px;
        display: grid;
        gap: 0.5rem;
    }

    .backups-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
    }

    .backups h3 {
        margin: 0;
    }

    .backup-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.5rem;
    }

    .backup-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: space-between;
        align-items: center;
    }

    .backup-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .gist-id {
        background: rgba(0, 0, 0, 0.35);
        padding: 4px 6px;
        border-radius: 6px;
        font-size: 0.9rem;
    }

    .timestamp {
        font-size: 0.9rem;
        color: #d6ffd6;
    }

    .subtle {
        color: #d6ffd6;
        margin: 0;
    }

    @media (max-width: 640px) {
        .token-input {
            flex-direction: column;
            align-items: stretch;
        }

        .chip-row {
            justify-content: flex-start;
        }

        .backup-row {
            flex-direction: column;
            align-items: flex-start;
        }
    }
</style>
