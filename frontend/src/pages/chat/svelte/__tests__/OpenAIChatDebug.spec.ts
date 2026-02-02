import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mockRefs = vi.hoisted(() => ({
    baseState: {
        settings: {
            showChatDebugPayload: true,
        },
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

vi.mock('../../../../utils/docsRag.js', () => ({
    getDocsRagMeta: vi.fn(async () => ({
        gitSha: 'abc123',
        generatedAt: '2024-01-01T00:00:00Z',
    })),
    getDocsRagComparison: vi.fn(() => ({
        status: 'match',
        message: 'Docs RAG matches app build.',
    })),
}));

describe('OpenAIChat debug metadata', () => {
    beforeEach(() => {
        mockRefs.resetStore();
        process.env.VITE_GIT_SHA = 'abc123';
    });

    afterEach(() => {
        delete process.env.VITE_GIT_SHA;
        vi.clearAllMocks();
    });

    it(
        'shows the app build SHA and prompt version from VITE_GIT_SHA',
        async () => {
            const { default: OpenAIChat } = await import('../OpenAIChat.svelte');
            render(OpenAIChat);

            await waitFor(
                () => expect(screen.getByTestId('chat-debug-panel')).toBeInTheDocument(),
                {
                    timeout: 8000,
                }
            );
            const debugPanel = screen.getByTestId('chat-debug-panel');

            expect(debugPanel).toHaveTextContent('App build SHA');
            expect(debugPanel).toHaveTextContent('abc123');
            expect(debugPanel).toHaveTextContent('Prompt version: v3:abc123');
        },
        15000
    );
});
