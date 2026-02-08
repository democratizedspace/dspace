import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import Integrations from '../Integrations.svelte';

vi.mock('svelte/transition', () => ({
    fade: () => ({ duration: 0 }),
}));

const mockRefs = vi.hoisted(() => ({
    baseState: {
        openAI: { apiKey: 'sk-test' },
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
        mockRefs.resetStore();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_ENABLED;
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: false, json: async () => ({}) }))
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it('renders OpenAI chat and hides token.place by default', async () => {
        render(Integrations);

        await waitFor(() =>
            expect(
                document.querySelector('[data-testid="chat-panel"][data-provider="openai"]')
            ).toBeInTheDocument()
        );
        expect(
            document.querySelector('[data-testid="chat-panel"][data-provider="token-place"]')
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('token-place-disabled-banner')).toBeInTheDocument();
    });
});
