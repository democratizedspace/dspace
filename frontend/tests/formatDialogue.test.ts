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
});
