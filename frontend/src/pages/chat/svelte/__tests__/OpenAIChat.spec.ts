import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

const makeQuotaError = () => {
    const error = new Error('insufficient_quota');
    // @ts-expect-error status is provided by SDK errors
    error.status = 429;
    return error;
};

const mockFns = vi.hoisted(() => ({
    describeOpenAIError: vi.fn(),
    GPT35Turbo: vi.fn(),
}));

vi.mock('../../../../utils/openAI.js', () => ({
    describeOpenAIError: mockFns.describeOpenAIError,
    GPT35Turbo: mockFns.GPT35Turbo,
}));

// Import after mocks to ensure the component uses the stubbed OpenAI module.
import OpenAIChat from '../OpenAIChat.svelte';

describe('OpenAIChat', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('shows a quota-specific message when OpenAI credits are exhausted', async () => {
        mockFns.GPT35Turbo.mockRejectedValueOnce(makeQuotaError());
        mockFns.describeOpenAIError.mockReturnValue(
            'OpenAI blocked the request because this API key has no remaining credits.'
        );

        render(OpenAIChat);

        const textarea = screen.getByRole('textbox');
        await fireEvent.input(textarea, { target: { value: 'Hello there' } });
        await fireEvent.click(screen.getByRole('button', { name: /send/i }));

        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent('no remaining credits')
        );

        expect(mockFns.GPT35Turbo).toHaveBeenCalled();
        expect(screen.getAllByText(/no remaining credits/i).length).toBeGreaterThanOrEqual(1);
    });
});
