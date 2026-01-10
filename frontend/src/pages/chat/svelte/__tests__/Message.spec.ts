import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Message from '../Message.svelte';

vi.mock('svelte/transition', () => ({
    fade: () => ({ duration: 0 }),
}));

describe('Chat message bubble', () => {
    it('renders an avatar and role metadata for assistant messages', () => {
        render(Message, {
            messageMarkdown: 'Hello there',
            className: 'assistant',
            timestamp: Date.now(),
            avatarUrl: '/assets/npc/dChat.jpg',
            avatarAlt: 'dChat avatar',
        });

        expect(screen.getByAltText('dChat avatar')).toBeInTheDocument();
        const bubble = screen.getByTestId('chat-message-bubble');
        expect(bubble).toHaveAttribute('data-role', 'assistant');
    });
});
