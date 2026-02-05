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

vi.mock('../src/utils/dchatKnowledge.js', () => ({
    buildDchatKnowledge: vi.fn(() => 'knowledge'),
    buildDchatKnowledgePack: vi.fn(() => ({ summary: 'knowledge', sources: [] })),
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
import { activePersonaId, messages } from '../src/stores/chat.js';

const setHost = (host: string) => {
    Object.defineProperty(window, 'location', {
        value: new URL(`https://${host}`),
        writable: true,
    });
};

describe('OpenAIChat debug sync status', () => {
    beforeEach(() => {
        messages.set([]);
        activePersonaId.set('dchat');
        setHost('staging.democratized.space');
    });

    afterEach(() => {
        delete process.env.VITE_GIT_SHA;
        getDocsRagMeta.mockReset();
    });

    it('shows cannot verify when app SHA is missing on staging', async () => {
        delete process.env.VITE_GIT_SHA;
        getDocsRagMeta.mockResolvedValue({
            docsGitSha: 'abc123',
            sourceRef: 'main',
            generatedAt: 'today',
        });

        render(OpenAIChat);

        await waitFor(() => {
            expect(
                screen.getByText('⚠️ cannot verify app/docs sync (app SHA missing)')
            ).toBeTruthy();
        });
    });

    it('shows in sync when staging SHAs match', async () => {
        process.env.VITE_GIT_SHA = 'abc123';
        getDocsRagMeta.mockResolvedValue({
            docsGitSha: 'abc123',
            sourceRef: 'main',
            generatedAt: 'today',
        });

        render(OpenAIChat);

        await waitFor(() => {
            expect(screen.getByText(/✅ in sync/)).toBeTruthy();
        });
    });

    it('shows mismatch when staging SHAs differ', async () => {
        process.env.VITE_GIT_SHA = 'abc123';
        getDocsRagMeta.mockResolvedValue({
            docsGitSha: 'def456',
            sourceRef: 'main',
            generatedAt: 'today',
        });

        render(OpenAIChat);

        await waitFor(() => {
            expect(
                screen.getByText('⚠️ mismatch (app: abc123, docs: def456)')
            ).toBeTruthy();
        });
    });
});
