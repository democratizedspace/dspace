import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, expect, it, vi } from 'vitest';
import Importer from '../svelte/Importer.svelte';
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
