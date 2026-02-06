/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import OpenAIChat from '../src/pages/chat/svelte/OpenAIChat.svelte';
import { copyToClipboard } from '../src/utils/copyToClipboard.js';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({ settings: { showChatDebugPayload: true } })),
    ready: Promise.resolve(),
    state: { subscribe: () => () => {} },
}));

vi.mock('../src/utils/buildInfo.js', async () => {
    const actual = await vi.importActual('../src/utils/buildInfo.js');
    return {
        ...actual,
        getAppGitSha: vi.fn(() => 'abc1234'),
        getAppGitShaWithFallback: vi.fn(() => ({ sha: 'abc1234', source: 'vite' })),
    };
});

vi.mock('../src/utils/docsRag.js', async () => {
    const actual = await vi.importActual('../src/utils/docsRag.js');
    return {
        ...actual,
        getDocsRagMeta: vi.fn(() =>
            Promise.resolve({
                docsGitSha: 'def5678',
                envName: 'staging',
                sourceRef: 'main',
                generatedAt: '2024-01-01T00:00:00Z',
            })
        ),
    };
});

vi.mock('../src/utils/copyToClipboard.js', () => ({
    copyToClipboard: vi.fn(() => Promise.resolve()),
}));

describe('OpenAIChat debug copy', () => {
    it('copies debug info without missing placeholders', async () => {
        const { findByTestId } = render(OpenAIChat);
        const button = await findByTestId('debug-copy-button');
        await fireEvent.click(button);

        expect(copyToClipboard).toHaveBeenCalledTimes(1);
        const copiedText = copyToClipboard.mock.calls[0][0];
        expect(copiedText).toContain('App build SHA: abc1234');
        expect(copiedText).toContain('Docs RAG SHA: def5678');
        expect(copiedText).not.toContain('missing');
    });
});
