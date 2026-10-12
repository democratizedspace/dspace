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
const initializeCustomMock = vi.fn();
const downloadMock = vi.fn();
vi.mock('../../../utils/indexeddb.js', () => ({
    initializeCustomContentForImportUI: (...args: unknown[]) => initializeCustomMock(...args),
}));

vi.mock('../../../utils/githubToken.js', () => ({
    ['clearGitHubToken']: (...args: unknown[]) => clearGitHubTokenMock(...args),
    ['isValidGitHubToken']: (candidate?: string) =>
        /^gh[pousr]_[A-Za-z0-9_]{36,}$/i.test(candidate ?? ''),
    ['loadGitHubToken']: (...args: unknown[]) => loadGitHubTokenMock(...args),
    ['saveGitHubToken']: (...args: unknown[]) => saveGitHubTokenMock(...args),
}));

vi.mock('../../../utils/cloudSync.js', () => ({
    clearCloudGistId: (...args: unknown[]) => clearCloudGistIdMock(...args),
    downloadGameStateFromGist: (...args: unknown[]) => downloadMock(...args),
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
        initializeCustomMock.mockResolvedValue(undefined);
        downloadMock.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete (window as typeof window & { __cloudSyncReady?: boolean }).__cloudSyncReady;
    });

    it('resets the global readiness flag on remount until the current startup finishes', async () => {
        const cloudSyncWindow = window as typeof window & { __cloudSyncReady?: boolean };
        let resolveLoadedCredential: (credential: string) => void = () => {};
        loadGitHubTokenMock.mockReturnValue(
            new Promise<string>((resolve) => {
                resolveLoadedCredential = resolve;
            })
        );
        cloudSyncWindow.__cloudSyncReady = true;

        const { getByTestId, unmount } = render(Syncer);

        expect(cloudSyncWindow.__cloudSyncReady).toBe(false);
        expect(getByTestId('save-token')).toBeDisabled();

        resolveLoadedCredential('');
        await waitFor(() => expect(cloudSyncWindow.__cloudSyncReady).toBe(true));

        unmount();
        expect(cloudSyncWindow.__cloudSyncReady).toBe(false);
    });

    it('enables the form and marks readiness when startup storage fails', async () => {
        const cloudSyncWindow = window as typeof window & { __cloudSyncReady?: boolean };
        loadGitHubTokenMock.mockRejectedValue(new Error('storage unavailable'));

        const { getByTestId } = render(Syncer);

        await waitFor(() => expect(getByTestId('save-token')).toBeEnabled());
        expect(cloudSyncWindow.__cloudSyncReady).toBe(true);
        expect(getByTestId('sync-error')).toHaveTextContent('storage unavailable');
    });

    it('marks readiness before the saved-token backup refresh completes', async () => {
        const cloudSyncWindow = window as typeof window & { __cloudSyncReady?: boolean };
        const savedCredential = `ghp_${'b'.repeat(36)}`;
        loadGitHubTokenMock.mockResolvedValue(savedCredential);
        fetchBackupListMock.mockReturnValue(new Promise(() => {}));

        const { getByLabelText, getByTestId } = render(Syncer);
        const tokenInput = getByLabelText(/GitHub Token/i) as HTMLInputElement;

        await waitFor(() => expect(getByTestId('save-token')).toBeEnabled());
        expect(cloudSyncWindow.__cloudSyncReady).toBe(true);
        expect(tokenInput).toHaveValue(savedCredential);
        expect(fetchBackupListMock).toHaveBeenCalledWith(savedCredential);
    });

    it('ignores stale startup backup results after saving a different token', async () => {
        const savedCredential = `ghp_${'b'.repeat(36)}`;
        const newCredential = `ghp_${'c'.repeat(36)}`;
        let resolveSavedBackups: (backups: unknown[]) => void = () => {};
        let resolveNewBackups: (backups: unknown[]) => void = () => {};
        loadGitHubTokenMock.mockResolvedValue(savedCredential);
        fetchBackupListMock.mockImplementation((requestedToken: string) => {
            if (requestedToken === savedCredential) {
                return new Promise((resolve) => {
                    resolveSavedBackups = resolve;
                });
            }
            if (requestedToken === newCredential) {
                return new Promise((resolve) => {
                    resolveNewBackups = resolve;
                });
            }
            return Promise.resolve([]);
        });

        const { getByLabelText, getByTestId, queryByTestId } = render(Syncer);
        const tokenInput = getByLabelText(/GitHub Token/i) as HTMLInputElement;
        const saveButton = getByTestId('save-token');

        await waitFor(() => expect(saveButton).toBeEnabled());
        await waitFor(() => expect(fetchBackupListMock).toHaveBeenCalledWith(savedCredential));

        await fireEvent.input(tokenInput, { target: { value: newCredential } });
        await fireEvent.click(saveButton);

        await waitFor(() => expect(fetchBackupListMock).toHaveBeenCalledWith(newCredential));
        resolveNewBackups([
            {
                id: 'new-backup',
                filename: 'New token backup',
                htmlUrl: 'https://example.com/new',
                createdAt: '2026-05-15T00:00:00.000Z',
            },
        ]);

        await waitFor(() => expect(getByTestId('backup-link-new-backup')).toBeInTheDocument());
        resolveSavedBackups([
            {
                id: 'saved-backup',
                filename: 'Saved token backup',
                htmlUrl: 'https://example.com/saved',
                createdAt: '2026-05-14T00:00:00.000Z',
            },
        ]);

        await waitFor(() => expect(getByTestId('backup-link-new-backup')).toBeInTheDocument());
        expect(queryByTestId('backup-link-saved-backup')).not.toBeInTheDocument();
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
    it.each(['clear-incomplete', 'clear-not-started'])(
        'reports %s and permits a Clear retry',
        async (code) => {
            clearGitHubTokenMock.mockRejectedValueOnce(new Error(code));
            const { getByTestId } = render(Syncer);
            const clear = getByTestId('clear-sync-token');
            await waitFor(() => expect(clear).toBeEnabled());
            await fireEvent.click(clear);
            await waitFor(() =>
                expect(getByTestId('sync-error')).toHaveTextContent(
                    'managed token copies may remain. Retry Clear.'
                )
            );
            expect(clear).toBeEnabled();
            await fireEvent.click(clear);
            await waitFor(() =>
                expect(getByTestId('sync-success')).toHaveTextContent('GitHub token cleared')
            );
            expect(clearGitHubTokenMock).toHaveBeenCalledTimes(2);
        }
    );

    it.each(['credential-unavailable', 'validation failed', 'network unavailable'])(
        'preserves a newer saved token when older validation rejects: %s',
        async (code) => {
            const tokenA = `ghp_${'a'.repeat(36)}`;
            const tokenB = `ghp_${'b'.repeat(36)}`;
            let durableToken = '';
            let rejectValidation!: (reason: { code: string }) => void;
            saveGitHubTokenMock.mockImplementation(async (value: string) => {
                durableToken = value;
            });
            clearGitHubTokenMock.mockImplementation(async () => {
                durableToken = '';
            });
            validateTokenMock.mockReturnValue(
                new Promise((_resolve, reject) => {
                    rejectValidation = reject;
                })
            );
            const { getByLabelText, getByTestId } = render(Syncer);
            await waitFor(() => expect(getByTestId('save-token')).toBeEnabled());
            await fireEvent.input(getByLabelText(/GitHub Token/i), { target: { value: tokenA } });
            await fireEvent.click(getByTestId('save-token'));
            await waitFor(() => expect(validateTokenMock).toHaveBeenCalledWith(tokenA));
            expect(durableToken).toBe(tokenA);
            // Simulate another tab's successful Save before A's validation settles.
            durableToken = tokenB;
            rejectValidation({ code });
            await waitFor(() =>
                expect(getByTestId('sync-error')).toHaveTextContent(
                    'Saved credentials were not cleared'
                )
            );
            expect(durableToken).toBe(tokenB);
            expect(clearGitHubTokenMock).not.toHaveBeenCalled();
            expect(getByTestId('save-token')).toBeEnabled();
            expect(getByLabelText(/GitHub Token/i)).toHaveValue(tokenA);
            // Clear remains an explicit user action against current authority.
            await fireEvent.click(getByTestId('clear-sync-token'));
            await waitFor(() =>
                expect(getByTestId('sync-success')).toHaveTextContent('GitHub token cleared')
            );
            expect(durableToken).toBe('');
            expect(clearGitHubTokenMock).toHaveBeenCalledOnce();
        }
    );

    it('does not clear existing credentials when Save itself fails', async () => {
        saveGitHubTokenMock.mockRejectedValueOnce(new Error('storage unavailable'));
        const { getByLabelText, getByTestId } = render(Syncer);
        await waitFor(() => expect(getByTestId('save-token')).toBeEnabled());
        await fireEvent.input(getByLabelText(/GitHub Token/i), {
            target: { value: `ghp_${'s'.repeat(36)}` },
        });
        await fireEvent.click(getByTestId('save-token'));
        await waitFor(() =>
            expect(getByTestId('sync-error')).toHaveTextContent(
                'Saved credentials were not cleared'
            )
        );
        expect(clearGitHubTokenMock).not.toHaveBeenCalled();
        expect(validateTokenMock).not.toHaveBeenCalled();
        expect(getByTestId('save-token')).toBeEnabled();
    });
    it.each([false, true])(
        'delegates restore requirements to the parsed backup when custom storage fails (custom=%s)',
        async (custom) => {
            initializeCustomMock.mockRejectedValueOnce(
                new Error('synthetic custom storage unavailable')
            );
            if (custom) downloadMock.mockRejectedValueOnce(new Error('custom storage required'));
            const { getByLabelText, getByRole, getByTestId } = render(Syncer);
            const download = getByRole('button', { name: /^Download$/ });
            await waitFor(() => expect(download).toBeEnabled());
            await fireEvent.input(getByLabelText(/Gist ID/i), {
                target: { value: 'synthetic-backup-id' },
            });
            await fireEvent.click(download);
            await waitFor(() =>
                expect(downloadMock).toHaveBeenCalledWith('', 'synthetic-backup-id')
            );
            await waitFor(() =>
                expect(getByTestId(custom ? 'sync-error' : 'sync-success')).toHaveTextContent(
                    custom ? 'Restore failed' : 'Download successful'
                )
            );
        }
    );
    it('asks for reload after fallback without validating or clearing the durable token', async () => {
        saveGitHubTokenMock.mockRejectedValueOnce({ code: 'fallback-reload-required' });
        const { getByLabelText, getByTestId } = render(Syncer);
        await waitFor(() => expect(getByTestId('save-token')).toBeEnabled());
        await fireEvent.input(getByLabelText(/GitHub Token/i), {
            target: { value: `ghp_${'s'.repeat(36)}` },
        });
        await fireEvent.click(getByTestId('save-token'));
        await waitFor(() =>
            expect(getByTestId('sync-error')).toHaveTextContent(
                'Reload to reconcile saved progress, then retry Save.'
            )
        );
        expect(clearGitHubTokenMock).not.toHaveBeenCalled();
        expect(validateTokenMock).not.toHaveBeenCalled();
    });
    it('explains reload-required when restoring a combined backup in fallback mode', async () => {
        const message = 'Reload to reconcile saved progress before retrying this operation.';
        downloadMock.mockRejectedValueOnce({ code: 'fallback-reload-required', message });
        const { getByLabelText, getByRole, getByTestId } = render(Syncer);
        const download = getByRole('button', { name: /^Download$/ });
        await waitFor(() => expect(download).toBeEnabled());
        await fireEvent.input(getByLabelText(/Gist ID/i), {
            target: { value: 'synthetic-backup-id' },
        });
        await fireEvent.click(download);
        await waitFor(() => expect(getByTestId('sync-error')).toHaveTextContent(message));
    });
});
