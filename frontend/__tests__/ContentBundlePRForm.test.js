/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ContentBundlePRForm from '../src/components/svelte/ContentBundlePRForm.svelte';
import { submitBundlePR } from '../src/utils/submitBundlePR.js';

jest.mock('../src/utils/submitBundlePR.js');

describe('ContentBundlePRForm', () => {
    beforeEach(() => {
        localStorage.clear();
        submitBundlePR.mockReset();
    });

    test('loads token from localStorage on mount', () => {
        localStorage.setItem('gameState', JSON.stringify({ github: { token: 'abc123' } }));
        const { getByLabelText } = render(ContentBundlePRForm);
        expect(getByLabelText('GitHub Token*').value).toBe('abc123');
    });

    test('clears token from component and storage', async () => {
        localStorage.setItem('gameState', JSON.stringify({ github: { token: 'tok123' } }));
        const { getByLabelText, getByTestId } = render(ContentBundlePRForm);
        expect(getByLabelText('GitHub Token*').value).toBe('tok123');
        await fireEvent.click(getByTestId('clear-token'));
        expect(getByLabelText('GitHub Token*').value).toBe('');
        const state = JSON.parse(localStorage.getItem('gameState'));
        expect(state.github.token).toBe('');
    });

    test('saves token after successful submission', async () => {
        submitBundlePR.mockResolvedValue('https://example.com/pr');
        const { getByLabelText, getByText } = render(ContentBundlePRForm);
        const token = 'ghp_123456789012345678901234567890123456';
        await fireEvent.input(getByLabelText('GitHub Token*'), {
            target: { value: token },
        });
        const bundleJson = JSON.stringify({
            quests: [],
            items: [{ name: 'test' }],
            processes: [],
        });
        await fireEvent.input(getByLabelText('Bundle JSON*'), {
            target: { value: bundleJson },
        });
        await fireEvent.click(getByText('Create Pull Request'));
        await waitFor(() => expect(submitBundlePR).toHaveBeenCalled());
        const state = JSON.parse(localStorage.getItem('gameState'));
        expect(state.github.token).toBe(token);
    });

    test('validates bundle contains at least one content type', async () => {
        const { getByLabelText, getByText, getByTestId } = render(ContentBundlePRForm);
        await fireEvent.input(getByLabelText('GitHub Token*'), {
            target: { value: 'ghp_123456789012345678901234567890123456' },
        });
        await fireEvent.input(getByLabelText('Bundle JSON*'), {
            target: { value: '{}' },
        });
        await fireEvent.click(getByText('Create Pull Request'));
        await waitFor(() => expect(getByTestId('bundle-json-error')).toBeInTheDocument());
        expect(getByTestId('bundle-json-error').textContent).toContain('at least one');
    });

    test('validates JSON format', async () => {
        const { getByLabelText, getByText, getByTestId } = render(ContentBundlePRForm);
        await fireEvent.input(getByLabelText('GitHub Token*'), {
            target: { value: 'ghp_123456789012345678901234567890123456' },
        });
        await fireEvent.input(getByLabelText('Bundle JSON*'), {
            target: { value: 'invalid json' },
        });
        await fireEvent.click(getByText('Create Pull Request'));
        await waitFor(() => expect(getByTestId('bundle-json-error')).toBeInTheDocument());
        expect(getByTestId('bundle-json-error').textContent).toContain('Invalid JSON');
    });
});
