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
        mockRefs.resetStore();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_ENABLED;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders token.place chat by default without the deferred banner while keeping OpenAI settings reachable', async () => {
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
        await waitFor(() => expect(screen.getByText(/OpenAI API Key/i)).toBeInTheDocument());
    });

    it('renders OpenAI chat for users with an existing OpenAI API key', async () => {
        mockRefs.baseState.openAI.apiKey = 'sk-test';
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
