import { describe, expect, it } from 'vitest';
import { formatDialogue } from '../src/utils/formatDialogue';

describe('formatDialogue', () => {
    it('keeps inline code inline while escaping HTML', () => {
        const formatted = formatDialogue(
            'Use (`gist`\nfor cloud sync, plus\n`repo`)\n<img src=x onerror=alert(1)>'
        );

        expect(formatted).toContain('<code>gist</code>');
        expect(formatted).toContain('<code>repo</code>');
        expect(formatted).not.toContain('<code>\n');
        expect(formatted).not.toContain('<code>gist</code><br />');
        expect(formatted).not.toContain('<br /><code>repo</code>');
        expect(formatted).toContain('<br />&lt;img src=x onerror=alert(1)&gt;');
        expect(formatted).toContain('&lt;img src=x onerror=alert(1)&gt;');
        expect(formatted).not.toContain('<img');
    });

    it('renders multiline code fences as code blocks with line breaks', () => {
        const formatted = formatDialogue('Run this:\n```npm ci\nnpm test```');

        expect(formatted).toContain('<pre><code>npm ci<br />npm test</code></pre>');
    });
});
