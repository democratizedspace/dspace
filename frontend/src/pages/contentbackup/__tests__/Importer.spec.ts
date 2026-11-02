import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, expect, it, vi } from 'vitest';
import Importer from '../svelte/Importer.svelte';
import { initializeCustomContentForImportUI } from '../../../utils/indexeddb.js';
const restore = vi.fn();
vi.mock('../../../utils/indexeddb.js', () => ({
    initializeCustomContentForImportUI: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../utils/customContentBackup.js', () => ({
    restoreCustomContentBackupFromFile: (...args: unknown[]) => restore(...args),
}));
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});
it('shows counts only after the committed progress event', async () => {
    let finish!: () => void;
    restore.mockImplementation(
        (_file, options) =>
            new Promise((resolve) => {
                finish = () => {
                    options.onProgress({
                        type: 'complete',
                        counts: { items: 2, processes: 1, quests: 0, images: 2 },
                    });
                    resolve({ message: 'Import complete' });
                };
            })
    );
    const view = render(Importer);
    await fireEvent.change(view.container.querySelector('input[type=file]')!, {
        target: { files: [new File(['{}'], 'synthetic.json')] },
    });
    await waitFor(() => expect(restore).toHaveBeenCalledOnce());
    expect(view.queryByText('items: 2')).toBeNull();
    finish();
    expect(await view.findByText('items: 2')).toBeInTheDocument();
    expect(view.getByText('processes: 1')).toBeInTheDocument();
    expect(view.getAllByText('Done')).toHaveLength(4);
});
it('does not display completed counts when the transaction fails', async () => {
    restore.mockRejectedValue(new Error('custom-conflict'));
    const view = render(Importer);
    await fireEvent.change(view.container.querySelector('input[type=file]')!, {
        target: { files: [new File(['{}'], 'synthetic.json')] },
    });
    expect(await view.findByText('custom-conflict')).toBeInTheDocument();
    expect(view.queryByText('Done')).toBeNull();
});

it('reports import readiness only after storage initializes and waits before restoring', async () => {
    let initialize!: () => void;
    vi.mocked(initializeCustomContentForImportUI).mockReturnValueOnce(
        new Promise<void>((resolve) => {
            initialize = resolve;
        })
    );
    restore.mockResolvedValue({ message: 'Import complete' });
    const view = render(Importer);
    const panel = view.getByTestId('contentbackup-import');
    await waitFor(() => expect(panel).toHaveAttribute('data-hydrated', 'true'));
    expect(panel).toHaveAttribute('data-import-ready', 'false');

    await fireEvent.change(view.container.querySelector('input[type=file]')!, {
        target: { files: [new File(['{}'], 'synthetic.json')] },
    });
    expect(restore).not.toHaveBeenCalled();

    initialize();
    await waitFor(() => expect(panel).toHaveAttribute('data-import-ready', 'true'));
    await waitFor(() => expect(restore).toHaveBeenCalledOnce());
});

it('never reports import readiness or restores when storage initialization fails', async () => {
    vi.mocked(initializeCustomContentForImportUI).mockRejectedValueOnce(
        new Error('storage failed')
    );
    const view = render(Importer);
    const panel = view.getByTestId('contentbackup-import');
    await waitFor(() => expect(panel).toHaveAttribute('data-hydrated', 'true'));
    await fireEvent.change(view.container.querySelector('input[type=file]')!, {
        target: { files: [new File(['{}'], 'synthetic.json')] },
    });
    expect(
        await view.findByText('Import storage is unavailable. Reload and try again.')
    ).toBeInTheDocument();
    expect(panel).toHaveAttribute('data-import-ready', 'false');
    expect(restore).not.toHaveBeenCalled();
});
