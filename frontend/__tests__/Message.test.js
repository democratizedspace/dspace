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
});
