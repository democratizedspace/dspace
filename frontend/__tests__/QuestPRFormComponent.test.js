/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import QuestPRForm from '../src/components/svelte/QuestPRForm.svelte';
import { submitQuestPR } from '../src/utils/submitQuestPR.js';

jest.mock('../src/utils/submitQuestPR.js');

describe('QuestPRForm token handling', () => {
    beforeEach(() => {
        localStorage.clear();
        submitQuestPR.mockReset();
    });

    test('loads token from localStorage on mount', () => {
        localStorage.setItem('gameState', JSON.stringify({ github: { token: 'abc123' } }));
        const { getByLabelText } = render(QuestPRForm);
        expect(getByLabelText('GitHub Token*').value).toBe('abc123');
    });

    test('clears token from component and storage', async () => {
        localStorage.setItem('gameState', JSON.stringify({ github: { token: 'tok123' } }));
        const { getByLabelText, getByTestId } = render(QuestPRForm);
        expect(getByLabelText('GitHub Token*').value).toBe('tok123');
        await fireEvent.click(getByTestId('clear-token'));
        expect(getByLabelText('GitHub Token*').value).toBe('');
        const state = JSON.parse(localStorage.getItem('gameState'));
        expect(state.github.token).toBe('');
    });

    test('saves token after successful submission', async () => {
        submitQuestPR.mockResolvedValue('https://example.com/pr');
        const { getByLabelText, getByText } = render(QuestPRForm);
        const token = 'ghp_123456789012345678901234567890123456';
        await fireEvent.input(getByLabelText('GitHub Token*'), {
            target: { value: token },
        });
        await fireEvent.input(getByLabelText('Quest JSON*'), {
            target: { value: '{"id":"q1"}' },
        });
        await fireEvent.click(getByText('Create Pull Request'));
        await waitFor(() => expect(submitQuestPR).toHaveBeenCalled());
        const state = JSON.parse(localStorage.getItem('gameState'));
        expect(state.github.token).toBe(token);
    });
});
