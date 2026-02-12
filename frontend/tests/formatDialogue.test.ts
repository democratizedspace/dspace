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

    it('keeps inline code inline when source contains line breaks around tokens', () => {
        const formatted = formatDialogue('Scopes: (`\ngist\n`, plus `\nrepo\n`) are enough.');

        expect(formatted).toContain('<code>gist</code>');
        expect(formatted).toContain('<code>repo</code>');
        expect(formatted).not.toContain('<code><br');
    });

    it('renders fenced multiline code blocks with preserved newlines', () => {
        const formatted = formatDialogue('Use this:\n```\nline 1\nline 2\n```\nDone.');

        expect(formatted).toContain('<pre><code>line 1\nline 2</code></pre>');
        expect(formatted).toContain('Use this:<br />');
        expect(formatted).toContain('<br />Done.');
    });
});
