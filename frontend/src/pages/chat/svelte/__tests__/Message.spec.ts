import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Message from '../Message.svelte';

describe('Message', () => {
    it('renders message content with overflow wrapping styles', () => {
        const longMessage = 'A'.repeat(300);
        render(Message, {
            messageMarkdown: longMessage,
            className: 'assistant',
            timestamp: Date.now(),
            avatarUrl: '/assets/npc/dChat.jpg',
            avatarAlt: 'NPC avatar',
        });

        const messageElement = screen.getByText(longMessage);
        expect(messageElement).toBeInTheDocument();
        expect(screen.getByAltText('NPC avatar')).toBeInTheDocument();

        const messageBody = messageElement.closest('.message-body');
        expect(messageBody).not.toBeNull();

        const styleTag = Array.from(document.querySelectorAll('style')).find((style) =>
            style.textContent?.includes('.message-body')
        );

        expect(styleTag).toBeDefined();

        const styleText = styleTag?.textContent ?? '';
        expect(styleText).toMatch(/overflow-wrap:\s*anywhere/);
        expect(styleText).toMatch(/word-break:\s*break-word/);
        expect(styleText).toMatch(/white-space:\s*pre-wrap/);
    });
});
