import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
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

        const messageSource = readFileSync(new URL('../Message.svelte', import.meta.url), 'utf8');
        const messageBodyStyles = messageSource.match(/\.message-body\s*{[^}]*}/s);

        expect(messageBodyStyles).toBeDefined();
        expect(messageBodyStyles?.[0]).toMatch(/overflow-wrap:\s*anywhere/);
        expect(messageBodyStyles?.[0]).toMatch(/word-break:\s*break-word/);
        expect(messageBodyStyles?.[0]).toMatch(/white-space:\s*pre-wrap/);
    });
});
