import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Syncer from '../svelte/Syncer.svelte';

const loadGitHubTokenMock = vi.fn();
const saveGitHubTokenMock = vi.fn();
const clearGitHubTokenMock = vi.fn();
const clearCloudGistIdMock = vi.fn();
const fetchBackupListMock = vi.fn();
const validateTokenMock = vi.fn();

vi.mock('../../../utils/githubToken.js', () => ({
    ['clearGitHubToken']: (...args: unknown[]) => clearGitHubTokenMock(...args),
    ['isValidGitHubToken']: (candidate?: string) =>
        /^gh[pousr]_[A-Za-z0-9_]{36,}$/i.test(candidate ?? ''),
    ['loadGitHubToken']: (...args: unknown[]) => loadGitHubTokenMock(...args),
    ['saveGitHubToken']: (...args: unknown[]) => saveGitHubTokenMock(...args),
}));

vi.mock('../../../utils/cloudSync.js', () => ({
    clearCloudGistId: (...args: unknown[]) => clearCloudGistIdMock(...args),
    downloadGameStateFromGist: vi.fn(),
    fetchBackupList: (...args: unknown[]) => fetchBackupListMock(...args),
    uploadGameStateToGist: vi.fn(),
}));

vi.mock('../../../lib/cloudsync/githubGists', () => ({
    ['validateToken']: (...args: unknown[]) => validateTokenMock(...args),
}));

describe('Cloud Sync token save flow', () => {
    beforeEach(() => {
        loadGitHubTokenMock.mockResolvedValue('');
        saveGitHubTokenMock.mockResolvedValue(undefined);
        clearGitHubTokenMock.mockResolvedValue(undefined);
        clearCloudGistIdMock.mockResolvedValue(undefined);
        fetchBackupListMock.mockResolvedValue([]);
        validateTokenMock.mockResolvedValue(true);
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete (window as typeof window & { __cloudSyncReady?: boolean }).__cloudSyncReady;
    });

    it('waits for initialization before Save and preserves a token typed during startup', async () => {
        let resolveLoadedCredential: (credential: string) => void = () => {};
        loadGitHubTokenMock.mockReturnValue(
            new Promise<string>((resolve) => {
                resolveLoadedCredential = resolve;
            })
        );

        const { getByLabelText, getByTestId } = render(Syncer);
        const tokenInput = getByLabelText(/GitHub Token/i) as HTMLInputElement;
        const saveButton = getByTestId('save-token');
        const typedCredential = `ghp_${'a'.repeat(36)}`;

        await fireEvent.input(tokenInput, { target: { value: typedCredential } });
        expect(saveButton).toBeDisabled();

        resolveLoadedCredential('');

        await waitFor(() => expect(saveButton).toBeEnabled());
        expect(tokenInput).toHaveValue(typedCredential);
        expect(fetchBackupListMock).not.toHaveBeenCalled();

        await fireEvent.click(saveButton);

        await waitFor(() => {
            expect(getByTestId('sync-success')).toHaveTextContent('Token saved and validated');
        });
        expect(validateTokenMock).toHaveBeenCalledWith(typedCredential);
        expect(saveGitHubTokenMock).toHaveBeenCalledWith(typedCredential);
    });
});
