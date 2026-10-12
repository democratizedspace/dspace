import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LogoutPanel from '../svelte/LogoutPanel.svelte';
import QuestPRForm from '../svelte/QuestPRForm.svelte';
import ContentBundlePRForm from '../svelte/ContentBundlePRForm.svelte';

const loadToken = vi.fn();
const clearToken = vi.fn();
const loadGist = vi.fn();
const clearGist = vi.fn();
const saveToken = vi.fn();
const submitQuest = vi.fn();
const submitBundle = vi.fn();
vi.mock('../../utils/githubToken.js', () => ({
    loadGitHubToken: (...args: unknown[]) => loadToken(...args),
    clearGitHubToken: (...args: unknown[]) => clearToken(...args),
    saveGitHubToken: (...args: unknown[]) => saveToken(...args),
    isValidGitHubToken: () => true,
}));
vi.mock('../../utils/cloudSync.js', () => ({
    loadCloudGistId: (...args: unknown[]) => loadGist(...args),
    clearCloudGistId: (...args: unknown[]) => clearGist(...args),
}));
vi.mock('../../utils/submitQuestPR.js', () => ({
    submitQuestPR: (...args: unknown[]) => submitQuest(...args),
}));
vi.mock('../../utils/submitBundlePR.js', () => ({
    submitBundlePR: (...args: unknown[]) => submitBundle(...args),
}));

beforeEach(() => {
    vi.resetAllMocks();
    loadToken.mockResolvedValue('');
    loadGist.mockResolvedValue('');
    clearToken.mockResolvedValue(undefined);
    clearGist.mockResolvedValue(undefined);
});
afterEach(cleanup);

for (const failure of ['credential-stale', 'storage unavailable']) {
    describe(`credential loading rejects: ${failure}`, () => {
        it('finishes logout hydration with unknown status and permits deliberate Clear', async () => {
            let rejectLoad!: (reason: Error) => void;
            loadToken.mockReturnValue(
                new Promise((_resolve, reject) => {
                    rejectLoad = reject;
                })
            );
            const view = render(LogoutPanel);
            expect(view.container.firstElementChild).toHaveAttribute('data-hydrated', 'false');
            rejectLoad(new Error(failure));
            await waitFor(() =>
                expect(view.container.firstElementChild).toHaveAttribute('data-hydrated', 'true')
            );
            expect(view.getByRole('alert')).toHaveTextContent('Unable to load saved credentials');
            expect(view.getByTestId('logout-state')).toHaveTextContent('status is unavailable');
            expect(loadGist).not.toHaveBeenCalled();
            expect(clearToken).not.toHaveBeenCalled();
            await fireEvent.click(view.getByRole('button', { name: 'Log out' }));
            await waitFor(() =>
                expect(view.getByRole('status')).toHaveTextContent('Credentials cleared')
            );
            expect(clearToken).toHaveBeenCalledOnce();
            expect(clearGist).toHaveBeenCalledOnce();
            expect(view.getByTestId('logout-state')).toHaveTextContent(
                'No saved credentials detected'
            );
        });

        for (const [name, component] of [
            ['quest', QuestPRForm],
            ['bundle', ContentBundlePRForm],
        ] as const) {
            it(`finishes ${name} hydration with an empty token and a handled error`, async () => {
                loadToken.mockRejectedValue(new Error(failure));
                const view = render(component, { token: 'synthetic-stale-token' });
                await waitFor(() =>
                    expect(view.container.querySelector('form')).toHaveAttribute(
                        'data-hydrated',
                        'true'
                    )
                );
                expect(view.getByLabelText('GitHub Token*')).toHaveValue('');
                expect(view.getByTestId('submit-error')).toHaveTextContent(
                    'Unable to load the saved GitHub token'
                );
                expect(saveToken).not.toHaveBeenCalled();
                expect(clearToken).not.toHaveBeenCalled();
                expect(submitQuest).not.toHaveBeenCalled();
                expect(submitBundle).not.toHaveBeenCalled();
            });
        }
    });
}

it('handles logout gist loading failure without claiming credentials are absent', async () => {
    loadToken.mockResolvedValue('synthetic-token');
    loadGist.mockRejectedValue(new Error('storage unavailable'));
    const view = render(LogoutPanel);
    await waitFor(() =>
        expect(view.container.firstElementChild).toHaveAttribute('data-hydrated', 'true')
    );
    expect(view.getByRole('alert')).toHaveTextContent('Unable to load saved credentials');
    expect(view.getByTestId('logout-state')).toHaveTextContent('status is unavailable');
});

it('retains the ordinary loaded logout state', async () => {
    loadToken.mockResolvedValue('synthetic-token');
    const view = render(LogoutPanel);
    await waitFor(() =>
        expect(view.container.firstElementChild).toHaveAttribute('data-hydrated', 'true')
    );
    expect(view.getByTestId('logout-state')).toHaveTextContent('Credentials stored');
    expect(view.queryByRole('alert')).toBeNull();
});

