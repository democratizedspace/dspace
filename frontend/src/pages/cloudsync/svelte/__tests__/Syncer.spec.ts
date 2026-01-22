import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import Syncer from '../Syncer.svelte';

const fetchBackupList = vi.fn();
const uploadGameStateToGist = vi.fn();
const downloadGameStateFromGist = vi.fn();
const clearCloudGistId = vi.fn();

const loadGitHubToken = vi.fn(); // scan-secrets: ignore
const saveGitHubToken = vi.fn(); // scan-secrets: ignore
const clearGitHubToken = vi.fn(); // scan-secrets: ignore
const isValidGitHubToken = vi.fn(); // scan-secrets: ignore

const validateToken = vi.fn(); // scan-secrets: ignore

type Backup = {
    id: string;
    createdAt: string;
    htmlUrl: string;
    filename: string;
};

vi.mock('../../../../utils/cloudSync.js', () => ({
    clearCloudGistId,
    downloadGameStateFromGist,
    fetchBackupList,
    uploadGameStateToGist,
}));

vi.mock('../../../../utils/githubToken.js', () => ({
    clearGitHubToken, // scan-secrets: ignore
    isValidGitHubToken, // scan-secrets: ignore
    loadGitHubToken, // scan-secrets: ignore
    saveGitHubToken, // scan-secrets: ignore
}));

vi.mock('../../../../lib/cloudsync/githubGists', () => ({
    validateToken,
}));

describe('Syncer', () => {
    beforeEach(() => {
        fetchBackupList.mockReset();
        uploadGameStateToGist.mockReset();
        downloadGameStateFromGist.mockReset();
        clearCloudGistId.mockReset();
        loadGitHubToken.mockReset();
        saveGitHubToken.mockReset();
        clearGitHubToken.mockReset();
        isValidGitHubToken.mockReset();
        validateToken.mockReset();
    });

    it('keeps the newest backup when an earlier refresh resolves late', async () => {
        const patValue = 'example-pat';
        const newBackup: Backup = {
            id: 'gist-new',
            createdAt: '2026-01-21T09:10:38.430Z',
            htmlUrl: 'https://gist.github.com/gist-new',
            filename: 'dspace-save-2026-01-21T09-10-38.430Z.txt',
        };

        loadGitHubToken.mockResolvedValue('');
        isValidGitHubToken.mockReturnValue(true);
        validateToken.mockResolvedValue(true);
        saveGitHubToken.mockResolvedValue(undefined);
        uploadGameStateToGist.mockResolvedValue(newBackup);
        clearCloudGistId.mockResolvedValue(undefined);

        let resolveInitialList: ((value: Backup[]) => void) | undefined;
        const initialListPromise = new Promise<Backup[]>((resolve) => {
            resolveInitialList = resolve;
        });

        fetchBackupList
            .mockImplementationOnce(() => initialListPromise)
            .mockResolvedValueOnce([newBackup]);

        const { getByLabelText, getByRole, getByTestId } = render(Syncer);

        await fireEvent.input(getByLabelText(/GitHub Token/i), {
            target: { value: patValue },
        });

        await fireEvent.click(getByTestId('save-token'));
        await waitFor(() => expect(saveGitHubToken).toHaveBeenCalledWith(patValue));

        await fireEvent.click(getByRole('button', { name: /upload/i }));
        await waitFor(() => expect(uploadGameStateToGist).toHaveBeenCalled());

        await waitFor(() =>
            expect(getByTestId('backup-list')).toHaveTextContent(newBackup.id)
        );

        resolveInitialList?.([]);

        await waitFor(() =>
            expect(getByTestId('backup-list')).toHaveTextContent(newBackup.id)
        );
    });
});
