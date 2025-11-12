/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ProcessPRForm from '../src/components/svelte/ProcessPRForm.svelte';
import { submitProcessPR } from '../src/utils/submitProcessPR.js';

jest.mock('../src/utils/submitProcessPR.js');

describe('ProcessPRForm token handling', () => {
    beforeEach(() => {
        localStorage.clear();
        submitProcessPR.mockReset();
    });

    test('loads token from localStorage on mount', () => {
        localStorage.setItem('gameState', JSON.stringify({ github: { token: 'abc123' } }));
        const { getByLabelText } = render(ProcessPRForm);
        expect(getByLabelText('GitHub Token*').value).toBe('abc123');
    });

    test('clears token from component and storage', async () => {
        localStorage.setItem('gameState', JSON.stringify({ github: { token: 'tok123' } }));
        const { getByLabelText, getByTestId } = render(ProcessPRForm);
        expect(getByLabelText('GitHub Token*').value).toBe('tok123');
        await fireEvent.click(getByTestId('clear-token'));
        expect(getByLabelText('GitHub Token*').value).toBe('');
        const state = JSON.parse(localStorage.getItem('gameState'));
        expect(state.github.token).toBe('');
    });

    test('saves token after successful submission', async () => {
        submitProcessPR.mockResolvedValue('https://example.com/pr');
        const { getByLabelText, getByText } = render(ProcessPRForm);
        const token = 'ghp_123456789012345678901234567890123456';
        await fireEvent.input(getByLabelText('GitHub Token*'), {
            target: { value: token },
        });
        await fireEvent.input(getByLabelText('Process JSON*'), {
            target: { value: '{"name":"test-process"}' },
        });
        await fireEvent.click(getByText('Create Pull Request'));
        await waitFor(() => expect(submitProcessPR).toHaveBeenCalled());
        const state = JSON.parse(localStorage.getItem('gameState'));
        expect(state.github.token).toBe(token);
    });

    test('displays error for invalid token', async () => {
        const { getByLabelText, getByText, getByTestId } = render(ProcessPRForm);
        await fireEvent.input(getByLabelText('GitHub Token*'), {
            target: { value: 'invalid' },
        });
        await fireEvent.input(getByLabelText('Process JSON*'), {
            target: { value: '{"name":"test"}' },
        });
        await fireEvent.click(getByText('Create Pull Request'));
        await waitFor(() => expect(getByTestId('token-error')).toBeInTheDocument());
    });
});
