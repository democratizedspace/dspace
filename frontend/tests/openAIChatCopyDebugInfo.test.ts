import { render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getDocsRagMeta = vi.hoisted(() => vi.fn());

vi.mock('../src/utils/docsRag.js', async () => {
    const actual = await vi.importActual('../src/utils/docsRag.js');
    return {
        ...actual,
        getDocsRagMeta,
    };
});

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        openAI: {},
        settings: {
            showChatDebugPayload: true,
            showQuestGraphVisualizer: false,
        },
    })),
    ready: Promise.resolve(),
    state: {
        subscribe: vi.fn(() => () => {}),
    },
}));

vi.mock('../src/data/npcPersonas.js', () => ({
    npcPersonas: [
        {
            id: 'dchat',
            name: 'D-Chat',
            avatar: '',
            systemPrompt: 'system prompt',
            welcomeMessage: 'hello',
            summary: 'summary',
        },
    ],
}));

import OpenAIChat from '../src/pages/chat/svelte/OpenAIChat.svelte';

describe('OpenAIChat debug copy button', () => {
    let originalLocation;
    let originalViteSha;
    let originalClipboard;

    beforeEach(() => {
        originalLocation = window.location;
        originalViteSha = process.env.VITE_GIT_SHA;
        originalClipboard = window.navigator.clipboard;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                host: 'staging.democratized.space',
                hash: '',
                search: '',
                href: 'https://staging.democratized.space/chat',
            },
        });
        Object.defineProperty(window.navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
    });

    afterEach(() => {
        getDocsRagMeta.mockReset();
        if (originalViteSha === undefined) {
            delete process.env.VITE_GIT_SHA;
        } else {
            process.env.VITE_GIT_SHA = originalViteSha;
        }
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation,
        });
        Object.defineProperty(window.navigator, 'clipboard', {
            configurable: true,
            value: originalClipboard,
        });
    });

    it('copies deterministic debug values without missing placeholders', async () => {
        process.env.VITE_GIT_SHA = 'abc123def';
        getDocsRagMeta.mockResolvedValue({
            docsGitSha: 'def456789',
            envName: 'staging',
            sourceRef: 'docs-pack-2024',
            generatedAt: '2024-09-01T00:00:00Z',
        });

        render(OpenAIChat);

        const docsShaLabel = await screen.findByText('Docs RAG SHA');
        const docsShaRow = docsShaLabel.closest('.debug-meta-row');
        await waitFor(() => {
            expect(docsShaRow?.textContent).toContain('def456789');
        });

        const button = await screen.findByTestId('debug-copy-button');
        button.click();

        await waitFor(() => {
            expect(window.navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
        });

        const copiedText = window.navigator.clipboard.writeText.mock.calls[0][0];

        expect(copiedText).toContain('Prompt version: v3:abc123d');
        expect(copiedText).toContain('App build SHA: abc123def');
        expect(copiedText).toContain('Docs RAG SHA: def456789');
        expect(copiedText).toContain('Docs host: staging.democratized.space');
        expect(copiedText).toContain('Docs RAG comparison: ⚠️ mismatch');
        expect(copiedText).not.toContain('missing');
    });
});
