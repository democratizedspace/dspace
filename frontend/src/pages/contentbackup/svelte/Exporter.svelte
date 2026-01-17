<script>
    import { tick } from 'svelte';
    import Chip from '../../../components/svelte/Chip.svelte';
    import { buildCustomContentBackup } from '../../../utils/customContentBackup.js';

    let assets = [];
    let status = 'idle';
    let isPreparing = false;
    let errorMessage = '';
    let backupBlob = null;
    let backupFilename = '';
    let preparedSummary = null;

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

    const buildSummaryEntry = (kind, entity) => ({
        kind,
        name: entity?.title || entity?.name || entity?.id || 'Unknown',
    });

    const formatProgressLabel = (label) => {
        if (!label) {
            return 'Preparing asset';
        }

        const normalized = label
            .replace(/Item record:\s*/i, 'Item ')
            .replace(/Process record:\s*/i, 'Process ')
            .replace(/Quest record:\s*/i, 'Quest ')
            .replace(/Item:\s*/i, 'Item ')
            .replace(/Process:\s*/i, 'Process ')
            .replace(/Quest:\s*/i, 'Quest ')
            .replace(/:\s*/g, ' ');

        return `Preparing ${normalized}`.replace(/\s+/g, ' ').trim();
    };
    const handlePrepareBackup = async () => {
        if (isPreparing) {
            return;
        }

        const startedAt = Date.now();
        isPreparing = true;
        status = 'running';
        errorMessage = '';
        backupBlob = null;
        backupFilename = '';
        preparedSummary = null;
        assets = [];

        await tick();
        await new Promise((resolve) => {
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(() => resolve());
            } else {
                setTimeout(resolve, 0);
            }
        });

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
            preparedSummary = {
                items: result.data.items.map((item) => buildSummaryEntry('Item', item)),
                processes: result.data.processes.map((process) =>
                    buildSummaryEntry('Process', process)
                ),
                quests: result.data.quests.map((quest) => buildSummaryEntry('Quest', quest)),
            };
            assets = [];
            status = 'ready';
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errorMessage = message;
            status = 'error';
        } finally {
            const elapsed = Date.now() - startedAt;
            if (elapsed < 250) {
                await new Promise((resolve) => setTimeout(resolve, 250 - elapsed));
            }
            await tick();
            isPreparing = false;
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

<div class="panel">
    <section class="vertical" data-hydrated="true" data-testid="contentbackup-export">
        <h2>Export custom content</h2>
        <p>Prepare a downloadable backup of your custom quests, items, and processes.</p>
        <Chip
            text={isPreparing ? 'Preparing backup…' : 'Prepare backup'}
            onClick={handlePrepareBackup}
            inverted={true}
            disabled={isPreparing}
            dataTestId="contentbackup-prepare"
        />

        {#if status !== 'idle'}
            <div
                class="status-panel"
                data-testid={
                    status === 'running'
                        ? 'contentbackup-preparing'
                        : status === 'ready'
                          ? 'contentbackup-prepared'
                          : status === 'error'
                            ? 'contentbackup-error'
                            : undefined
                }
                aria-live="polite"
            >
                {#if status === 'running'}
                    <p class="status">Preparing backup…</p>
                    {#if assets.length > 0}
                        <div class="progress-list">
                            {#each assets as asset}
                                <div class="progress-item" data-status={asset.status}>
                                    <div class="progress-header">
                                        <span>{formatProgressLabel(asset.label)}</span>
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
                                        value={
                                            asset.status === 'done' || asset.status === 'error'
                                                ? 1
                                                : 0
                                        }
                                    />
                                </div>
                            {/each}
                        </div>
                    {/if}
                {/if}

                {#if status === 'error'}
                    <p class="status error" role="alert">{errorMessage}</p>
                {/if}

                {#if status === 'ready' && preparedSummary}
                    <div class="prepared-preview">
                        <h3>Prepared content</h3>
                        <ul>
                            {#each preparedSummary.items as entry}
                                <li class="summary-entry">{entry.kind}: {entry.name}</li>
                            {/each}
                            {#each preparedSummary.processes as entry}
                                <li class="summary-entry">{entry.kind}: {entry.name}</li>
                            {/each}
                            {#each preparedSummary.quests as entry}
                                <li class="summary-entry">{entry.kind}: {entry.name}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
        {/if}

        {#if status === 'ready'}
            <Chip text="Download backup" onClick={handleDownload} inverted={true} />
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

    .status-panel {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
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

    .prepared-preview {
        background-color: #f5f5f5;
        color: #000;
        padding: 0.75rem;
        border-radius: 0.75rem;
    }

    .prepared-preview h3 {
        margin: 0 0 0.5rem;
        font-size: 0.95rem;
    }

    .prepared-preview ul {
        margin: 0;
        padding-left: 1.2rem;
    }

    .summary-entry {
        font-weight: 600;
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
