import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import Integrations from '../Integrations.svelte';
import { TokenPlaceChatV2 } from '../../../../utils/tokenPlace.js';

vi.mock('svelte/transition', () => ({
    fade: () => ({ duration: 0 }),
}));

const mockTokenPlaceChatV2 = vi.hoisted(() => vi.fn());

const mockRefs = vi.hoisted(() => ({
    baseState: {
        openAI: { apiKey: '' },
        settings: { chatProvider: 'token-place' },
        tokenPlace: undefined,
    },
    resetStore: () => undefined,
    state: null,
}));

vi.mock('../../../../utils/tokenPlace.js', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../../../utils/tokenPlace.js')>()),
    TokenPlaceChatV2: mockTokenPlaceChatV2,
}));

vi.mock('../../../../utils/gameState/common.js', async () => {
    const { writable } = await import('svelte/store');
    const store = writable(structuredClone(mockRefs.baseState));
    mockRefs.state = store;
    mockRefs.resetStore = () => store.set(structuredClone(mockRefs.baseState));

    return {
        loadGameState: vi.fn(() => structuredClone(mockRefs.baseState)),
        ready: Promise.resolve(),
        state: store,
    };
});

describe('Integrations chat entrypoint', () => {
    beforeEach(() => {
        mockRefs.baseState.openAI.apiKey = '';
        mockRefs.baseState.settings = { chatProvider: 'token-place' };
        mockRefs.resetStore();
        delete process.env.VITE_TOKEN_PLACE_URL;
        mockTokenPlaceChatV2.mockResolvedValue({
            text: 'runtime route reply',
            contextSources: [],
            usage: null,
            metadata: null,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders token.place chat by default without the deferred banner', async () => {
        render(Integrations);

        await waitFor(() =>
            expect(
                document.querySelector('[data-testid="chat-panel"][data-provider="token-place"]')
            ).toBeInTheDocument()
        );
        expect(
            document.querySelector('[data-testid="chat-panel"][data-provider="openai"]')
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('token-place-disabled-banner')).not.toBeInTheDocument();
        expect(
            document.querySelectorAll('[data-testid="chat-panel"][data-provider="token-place"]')
        ).toHaveLength(1);
        expect(screen.getByTestId('chat-provider-label')).toHaveTextContent(
            'Powered by token.place'
        );
        expect(screen.getByLabelText('Talk to')).toBeInTheDocument();
        expect(document.querySelector('.persona-summary')).toBeInTheDocument();
        expect(screen.queryByText(/OpenAI API Key/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/OpenAI.?API.?Key.?Settings/i)).not.toBeInTheDocument();
    });

    it('passes runtime token.place configuration into the hydrated chat panel', async () => {
        render(Integrations, {
            props: {
                tokenPlace: {
                    url: 'https://staging.token.place',
                    model: 'staging-chat-model',
                },
            },
        });

        await waitFor(() =>
            expect(
                document.querySelector('[data-testid="chat-panel"][data-provider="token-place"]')
            ).toBeInTheDocument()
        );
        await fireEvent.input(screen.getByRole('textbox'), {
            target: { value: 'Use runtime config' },
        });
        await fireEvent.click(screen.getByRole('button', { name: 'Send' }));

        await waitFor(() => expect(TokenPlaceChatV2).toHaveBeenCalled());
        expect(TokenPlaceChatV2).toHaveBeenCalledWith(
            expect.any(Array),
            expect.objectContaining({
                runtimeUrl: 'https://staging.token.place',
                runtimeModel: 'staging-chat-model',
            })
        );
    });

    it('renders OpenAI chat for users who select OpenAI and have an existing OpenAI API key', async () => {
        mockRefs.baseState.openAI.apiKey = 'sk-test';
        mockRefs.baseState.settings = { chatProvider: 'openai' };
        mockRefs.resetStore();

        render(Integrations);

        await waitFor(() =>
            expect(
                document.querySelector('[data-testid="chat-panel"][data-provider="openai"]')
            ).toBeInTheDocument()
        );
        expect(
            document.querySelector('[data-testid="chat-panel"][data-provider="token-place"]')
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('token-place-disabled-banner')).not.toBeInTheDocument();
    });
});
