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

        const styleRules = Array.from(document.styleSheets).flatMap((sheet) => {
            try {
                return Array.from(sheet.cssRules);
            } catch {
                return [];
            }
        });
        const messageBodyRule = styleRules.find(
            (rule) =>
                rule instanceof CSSStyleRule &&
                typeof rule.selectorText === 'string' &&
                rule.selectorText.includes('.message-body')
        ) as CSSStyleRule | undefined;

        expect(messageBodyRule).toBeDefined();
        expect(messageBodyRule?.style.getPropertyValue('overflow-wrap')).toBe('anywhere');
        expect(messageBodyRule?.style.getPropertyValue('word-break')).toBe('break-word');
        expect(messageBodyRule?.style.getPropertyValue('white-space')).toBe('pre-wrap');
    });
});
