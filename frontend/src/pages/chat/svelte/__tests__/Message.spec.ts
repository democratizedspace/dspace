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
        const computedStyle = getComputedStyle(messageBody as HTMLElement);
        const overflowWrap =
            computedStyle.overflowWrap || computedStyle.getPropertyValue('overflow-wrap');
        expect(overflowWrap).toBe('anywhere');
        expect(computedStyle.wordBreak).toBe('break-word');
        expect(computedStyle.whiteSpace).toBe('pre-wrap');
    });
});
