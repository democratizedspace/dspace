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

        expect(screen.getByText(longMessage)).toBeInTheDocument();
        expect(screen.getByAltText('NPC avatar')).toBeInTheDocument();

        const styles = Array.from(document.querySelectorAll('style'))
            .map((style) => style.textContent || '')
            .join(' ');
        expect(styles).toContain('overflow-wrap: anywhere');
        expect(styles).toContain('word-break: break-word');
    });
});