for (const [name, component, jsonLabel, submission] of [
    ['quest', QuestPRForm, 'Quest JSON*', submitQuest],
    ['bundle', ContentBundlePRForm, 'Bundle JSON*', submitBundle],
] as const) {
    describe(`${name} credential actions after hydration`, () => {
        it('saves and submits the same normalized token after loading', async () => {
            loadToken.mockResolvedValue('  synthetic-token  ');
            submission.mockResolvedValue('https://example.invalid/pr/1');
            const view = render(component);
            await waitFor(() =>
                expect(view.container.querySelector('form')).toHaveAttribute(
                    'data-hydrated',
                    'true'
                )
            );
            expect(view.getByLabelText('GitHub Token*')).toHaveValue('  synthetic-token  ');
            await fireEvent.input(view.getByLabelText(jsonLabel), {
                target: { value: '{"quests":[]}' },
            });
            await fireEvent.submit(view.container.querySelector('form')!);
            await waitFor(() =>
                expect(submission).toHaveBeenCalledWith('synthetic-token', '', '{"quests":[]}')
            );
            expect(saveToken).toHaveBeenCalledWith('synthetic-token');
            expect(view.getByTestId('pr-success')).toHaveTextContent('Pull request created');
        });

        it('clears the draft and handles an incomplete deliberate Clear', async () => {
            loadToken.mockResolvedValue('synthetic-token');
            clearToken.mockRejectedValue(new Error('incomplete'));
            const view = render(component);
            await waitFor(() =>
                expect(view.container.querySelector('form')).toHaveAttribute(
                    'data-hydrated',
                    'true'
                )
            );
            await fireEvent.click(view.getByTestId('clear-token'));
            await waitFor(() =>
                expect(view.getByTestId('submit-error')).toHaveTextContent(
                    'Credential clear incomplete'
                )
            );
            expect(view.getByLabelText('GitHub Token*')).toHaveValue('');
            expect(clearToken).toHaveBeenCalledOnce();
            expect(saveToken).not.toHaveBeenCalled();
            expect(submission).not.toHaveBeenCalled();
        });

        it('clears the draft only for a GitHub Clear notice', async () => {
            loadToken.mockResolvedValue('synthetic-token');
            const view = render(component);
            await waitFor(() =>
                expect(view.container.querySelector('form')).toHaveAttribute(
                    'data-hydrated',
                    'true'
                )
            );
            await fireEvent(
                window,
                new CustomEvent('dspace-credential-cleared', { detail: { kind: 'openai' } })
            );
            expect(view.getByLabelText('GitHub Token*')).toHaveValue('synthetic-token');
            await fireEvent(
                window,
                new CustomEvent('dspace-credential-cleared', { detail: { kind: 'github' } })
            );
            expect(view.getByLabelText('GitHub Token*')).toHaveValue('');
            expect(clearToken).not.toHaveBeenCalled();
            expect(saveToken).not.toHaveBeenCalled();
        });
    });
}

for (const [name, component] of [
    ['quest', QuestPRForm],
    ['bundle', ContentBundlePRForm],
] as const) {
    for (const fails of [false, true]) {
        it(`blocks ${name} token editing and submission until ${fails ? 'failed' : 'successful'} loading finishes`, async () => {
            let resolveLoad!: (value: string) => void;
            let rejectLoad!: (reason: Error) => void;
            loadToken.mockReturnValue(
                new Promise<string>((resolve, reject) => {
                    resolveLoad = resolve;
                    rejectLoad = reject;
                })
            );
            const view = render(component);
            const input = view.getByLabelText('GitHub Token*');
            expect(input).toBeDisabled();
            expect(view.getByTestId('clear-token')).toBeDisabled();
            expect(view.getByRole('button', { name: 'Create Pull Request' })).toBeDisabled();
            expect(view.getByRole('status')).toHaveTextContent('Loading saved credential');
            await fireEvent.submit(view.container.querySelector('form')!);
            expect(saveToken).not.toHaveBeenCalled();
            expect(submitQuest).not.toHaveBeenCalled();
            expect(submitBundle).not.toHaveBeenCalled();
            if (fails) rejectLoad(new Error('credential-stale'));
            else resolveLoad('synthetic-saved-token');
            await waitFor(() => expect(input).toBeEnabled());
            expect(view.getByTestId('clear-token')).toBeEnabled();
            expect(view.getByRole('button', { name: 'Create Pull Request' })).toBeEnabled();
            expect(view.queryByRole('status')).toBeNull();
            expect(input).toHaveValue(fails ? '' : 'synthetic-saved-token');
            await fireEvent.input(input, { target: { value: 'synthetic-replacement-token' } });
            expect(input).toHaveValue('synthetic-replacement-token');
        });
    }
}
