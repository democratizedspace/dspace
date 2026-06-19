import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import Integrations from '../Integrations.svelte';

vi.mock('svelte/transition', () => ({
    fade: () => ({ duration: 0 }),
}));

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
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('passes token.place runtime config into the hydrated chat panel debug view', async () => {
        mockRefs.baseState.settings = {
            chatProvider: 'token-place',
            showChatDebugPayload: true,
        };
        mockRefs.resetStore();

        render(Integrations, {
            props: {
                tokenPlace: { url: 'https://staging.token.place', model: 'staging-model' },
            },
        });

        await waitFor(() =>
            expect(screen.getByTestId('debug-token-place-url-row')).toHaveTextContent(
                'https://staging.token.place'
            )
        );
        expect(screen.getByTestId('debug-token-place-model-row')).toHaveTextContent(
            'staging-model'
        );
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
