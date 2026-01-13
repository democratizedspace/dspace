<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import ProgressBar from '../../../lib/components/ProgressBar.svelte';
    import { importCustomContentBackupFile } from '../../../lib/backup/customContentBackup.js';

    let assets = [];
    let errorMessage = '';
    let isDragging = false;
    let isImporting = false;
    let statusMessage = '';
    let selectedFileName = '';

    const resetState = () => {
        assets = [];
        errorMessage = '';
        statusMessage = '';
        selectedFileName = '';
    };

    const handleFileImport = async (file) => {
        if (!file || isImporting) {
            return;
        }
        resetState();
        selectedFileName = file.name;
        isImporting = true;
        statusMessage = 'Importing backup...';

        try {
            const result = await importCustomContentBackupFile(file, {
                onProgress: (nextAssets) => {
                    assets = nextAssets;
                },
            });
            statusMessage =
                `Imported ${result.counts.items} items, ` +
                `${result.counts.processes} processes, and ${result.counts.quests} quests.`;
        } catch (error) {
            errorMessage = error?.message ?? 'Failed to import backup.';
            statusMessage = '';
        } finally {
            isImporting = false;
        }
    };

    const handleInputChange = (event) => {
        const file = event.currentTarget.files?.[0];
        if (file) {
            handleFileImport(file);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        isDragging = true;
    };

    const handleDragLeave = () => {
        isDragging = false;
    };

    const handleDrop = (event) => {
        event.preventDefault();
        isDragging = false;
        const file = event.dataTransfer?.files?.[0];
        if (file) {
            handleFileImport(file);
        } else {
            errorMessage = 'Drop a valid backup file to import.';
        }
    };
</script>

<Chip text="">
    <div class="vertical" data-hydrated="true">
        <h3>Import custom content</h3>
        <p>Drag & drop your backup file, or click to browse.</p>
        <label
            class={`dropzone ${isDragging ? 'dragging' : ''}`}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={handleDrop}
        >
            <input
                type="file"
                accept=".json"
                on:change={handleInputChange}
                aria-label="Upload custom content backup"
            />
            <span>{selectedFileName || 'Drop backup file here or click to browse'}</span>
        </label>
        {#if statusMessage}
            <p class="status" role="status">{statusMessage}</p>
        {/if}
        {#if errorMessage}
            <div class="banner error" role="alert">{errorMessage}</div>
        {/if}
        {#if assets.length > 0}
            <ul class="asset-list">
                {#each assets as asset}
                    <li>
                        <div class="asset-row">
                            <span>{asset.label}</span>
                            <span class="asset-progress">{asset.progress}%</span>
                        </div>
                        <ProgressBar progress={asset.progress} />
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</Chip>

<style>
    h3 {
        margin: 0;
    }

    p {
        font-weight: normal;
        margin: 0.5rem 0;
    }

    .status {
        color: #1e4e19;
        font-weight: 600;
    }

    .banner {
        border-radius: 8px;
        padding: 0.75rem;
        width: 100%;
    }

    .error {
        background: #ffe5e5;
        color: #8a1f1f;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
    }

    .dropzone {
        border: 2px dashed #6aa36a;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        cursor: pointer;
        background: #f6fff6;
        color: #1e4e19;
        transition: background 0.2s ease, border-color 0.2s ease;
    }

    .dropzone.dragging {
        border-color: #1e4e19;
        background: #e5ffe5;
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
        gap: 0.75rem;
    }

    .asset-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.95rem;
        margin-bottom: 0.25rem;
    }

    .asset-progress {
        color: #2f6b2c;
        font-variant-numeric: tabular-nums;
    }
</style>
