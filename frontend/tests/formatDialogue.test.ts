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

    it('keeps connect-github steps scope tokens inline', () => {
        const formatted = formatDialogue(
            'grant only the required scopes (`gist` for cloud sync, plus `repo` if you also want to use this token for quest submissions), copy it once'
        );
        const codeSegments = formatted.match(/<code[^>]*>.*?<\/code>/g) ?? [];

        expect(formatted).toContain('scopes (<code>gist</code> for cloud sync');
        expect(formatted).toContain('<code>gist</code> for cloud sync, plus <code>repo</code> if');
        expect(formatted).toContain('plus <code>repo</code> if you also want');
        expect(codeSegments.every((segment) => !segment.includes('<br />'))).toBe(true);
        expect(formatted).not.toContain('<br /><code>gist</code>');
        expect(formatted).not.toContain('<code>gist</code><br />');
        expect(formatted).not.toContain('<br /><code>repo</code>');
        expect(formatted).not.toContain('<code>repo</code><br />');
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
