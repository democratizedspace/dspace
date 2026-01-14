<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import { restoreCustomContentBackupFromFile } from '../../../utils/customContentBackup.js';

    const fileInputId = 'custom-content-backup-file';
    const dropzoneLabelId = 'custom-content-backup-dropzone-label';

    let assets = [];
    let status = 'idle';
    let message = '';
    let successFilename = '';
    let isDragging = false;

    $: statusMessage =
        status === 'running'
            ? 'Importing…'
            : status === 'success'
              ? message || 'Import complete'
              : status === 'error'
                ? message || 'Import failed. Please try again.'
                : 'Ready to import.';

    $: statusTone = status === 'success' ? 'success' : status === 'error' ? 'error' : '';

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

    const isValidBackupFile = (file) => {
        if (!file) {
            return false;
        }
        const lowerName = file.name.toLowerCase();
        return lowerName.endsWith('.json') || lowerName.endsWith('.dspace-backup');
    };

    const handleImportFile = async (file) => {
        if (!isValidBackupFile(file)) {
            status = 'error';
            message = 'Please choose a valid backup file.';
            return;
        }

        status = 'running';
        message = '';
        successFilename = '';
        assets = [];

        try {
            await restoreCustomContentBackupFromFile(file, {
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

            status = 'success';
            message = 'Import complete';
            successFilename = file.name;
        } catch (error) {
            status = 'error';
            message = error instanceof Error ? error.message : 'Import failed. Please try again.';
            successFilename = '';
        }
    };

    const handleFileChange = async (event) => {
        const input = event.currentTarget;
        const file = input?.files?.[0];
        if (file) {
            await handleImportFile(file);
        }
        if (input) {
            input.value = '';
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        isDragging = false;
        const file = event.dataTransfer?.files?.[0];
        if (file) {
            handleImportFile(file);
        }
    };
</script>

<div class="panel">
    <section class="vertical" data-hydrated="true" data-testid="contentbackup-import">
        <h2>Import custom content</h2>
        <p id={dropzoneLabelId}>Drag and drop your backup file here, or click to browse.</p>
        <label
            for={fileInputId}
            class:dragging={isDragging}
            class="dropzone"
            aria-labelledby={dropzoneLabelId}
            on:dragover|preventDefault={() => (isDragging = true)}
            on:dragleave|self={() => (isDragging = false)}
            on:drop={handleDrop}
        >
            <input
                id={fileInputId}
                type="file"
                accept=".json,.dspace-backup,application/json"
                on:change={handleFileChange}
            />
            <span>Choose backup file</span>
        </label>

        <p class={`status ${statusTone}`} role="status" aria-live="polite" aria-atomic="true">
            <span>{statusMessage}</span>
            {#if status === 'success' && successFilename}
                <span class="status-detail"> — {successFilename}</span>
            {/if}
        </p>

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
    </section>
</div>

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

    .panel {
        width: 100%;
    }

    .dropzone {
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px dashed #a5a5a5;
        border-radius: 0.75rem;
        padding: 1.5rem;
        text-align: center;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.6);
        transition:
            border-color 0.2s ease,
            background 0.2s ease;
    }

    .dropzone.dragging {
        border-color: #2f7af8;
        background: rgba(47, 122, 248, 0.1);
    }

    .dropzone input {
        display: none;
    }

    .status {
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        background: rgba(0, 0, 0, 0.08);
        margin: 0;
    }

    .status.success {
        background: rgba(0, 130, 60, 0.15);
        color: #0b4d2a;
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
