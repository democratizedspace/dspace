<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { importCustomContentBackupFile } from '../../../utils/customContentBackup.js';

    let assets = [];
    let status = 'idle';
    let errorMessage = '';
    let successMessage = '';
    let isRunning = false;
    let dragActive = false;
    let inputId = 'custom-content-backup-file';

    const resetStatus = () => {
        assets = [];
        errorMessage = '';
        successMessage = '';
        status = 'idle';
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

    const runImport = async (file) => {
        if (!file || isRunning) {
            return;
        }
        resetStatus();
        status = 'running';
        isRunning = true;

        try {
            await importCustomContentBackupFile(file, {
                onPlanReady: (plan) => {
                    assets = plan.map((asset) => ({
                        ...asset,
                        status: 'pending',
                    }));
                },
                onProgress: ({ id, status: nextStatus }) => {
                    updateAssetStatus(id, nextStatus);
                },
            });
            status = 'success';
            successMessage = 'Custom content restored successfully.';
        } catch (error) {
            status = 'error';
            errorMessage = error?.message ?? 'Failed to import backup.';
        } finally {
            isRunning = false;
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        void runImport(file);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        dragActive = false;
        const file = event.dataTransfer?.files?.[0];
        void runImport(file);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        dragActive = true;
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        dragActive = false;
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
</script>

<Chip text="">
    <div class="vertical" data-hydrated="true">
        <h2>Import custom content</h2>
        <p>Upload a backup file to restore your custom quests, items, and processes.</p>
        <label
            class={`dropzone ${dragActive ? 'active' : ''}`}
            for={inputId}
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
        >
            <input id={inputId} type="file" accept=".json" on:change={handleFileChange} />
            <span>Drag and drop your backup file here, or click to browse.</span>
        </label>

        {#if status === 'running'}
            <p class="status">Importing backup…</p>
        {/if}

        {#if status === 'error'}
            <div class="banner error" role="alert">{errorMessage}</div>
        {/if}

        {#if status === 'success'}
            <div class="banner success" role="status">{successMessage}</div>
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

    .dropzone {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 1.5rem;
        border: 2px dashed #c3c3c3;
        border-radius: 1rem;
        background-color: #f7f7f7;
        color: #4a4a4a;
        cursor: pointer;
    }

    .dropzone.active {
        border-color: #3b82f6;
        background-color: #eef5ff;
    }

    .dropzone input {
        display: none;
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

    .banner.success {
        background-color: #ecfdf3;
        color: #1a7f37;
    }

    .status {
        font-size: 0.9rem;
        color: #4a4a4a;
    }
</style>
