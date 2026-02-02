import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockRefs = vi.hoisted(() => ({
    baseState: {
        settings: {
            showChatDebugPayload: true,
        },
        openAI: {},
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

vi.mock('../../../../utils/docsRag.js', async () => {
    const actual = await vi.importActual('../../../../utils/docsRag.js');
    return {
        ...actual,
        getDocsRagMeta: vi.fn(async () => ({
            gitSha: 'abc123',
            generatedAt: '2025-01-01T00:00:00Z',
        })),
    };
});

describe('OpenAI chat debug metadata', () => {
    beforeEach(() => {
        mockRefs.resetStore();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('stamps the app build SHA and prompt version from VITE_GIT_SHA', async () => {
        vi.stubEnv('VITE_GIT_SHA', 'abc123');
        vi.resetModules();

        const { default: OpenAIChat } = await import('../OpenAIChat.svelte');

        render(OpenAIChat);

        await waitFor(() => {
            expect(screen.getByTestId('chat-debug-panel')).toBeInTheDocument();
        });

        const panel = screen.getByTestId('chat-debug-panel');

        expect(panel).toHaveTextContent('App build SHA');
        expect(panel).toHaveTextContent('abc123');
        expect(panel).toHaveTextContent('Prompt version: v3:abc123');
        expect(panel).toHaveTextContent('Docs RAG matches app build.');
    });
});
