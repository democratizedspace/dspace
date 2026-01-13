<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import {
        buildBackupAssetList,
        createBackupFilename,
        createCustomContentBackupBlob,
        createCustomContentBackupPayload,
        getCustomContentSnapshot,
    } from '../../../utils/customContentBackup.js';

    let assets = [];
    let isPreparing = false;
    let errorMessage = '';
    let backupBlob = null;
    let downloadName = '';

    const statusLabels = {
        pending: 'Pending',
        'in-progress': 'Processing',
        complete: 'Complete',
        error: 'Error',
    };

    const resetState = () => {
        errorMessage = '';
        assets = [];
        backupBlob = null;
        downloadName = '';
    };

    const updateAsset = ({ id, status, message }) => {
        assets = assets.map((asset) => (asset.id === id ? { ...asset, status, message } : asset));
    };

    const prepareBackup = async () => {
        if (isPreparing) {
            return;
        }
        resetState();
        isPreparing = true;

        try {
            const snapshot = await getCustomContentSnapshot();
            const assetList = buildBackupAssetList(snapshot).map((asset) => ({
                ...asset,
                status: 'pending',
            }));
            assets = assetList;

            const payload = await createCustomContentBackupPayload(snapshot, {
                onAssetUpdate: updateAsset,
            });
            backupBlob = createCustomContentBackupBlob(payload);
            downloadName = createBackupFilename();
        } catch (error) {
            errorMessage = error?.message || 'Unable to prepare the backup. Please try again.';
        } finally {
            isPreparing = false;
        }
    };

    const downloadBackup = () => {
        if (!backupBlob || !downloadName) {
            return;
        }
        const downloadUrl = URL.createObjectURL(backupBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);
    };

    const progressValue = (status) => {
        switch (status) {
            case 'complete':
                return 1;
            case 'in-progress':
                return 0.5;
            case 'error':
                return 1;
            default:
                return 0;
        }
    };
</script>

<Chip text="">
    <div class="vertical">
        <h2>Export custom content</h2>
        <p>Prepare a portable backup file of your custom quests, items, and processes.</p>
        <Chip
            text={isPreparing ? 'Preparing…' : 'Prepare backup'}
            on:click={prepareBackup}
            inverted={true}
            disabled={isPreparing}
        />
        {#if errorMessage}
            <div class="banner error" role="alert">{errorMessage}</div>
        {/if}
        {#if assets.length}
            <div class="progress-list" aria-live="polite">
                {#each assets as asset}
                    <div class="progress-row">
                        <div class="progress-meta">
                            <span>{asset.label}</span>
                            <span class:status-error={asset.status === 'error'}>
                                {statusLabels[asset.status]}
                            </span>
                        </div>
                        <progress
                            max="1"
                            value={progressValue(asset.status)}
                            aria-label={`${asset.label} progress`}
                        ></progress>
                    </div>
                {/each}
            </div>
        {/if}
        {#if backupBlob}
            <Chip text="Download backup" on:click={downloadBackup} inverted={true} />
        {/if}
    </div>
</Chip>

<style>
    h2 {
        margin: 0;
        font-size: 1.1rem;
    }

    p {
        font-weight: normal;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
    }

    .progress-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .progress-row {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .progress-meta {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        font-size: 0.9rem;
    }

    progress {
        width: 100%;
        height: 10px;
        border-radius: 999px;
        overflow: hidden;
    }

    .banner {
        padding: 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.95rem;
    }

    .error {
        background: rgba(185, 28, 28, 0.15);
        color: #b91c1c;
        border: 1px solid rgba(185, 28, 28, 0.4);
    }

    .status-error {
        color: #b91c1c;
    }
</style>
