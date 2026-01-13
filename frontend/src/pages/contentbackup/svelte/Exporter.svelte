<script>
    import { onDestroy } from 'svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { prepareCustomContentBackup } from '../../../utils/customContentBackup.js';

    let assets = [];
    let isRunning = false;
    let status = 'idle';
    let errorMessage = '';
    let downloadUrl = '';
    let downloadFilename = '';
    let wasDownloaded = false;
    let runId = 0;

    const resetState = () => {
        assets = [];
        errorMessage = '';
        status = 'idle';
        wasDownloaded = false;
        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
        }
        downloadUrl = '';
        downloadFilename = '';
    };

    const updateAssetStatus = (id, nextStatus) => {
        assets = assets.map((asset) =>
            asset.id === id
                ? {
                      ...asset,
                      status: nextStatus,
                  }
                : asset
        );
    };

    const prepareBackup = async () => {
        if (isRunning) {
            return;
        }
        resetState();
        status = 'running';
        isRunning = true;
        const currentRun = runId + 1;
        runId = currentRun;

        try {
            const result = await prepareCustomContentBackup({
                onPlanReady: (plan) => {
                    if (currentRun !== runId) {
                        return;
                    }
                    assets = plan.map((asset) => ({
                        ...asset,
                        status: 'pending',
                    }));
                },
                onProgress: ({ id, status: nextStatus }) => {
                    if (currentRun !== runId) {
                        return;
                    }
                    updateAssetStatus(id, nextStatus);
                },
            });

            if (currentRun !== runId) {
                return;
            }

            downloadUrl = URL.createObjectURL(result.blob);
            downloadFilename = result.filename;
            status = 'ready';
        } catch (error) {
            status = 'error';
            errorMessage = error?.message ?? 'Failed to prepare backup.';
        } finally {
            if (currentRun === runId) {
                isRunning = false;
            }
        }
    };

    const downloadBackup = () => {
        if (!downloadUrl) {
            return;
        }
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = downloadFilename || 'dspace-custom-content-backup.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        downloadUrl = '';
        wasDownloaded = true;
    };

    const statusLabel = (assetStatus) => {
        switch (assetStatus) {
            case 'processing':
                return 'Processing';
            case 'complete':
                return 'Processed';
            case 'error':
                return 'Failed';
            default:
                return 'Pending';
        }
    };

    const progressValue = (assetStatus) => {
        if (assetStatus === 'complete' || assetStatus === 'error') {
            return 1;
        }
        if (assetStatus === 'processing') {
            return 0.5;
        }
        return 0;
    };

    onDestroy(() => {
        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
        }
    });
</script>

<Chip text="">
    <div class="vertical" data-hydrated="true">
        <h2>Export custom content</h2>
        <p>Prepare a portable backup file containing your custom quests, items, and processes.</p>
        <Chip text="Prepare backup" on:click={prepareBackup} disabled={isRunning} inverted={true} />

        {#if status === 'running'}
            <p class="status">Preparing backup…</p>
        {/if}

        {#if status === 'error'}
            <div class="banner error" role="alert">{errorMessage}</div>
        {/if}

        {#if assets.length > 0}
            <ul class="asset-list">
                {#each assets as asset}
                    <li>
                        <div class="asset-row">
                            <div class="asset-label">{asset.label}</div>
                            <progress max="1" value={progressValue(asset.status)}></progress>
                            <span class={`asset-status ${asset.status}`}>{statusLabel(asset.status)}</span>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}

        {#if status === 'ready' && downloadUrl}
            <Chip text="Download backup" on:click={downloadBackup} inverted={true} />
        {:else if wasDownloaded}
            <p class="status">Backup downloaded. Prepare again for a new file.</p>
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

    .asset-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .asset-row {
        display: grid;
        grid-template-columns: 1fr minmax(120px, 160px) auto;
        align-items: center;
        gap: 0.75rem;
    }

    .asset-label {
        font-size: 0.9rem;
    }

    progress {
        width: 100%;
        height: 0.5rem;
    }

    .asset-status {
        font-size: 0.8rem;
        text-transform: uppercase;
    }

    .asset-status.complete {
        color: #1a7f37;
    }

    .asset-status.error {
        color: #b42318;
    }

    .banner {
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        font-weight: 600;
    }

    .banner.error {
        background-color: #fdecec;
        color: #b42318;
    }

    .status {
        font-size: 0.9rem;
        color: #4a4a4a;
    }
</style>
