/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ItemPRForm from '../src/components/svelte/ItemPRForm.svelte';
import { submitItemPR } from '../src/utils/submitItemPR.js';

jest.mock('../src/utils/submitItemPR.js');

describe('ItemPRForm token handling', () => {
    beforeEach(() => {
        localStorage.clear();
        submitItemPR.mockReset();
    });

    test('loads token from localStorage on mount', () => {
        localStorage.setItem('gameState', JSON.stringify({ github: { token: 'abc123' } }));
        const { getByLabelText } = render(ItemPRForm);
        expect(getByLabelText('GitHub Token*').value).toBe('abc123');
    });

    test('clears token from component and storage', async () => {
        localStorage.setItem('gameState', JSON.stringify({ github: { token: 'tok123' } }));
        const { getByLabelText, getByTestId } = render(ItemPRForm);
        expect(getByLabelText('GitHub Token*').value).toBe('tok123');
        await fireEvent.click(getByTestId('clear-token'));
        expect(getByLabelText('GitHub Token*').value).toBe('');
        const state = JSON.parse(localStorage.getItem('gameState'));
        expect(state.github.token).toBe('');
    });

    test('saves token after successful submission', async () => {
        submitItemPR.mockResolvedValue('https://example.com/pr');
        const { getByLabelText, getByText } = render(ItemPRForm);
        const token = 'ghp_123456789012345678901234567890123456';
        await fireEvent.input(getByLabelText('GitHub Token*'), {
            target: { value: token },
        });
        await fireEvent.input(getByLabelText('Item JSON*'), {
            target: { value: '{"name":"test-item"}' },
        });
        await fireEvent.click(getByText('Create Pull Request'));
        await waitFor(() => expect(submitItemPR).toHaveBeenCalled());
        const state = JSON.parse(localStorage.getItem('gameState'));
        expect(state.github.token).toBe(token);
    });

    test('displays error for invalid token', async () => {
        const { getByLabelText, getByText, getByTestId } = render(ItemPRForm);
        await fireEvent.input(getByLabelText('GitHub Token*'), {
            target: { value: 'invalid' },
        });
        await fireEvent.input(getByLabelText('Item JSON*'), {
            target: { value: '{"name":"test"}' },
        });
        await fireEvent.click(getByText('Create Pull Request'));
        await waitFor(() => expect(getByTestId('token-error')).toBeInTheDocument());
    });
});
