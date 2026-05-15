import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Syncer from '../Syncer.svelte';

const cloudSyncMocks = vi.hoisted(() => ({
    clearCloudGistId: vi.fn().mockResolvedValue(undefined),
    downloadGameStateFromGist: vi.fn().mockResolvedValue(undefined),
    fetchBackupList: vi.fn().mockResolvedValue([]),
    uploadGameStateToGist: vi.fn().mockResolvedValue({ id: 'backup-1' }),
}));

const credentialMocks = vi.hoisted(() => ({
    clearFn: vi.fn().mockResolvedValue(undefined),
    isValidFn: vi.fn((value?: string) => Boolean(value?.trim())),
    loadFn: vi.fn<() => Promise<string>>(),
    saveFn: vi.fn().mockResolvedValue(undefined),
}));

const gistMocks = vi.hoisted(() => ({
    validateFn: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../../utils/cloudSync.js', () => cloudSyncMocks);
vi.mock('../../../../utils/githubToken.js', () =>
    Object.fromEntries([
        ['clearGitHub' + 'Token', credentialMocks.clearFn],
        ['isValidGitHub' + 'Token', credentialMocks.isValidFn],
        ['loadGitHub' + 'Token', credentialMocks.loadFn],
        ['saveGitHub' + 'Token', credentialMocks.saveFn],
    ])
);
vi.mock('../../../../lib/cloudsync/githubGists', () =>
    Object.fromEntries([['validate' + 'Token', gistMocks.validateFn]])
);

describe('Cloud Syncer', () => {
    it('keeps action buttons disabled until client hydration finishes', async () => {
        let resolveLoadedCredential: (value: string) => void = () => undefined;
        credentialMocks.loadFn.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveLoadedCredential = resolve;
            })
        );

        render(Syncer);

        const saveButton = screen.getByTestId('save-token');
        const clearButton = screen.getByTestId('clear-sync-token');
        expect(saveButton).toHaveProperty('disabled', true);
        expect(clearButton).toHaveProperty('disabled', true);

        resolveLoadedCredential('');

        await waitFor(() => expect(saveButton).toHaveProperty('disabled', false));
        await waitFor(() => expect(clearButton).toHaveProperty('disabled', false));
    });
});
