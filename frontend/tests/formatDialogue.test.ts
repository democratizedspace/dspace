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
        const codeSegments = formatted.match(/<code[^>]*>.*?<\/code>/g) ?? [];

        expect(formatted).toContain('<code>gist</code>');
        expect(formatted).toContain('<code>repo</code>');
        expect(codeSegments.every((segment) => !segment.includes('<br />'))).toBe(true);
    });

    it('does not emit line breaks before or after inline code spans', () => {
        const formatted = formatDialogue('Scopes (\n`gist`\nfor sync and\n`repo`\nfor submissions).');

        expect(formatted).toContain('Scopes ( <code>gist</code> for sync and <code>repo</code>');
        expect(formatted).not.toContain('(<br /><code>gist</code>');
        expect(formatted).not.toContain('</code><br />for sync');
        expect(formatted).not.toContain('and<br /><code>repo</code>');
        expect(formatted).not.toContain('</code><br />for submissions');
    });

    it('preserves non-newline whitespace inside inline code spans', () => {
        const formatted = formatDialogue('Run `npm   run\ttest` now.');

        expect(formatted).toContain('<code>npm   run\ttest</code>');
    });

    it('renders fenced multiline code blocks with preserved newlines', () => {
        const formatted = formatDialogue('Use this:\n```\nline 1\nline 2\n```\nDone.');

        expect(formatted).toContain('<pre><code>line 1\nline 2</code></pre>');
        expect(formatted).toContain('Use this:<br />');
        expect(formatted).toContain('<br />Done.');
    });

    it('renders fenced code blocks with a language class and preserved newlines', () => {
        const formatted = formatDialogue('```bash\nnpm test\nnpm run lint\n```');

        expect(formatted).toContain(
            '<pre><code class="language-bash">npm test\nnpm run lint</code></pre>'
        );
    });

    it('keeps inner triple-backticks when they are not on a fence-closing line', () => {
        const formatted = formatDialogue('```\nconst sample = "```";\nconsole.log(sample);\n```');

        expect(formatted).toContain(
            '<pre><code>const sample = &quot;```&quot;;\nconsole.log(sample);</code></pre>'
        );
    });

    it('converts CRLF newlines to br tags without leaving carriage returns', () => {
        const formatted = formatDialogue('Line 1\r\nLine 2\r\n`code\r\nspan`');

        expect(formatted).toContain('Line 1<br />Line 2<br />');
        expect(formatted).toContain('<code>code span</code>');
        expect(formatted).not.toContain('\r');
    });
});
