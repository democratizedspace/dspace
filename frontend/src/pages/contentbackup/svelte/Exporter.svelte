<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { buildCustomContentBackup } from '../../../utils/customContentBackup.js';

    let assets = [];
    let status = 'idle';
    let errorMessage = '';
    let backupBlob = null;
    let backupFilename = '';

    const updateAssets = (assetId, updates) => {
        assets = assets.map((asset) =>
            asset.id === assetId
                ? {
                      ...asset,
                      ...updates,
                  }
                : asset
        );
    };

    const handlePrepareBackup = async () => {
        if (status === 'running') {
            return;
        }

        status = 'running';
        errorMessage = '';
        backupBlob = null;
        backupFilename = '';
        assets = [];

        try {
            const result = await buildCustomContentBackup({
                onProgress: (event) => {
                    if (event.type === 'plan') {
                        assets = event.assets.map((asset) => ({
                            id: asset.id,
                            label: asset.label,
                            status: 'pending',
                        }));
                    }
                    if (event.type === 'asset') {
                        updateAssets(event.assetId, { status: 'done' });
                    }
                    if (event.type === 'error') {
                        updateAssets(event.assetId, { status: 'error' });
                    }
                },
            });
            backupBlob = result.blob;
            backupFilename = result.filename;
            status = 'ready';
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errorMessage = message;
            status = 'error';
        }
    };

    const handleDownload = () => {
        if (!backupBlob) {
            return;
        }

        const url = URL.createObjectURL(backupBlob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = backupFilename || 'dspace-custom-content-backup.json';
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };
</script>

<Chip text="">
    <section class="vertical" data-hydrated="true" data-testid="contentbackup-export">
        <h2>Export custom content</h2>
        <p>Prepare a downloadable backup of your custom quests, items, and processes.</p>
        <Chip
            text={status === 'running' ? 'Preparing backup…' : 'Prepare backup'}
            on:click={handlePrepareBackup}
            inverted={true}
            disabled={status === 'running'}
        />

        {#if status === 'error'}
            <p class="status error" role="alert">{errorMessage}</p>
        {/if}

        {#if assets.length > 0}
            <div class="progress-list" aria-live="polite">
                {#each assets as asset}
                    <div class="progress-item" data-status={asset.status}>
                        <div class="progress-header">
                            <span>{asset.label}</span>
                            <span class="status-label">
                                {asset.status === 'done'
                                    ? 'Done'
                                    : asset.status === 'error'
                                      ? 'Error'
                                      : 'Queued'}
                            </span>
                        </div>
                        <progress
                            max="1"
                            value={asset.status === 'done' || asset.status === 'error' ? 1 : 0}
                        />
                    </div>
                {/each}
            </div>
        {/if}

        {#if status === 'ready'}
            <Chip text="Download backup" on:click={handleDownload} inverted={true} />
        {/if}
    </section>
</Chip>

<style>
    h2 {
        margin: 0;
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

    .status {
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        background: rgba(0, 0, 0, 0.08);
        margin: 0;
    }

    .status.error {
        background: rgba(190, 0, 0, 0.15);
        color: #5a0000;
    }

    .progress-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .progress-item {
        background-color: #f5f5f5;
        color: #000;
        padding: 0.75rem;
        border-radius: 0.75rem;
    }

    .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
    }

    .status-label {
        font-size: 0.85rem;
        opacity: 0.7;
    }

    progress {
        width: 100%;
        height: 0.75rem;
    }
</style>
