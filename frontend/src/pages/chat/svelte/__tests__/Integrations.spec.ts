import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import Integrations from '../Integrations.svelte';

vi.mock('svelte/transition', () => ({
    fade: () => ({ duration: 0 }),
}));

const mockTokenPlaceChatV2 = vi.hoisted(() =>
    vi.fn(async () => ({ text: 'runtime token.place reply', contextSources: [] }))
);

vi.mock('../../../../utils/tokenPlace.js', async () => {
    const actual = await vi.importActual('../../../../utils/tokenPlace.js');
    return {
        ...actual,
        TokenPlaceChatV2: mockTokenPlaceChatV2,
    };
});

const mockRefs = vi.hoisted(() => ({
    baseState: {
        openAI: { apiKey: '' },
        settings: { chatProvider: 'token-place' },
        tokenPlace: undefined,
    },
    resetStore: () => undefined,
    state: null,
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
        mockTokenPlaceChatV2.mockClear();
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

    it('passes runtime token.place deployment config into ChatPanel requests', async () => {
        render(Integrations, {
            tokenPlace: { url: 'https://staging.token.place', model: 'staging-chat-model' },
        });

        const chatPanel = await waitFor(() => {
            const panel = document.querySelector(
                '[data-testid="chat-panel"][data-provider="token-place"]'
            );
            expect(panel).toBeInTheDocument();
            return panel;
        });

        await fireEvent.input(screen.getByRole('textbox'), {
            target: { value: 'Use runtime staging token.place' },
        });
        await fireEvent.click(screen.getByRole('button', { name: 'Send' }));

        await waitFor(() => expect(mockTokenPlaceChatV2).toHaveBeenCalledTimes(1));
        expect(mockTokenPlaceChatV2.mock.calls[0][1]).toMatchObject({
            runtimeUrl: 'https://staging.token.place',
            runtimeModel: 'staging-chat-model',
        });
        expect(chatPanel).toBeInTheDocument();
    });

    it('passes the default runtime token.place URL into ChatPanel requests', async () => {
        render(Integrations, {
            tokenPlace: { url: 'https://token.place', model: 'gpt-5-chat-latest' },
        });

        await waitFor(() => {
            expect(
                document.querySelector('[data-testid="chat-panel"][data-provider="token-place"]')
            ).toBeInTheDocument();
        });

        await fireEvent.input(screen.getByRole('textbox'), {
            target: { value: 'Use production token.place' },
        });
        await fireEvent.click(screen.getByRole('button', { name: 'Send' }));

        await waitFor(() => expect(mockTokenPlaceChatV2).toHaveBeenCalledTimes(1));
        expect(mockTokenPlaceChatV2.mock.calls[0][1]).toMatchObject({
            runtimeUrl: 'https://token.place',
            runtimeModel: 'gpt-5-chat-latest',
        });
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
