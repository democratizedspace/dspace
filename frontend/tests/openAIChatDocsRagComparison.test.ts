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

describe('OpenAIChat docs RAG comparison messaging', () => {
    let originalLocation;
    let originalViteSha;

    beforeEach(() => {
        originalLocation = window.location;
        originalViteSha = process.env.VITE_GIT_SHA;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                host: 'staging.democratized.space',
                hash: '',
                search: '',
                href: 'https://staging.democratized.space/chat',
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
    });

    const expectComparisonMessage = async (expected: RegExp | string) => {
        render(OpenAIChat);
        const label = await screen.findByText('Docs RAG comparison');
        const row = label.closest('.debug-meta-row');
        await waitFor(() => {
            expect(row).toBeTruthy();
            expect(row).toHaveTextContent(expected);
        });
    };

    it('shows cannot-verify when app SHA is missing on staging', async () => {
        delete process.env.VITE_GIT_SHA;
        getDocsRagMeta.mockResolvedValue({
            docsGitSha: 'abc123',
            envName: 'staging',
        });

        await expectComparisonMessage('⚠️ cannot verify app/docs sync (app SHA missing)');
    });

    it('shows cannot-verify when docs SHA is missing on staging', async () => {
        process.env.VITE_GIT_SHA = 'abc123def';
        getDocsRagMeta.mockResolvedValue({
            docsGitSha: 'unknown',
            envName: 'staging',
        });

        await expectComparisonMessage('⚠️ cannot verify app/docs sync (docs SHA missing)');
    });

    it('shows in-sync when staging SHAs are real and matching', async () => {
        process.env.VITE_GIT_SHA = 'abc123def';
        getDocsRagMeta.mockResolvedValue({
            docsGitSha: 'abc123def',
            envName: 'staging',
        });

        await expectComparisonMessage('✅ in sync');
    });

    it('shows mismatch when staging SHAs are real and different', async () => {
        process.env.VITE_GIT_SHA = 'abc123def';
        getDocsRagMeta.mockResolvedValue({
            docsGitSha: 'def456',
            envName: 'staging',
        });

        await expectComparisonMessage(/⚠️ mismatch/);
    });
});
