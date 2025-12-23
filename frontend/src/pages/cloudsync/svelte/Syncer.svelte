<script lang="ts">
    import { onMount } from 'svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
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
    import { findBackupFile, listBackups, validateToken } from '../../../lib/cloudsync/githubGists';
    import type { GistBackup } from '../../../lib/cloudsync/githubGists';

    let root: HTMLDivElement | undefined;
    let token = '';
    let gistId = '';
    let message = '';
    let messageType: 'success' | 'error' | '' = '';
    let tokenMessage = '';
    let tokenMessageType: 'success' | 'error' | '' = '';
    let savingToken = false;
    let uploadInProgress = false;
    let downloadInProgress = false;
    let backups: GistBackup[] = [];
    let backupsLoading = false;
    let backupsError = '';
    let toastMessage = '';
    let toastType: 'success' | 'error' | '' = '';
    let toastTimeout: ReturnType<typeof setTimeout> | undefined;

    const announce = (text: string, type: 'success' | 'error' | '' = '') => {
        message = text;
        messageType = type;
    };

    const announceToken = (text: string, type: 'success' | 'error' | '' = '') => {
        tokenMessage = text;
        tokenMessageType = type;
    };

    const showToast = (text: string, type: 'success' | 'error' | '' = '') => {
        toastMessage = text;
        toastType = type;
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }
        toastTimeout = setTimeout(() => {
            toastMessage = '';
            toastType = '';
        }, 3000);
    };

    const refreshBackups = async () => {
        if (!token) {
            backups = [];
            return;
        }

        backupsLoading = true;
        backupsError = '';

        try {
            backups = await listBackups(token);
        } catch (error) {
            backupsError = 'Could not load backups';
        } finally {
            backupsLoading = false;
        }
    };

    const handleTokenSave = async () => {
        announceToken('', '');
        savingToken = true;
        try {
            if (!isValidGitHubToken(token)) {
                announceToken('GitHub token looks invalid', 'error');
                return;
            }
            await validateToken(token);
            await saveGitHubToken(token.trim());
            announceToken('Token saved', 'success');
            showToast('GitHub token saved', 'success');
            await refreshBackups();
        } catch (error) {
            await clearGitHubToken();
            announceToken('Could not verify token', 'error');
            showToast('Token verification failed', 'error');
        } finally {
            savingToken = false;
        }
    };

    const clearTokenLocal = async () => {
        token = '';
        await clearGitHubToken();
        announceToken('Token cleared', 'success');
    };

    onMount(async () => {
        token = await loadGitHubToken();
        gistId = await loadCloudGistId();
        root?.setAttribute('data-hydrated', 'true');
        if (typeof window !== 'undefined') {
            window.__cloudSyncReady = true;
        }
        if (token) {
            await refreshBackups();
        }
    });

    const handleUpload = async () => {
        announce('', '');
        uploadInProgress = true;
        try {
            if (!isValidGitHubToken(token)) {
                announce('GitHub token looks invalid', 'error');
                return;
            }
            const gist = (await uploadGameStateToGist(token)) as GistBackup;
            gistId = '';
            await clearCloudGistId();
            announce('Upload successful', 'success');
            showToast('Backup uploaded', 'success');
            if (gist?.id) {
                backups = [{ ...gist }, ...backups];
            }
            await refreshBackups();
        } catch (err) {
            announce('Upload failed', 'error');
        } finally {
            uploadInProgress = false;
        }
    };

    const clearGistId = async () => {
        gistId = '';
        await clearCloudGistId();
    };

    const handleDownload = async () => {
        announce('', '');
        downloadInProgress = true;
        try {
            if (!gistId) {
                announce('Gist ID required', 'error');
                return;
            }
            await downloadGameStateFromGist(token, gistId);
            announce('Download successful', 'success');
            showToast('Backup downloaded', 'success');
        } catch (err) {
            announce('Download failed', 'error');
        } finally {
            downloadInProgress = false;
        }
    };

    const formatBackupDate = (value: string) => {
        if (!value) return 'Unknown date';
        return new Date(value).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    const backupFileName = (backup: GistBackup) => findBackupFile(backup?.files)?.filename;
    const copyId = async (id: string | undefined) => {
        if (!id) {
            return;
        }
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(id);
            showToast('Gist ID copied', 'success');
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
                        onClick={handleTokenSave}
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
                    />
                </div>
            </div>
            {#if tokenMessage}
                <p
                    class={`message ${tokenMessageType}`}
                    role={tokenMessageType === 'error' ? 'alert' : 'status'}
                    data-testid={tokenMessageType === 'error'
                        ? 'token-error'
                        : tokenMessageType === 'success'
                          ? 'token-success'
                          : undefined}
                >
                    {tokenMessage}
                </p>
            {/if}
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
            <Chip
                text={uploadInProgress ? 'Uploading…' : 'Upload'}
                onClick={handleUpload}
                inverted={true}
                disabled={uploadInProgress}
            >
                {#if uploadInProgress}
                    <span class="spinner" aria-hidden="true"></span>
                {/if}
            </Chip>
            <Chip
                text={downloadInProgress ? 'Downloading…' : 'Download'}
                onClick={handleDownload}
                disabled={downloadInProgress}
            >
                {#if downloadInProgress}
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
        <div class="backups">
            <div class="backups-header">
                <h3>Backups</h3>
                <Chip
                    text={backupsLoading ? 'Refreshing…' : 'Refresh'}
                    onClick={refreshBackups}
                    disabled={backupsLoading || !token}
                    dataTestId="refresh-backups"
                >
                    {#if backupsLoading}
                        <span class="spinner" aria-hidden="true"></span>
                    {/if}
                </Chip>
            </div>
            {#if backupsLoading}
                <p class="status">Loading backups…</p>
            {:else if backupsError}
                <p class="message error">{backupsError}</p>
            {:else if backups.length === 0}
                <p class="status">No backups yet.</p>
            {:else}
                <ul>
                    {#each backups as backup (backup.id)}
                        <li class="backup-row">
                            <div class="backup-main">
                                <a href={backup?.html_url} target="_blank" rel="noreferrer">
                                    {backupFileName(backup) || 'Backup file'}
                                </a>
                                <span class="meta">{formatBackupDate(backup?.created_at)}</span>
                                <span class="meta">ID: {backup?.id}</span>
                            </div>
                            <div class="backup-actions">
                                <Chip text="Copy ID" onClick={() => copyId(backup?.id)} />
                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</div>

{#if toastMessage}
    <div class={`toast ${toastType}`} role="status" aria-live="polite">
        {toastMessage}
    </div>
{/if}

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

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.5);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .backups {
        background: rgba(0, 0, 0, 0.25);
        border-radius: 0.6rem;
        padding: 0.75rem;
        display: grid;
        gap: 0.5rem;
    }

    .backups-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .backups h3 {
        margin: 0;
    }

    ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.5rem;
    }

    .backup-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .backup-row:last-child {
        border-bottom: none;
    }

    .backup-main {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-wrap: wrap;
    }

    .backup-main a {
        color: #b2f5bf;
        font-weight: 600;
    }

    .meta {
        font-size: 0.9rem;
        color: #d6f0da;
    }

    .status {
        margin: 0;
        color: #d6f0da;
    }

    .toast {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        background: #2f5b2f;
        color: #fff;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
        z-index: 10;
    }

    .toast.error {
        background: #9b1c31;
    }

    .toast.success {
        background: #68d46d;
        color: #063906;
    }

    .backup-actions {
        display: flex;
        gap: 0.5rem;
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

        .backup-main {
            flex-direction: column;
            align-items: flex-start;
        }

        .backup-actions {
            width: 100%;
            justify-content: flex-start;
        }
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
