import { describe, expect, it } from 'vitest';
import { formatDialogue } from '../src/utils/formatDialogue';

describe('formatDialogue', () => {
    it('renders newlines and inline code while escaping HTML', () => {
        const formatted = formatDialogue('Run `npm test`\n<img src=x onerror=alert(1)>');

        expect(formatted).toContain('<code>npm test</code>');
        expect(formatted).toContain('<br />');
        expect(formatted).toContain('&lt;img src=x onerror=alert(1)&gt;');
        expect(formatted).not.toContain('<img');
    });

    it('keeps single-line inline code inline even when surrounded by line breaks', () => {
        const formatted = formatDialogue('Scopes:\n`gist`\nfor sync, plus\n`repo`\nfor submissions.');

        expect(formatted).toContain('Scopes: <code>gist</code> for sync, plus <code>repo</code>');
        expect(formatted).not.toContain('<br /><code>gist</code><br />');
        expect(formatted).not.toContain('<br /><code>repo</code><br />');
    });

    it('renders fenced multiline code as a code block', () => {
        const formatted = formatDialogue('Copy this:\n```line one\nline two```\nThen continue.');

        expect(formatted).toContain('<pre><code>line one\nline two</code></pre>');
        expect(formatted).toContain('<br />Then continue.');
    });
});
