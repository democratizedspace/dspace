<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import {
        buildBackupAssetList,
        importCustomContentBackupPayload,
        parseCustomContentBackup,
    } from '../../../utils/customContentBackup.js';

    const fileInputId = 'custom-content-backup-file';
    const fileInputLabelId = 'custom-content-backup-label';

    let assets = [];
    let isImporting = false;
    let errorMessage = '';
    let successMessage = '';
    let selectedFileName = '';
    let isDragActive = false;

    const statusLabels = {
        pending: 'Pending',
        'in-progress': 'Processing',
        complete: 'Complete',
        error: 'Error',
    };

    const updateAsset = ({ id, status, message }) => {
        assets = assets.map((asset) => (asset.id === id ? { ...asset, status, message } : asset));
    };

    const resetState = () => {
        assets = [];
        errorMessage = '';
        successMessage = '';
    };

    const handleImportFile = async (file) => {
        if (!file || isImporting) {
            return;
        }
        resetState();
        selectedFileName = file.name;
        isImporting = true;

        try {
            const text = await file.text();
            const payload = parseCustomContentBackup(text);
            assets = buildBackupAssetList(payload).map((asset) => ({
                ...asset,
                status: 'pending',
            }));
            await importCustomContentBackupPayload(payload, {
                onAssetUpdate: updateAsset,
            });
            successMessage = 'Import complete. Custom content restored.';
        } catch (error) {
            errorMessage = error?.message || 'Unable to import backup file.';
        } finally {
            isImporting = false;
        }
    };

    const handleInputChange = (event) => {
        const [file] = event.target.files || [];
        handleImportFile(file);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        isDragActive = false;
        const [file] = event.dataTransfer?.files || [];
        handleImportFile(file);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
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
        <h2>Import custom content</h2>
        <p>Drag and drop your backup file, or click to browse for it.</p>
        <label
            id={fileInputLabelId}
            class:dropzone={true}
            class:active={isDragActive}
            for={fileInputId}
            on:dragenter={() => (isDragActive = true)}
            on:dragleave={() => (isDragActive = false)}
            on:dragover={handleDragOver}
            on:drop={handleDrop}
        >
            <input
                id={fileInputId}
                type="file"
                accept="application/json,.json"
                on:change={handleInputChange}
                disabled={isImporting}
                aria-labelledby={fileInputLabelId}
            />
            <span class="dropzone-text">
                {selectedFileName || 'Drop backup file here or click to browse'}
            </span>
        </label>
        {#if errorMessage}
            <div class="banner error" role="alert">{errorMessage}</div>
        {/if}
        {#if successMessage}
            <div class="banner success" role="status">{successMessage}</div>
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
        gap: 0.5rem;
        padding: 1rem;
        border: 2px dashed rgba(0, 0, 0, 0.25);
        border-radius: 0.75rem;
        text-align: center;
        cursor: pointer;
        background: rgba(0, 0, 0, 0.03);
    }

    .dropzone.active {
        border-color: #2563eb;
        background: rgba(37, 99, 235, 0.08);
    }

    .dropzone input {
        display: none;
    }

    .dropzone-text {
        font-weight: 600;
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

    .success {
        background: rgba(21, 128, 61, 0.15);
        color: #15803d;
        border: 1px solid rgba(21, 128, 61, 0.4);
    }

    .status-error {
        color: #b91c1c;
    }
</style>
