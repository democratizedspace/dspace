/** @jest-environment jsdom */
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import Message from '../src/pages/chat/svelte/Message.svelte';

describe('Message component', () => {
    it('sanitizes dangerous markdown', () => {
        const { container } = render(Message, {
            messageMarkdown:
                '<img src=x onerror="window.hacked=1">' + '<script>window.hacked=2</script>',
            className: 'user',
            timestamp: Date.now(),
        });
        expect(container.querySelector('script')).toBeNull();
        const img = container.querySelector('img');
        expect(img).not.toHaveAttribute('onerror');
        expect(window).not.toHaveProperty('hacked');
    });

    it('renders copy button with accessible label', () => {
        const { container } = render(Message, {
            messageMarkdown: '```js\nconsole.log("hi")\n```',
            className: 'assistant',
            timestamp: Date.now(),
        });
        const button = container.querySelector('.copy-button');
        expect(button).toHaveAttribute('aria-label', 'Copy code to clipboard');
    });

    it('announces copy success with a status toast', async () => {
        const { container } = render(Message, {
            messageMarkdown: '```js\nconsole.log("hi")\n```',
            className: 'assistant',
            timestamp: Date.now(),
        });
        const button = container.querySelector('.copy-button');
        await button.click();
        const toast = container.querySelector('.toast');
        expect(toast).toHaveAttribute('role', 'status');
        expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('renders an avatar for assistant messages when provided', () => {
        const { container } = render(Message, {
            messageMarkdown: 'Hello there!',
            className: 'assistant',
            timestamp: Date.now(),
            avatarUrl: '/assets/npc/example.png',
            avatarAlt: 'Example portrait',
        });
        const avatar = container.querySelector('img.avatar');
        expect(avatar).toHaveAttribute('src', '/assets/npc/example.png');
        expect(avatar).toHaveAttribute('alt', 'Example portrait');
        expect(avatar).toHaveAttribute('role', 'img');
    });

    it('does not render an avatar image for user messages', () => {
        const { container } = render(Message, {
            messageMarkdown: 'Hello there!',
            className: 'user',
            timestamp: Date.now(),
            avatarUrl: '/assets/npc/example.png',
            avatarAlt: 'Example portrait',
        });
        expect(container.querySelector('img.avatar')).toBeNull();
    });
});
