<script>
    import { onDestroy } from 'svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import ProgressBar from '../../../lib/components/ProgressBar.svelte';
    import { prepareCustomContentBackup } from '../../../lib/backup/customContentBackup.js';

    let assets = [];
    let backupBlob = null;
    let backupFilename = '';
    let errorMessage = '';
    let isPreparing = false;
    let statusMessage = '';

    const resetState = () => {
        assets = [];
        backupBlob = null;
        backupFilename = '';
        errorMessage = '';
        statusMessage = '';
    };

    const handlePrepareBackup = async () => {
        if (isPreparing) {
            return;
        }

        resetState();
        isPreparing = true;
        statusMessage = 'Preparing backup...';

        try {
            const result = await prepareCustomContentBackup({
                onProgress: (nextAssets) => {
                    assets = nextAssets;
                },
            });
            backupBlob = result.blob;
            backupFilename = result.filename;
            statusMessage = 'Backup is ready to download.';
        } catch (error) {
            errorMessage = error?.message ?? 'Failed to prepare the backup.';
            statusMessage = '';
        } finally {
            isPreparing = false;
        }
    };

    const handleDownloadBackup = () => {
        if (!backupBlob) {
            return;
        }
        const url = URL.createObjectURL(backupBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = backupFilename || 'dspace-custom-content-backup.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    onDestroy(() => {
        backupBlob = null;
    });
</script>

<Chip text="">
    <div class="vertical" data-hydrated="true">
        <h3>Export custom content</h3>
        <p>
            Generate a portable backup file for your custom quests, items, processes, and required
            images.
        </p>
        <Chip
            text="Prepare backup"
            on:click={handlePrepareBackup}
            inverted={true}
            disabled={isPreparing}
        />
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
        {#if backupBlob}
            <Chip text="Download backup" on:click={handleDownloadBackup} inverted={true} />
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
