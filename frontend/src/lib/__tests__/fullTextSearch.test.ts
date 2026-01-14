import { describe, expect, it } from 'vitest';

import {
    extractSnippet,
    findDocSnippet,
    parseDocsQuery,
    stripMarkdownToText,
} from '../docs/fullTextSearch';

describe('parseDocsQuery', () => {
    it('returns empty keywords for blank input', () => {
        expect(parseDocsQuery('')).toEqual({
            normalized: '',
            operators: [],
            keywords: [],
            isHasPredicate: false,
        });
    });

    it('normalizes, de-duplicates, and sorts keywords', () => {
        const parsed = parseDocsQuery(' turbine  solar  turbine ');

        expect(parsed.keywords).toEqual(['solar', 'turbine']);
        expect(parsed.isHasPredicate).toBe(false);
    });

    it('detects has: predicates while keeping keywords', () => {
        const parsed = parseDocsQuery('has:link turbine');

        expect(parsed.isHasPredicate).toBe(true);
        expect(parsed.operators).toEqual(['link']);
        expect(parsed.keywords).toEqual(['turbine']);
    });
});

describe('extractSnippet', () => {
    it('returns up to two words around the first match', () => {
        const snippet = extractSnippet('Wind turbines are also available', 'turbine');

        expect(snippet).toEqual({
            before: ['Wind'],
            match: 'turbines',
            after: ['are', 'also'],
        });
    });

    it('handles matches at the start boundary', () => {
        const snippet = extractSnippet('Solar power is reliable', 'solar');

        expect(snippet).toEqual({
            before: [],
            match: 'Solar',
            after: ['power', 'is'],
        });
    });

    it('handles matches at the end boundary', () => {
        const snippet = extractSnippet('Use solar power', 'power');

        expect(snippet).toEqual({
            before: ['Use', 'solar'],
            match: 'power',
            after: [],
        });
    });

    it('captures punctuation-heavy keywords', () => {
        const snippet = extractSnippet('Use Node.js for the build-time guide.', 'node.js');

        expect(snippet).toEqual({
            before: ['Use'],
            match: 'Node.js',
            after: ['for', 'the'],
        });
    });

    it('preserves punctuation on matched tokens while skipping separator-only tokens', () => {
        const snippet = extractSnippet('a wind turbine. | — 130 dUSD', 'turbine');

        expect(snippet).toEqual({
            before: ['a', 'wind'],
            match: 'turbine.',
            after: ['130', 'dUSD'],
        });
        expect(snippet?.before).not.toContain('|');
        expect(snippet?.after).not.toContain('—');
    });
});

describe('findDocSnippet', () => {
    it('selects the first alphabetical keyword with a match', () => {
        const doc = {
            title: 'Solar Power',
            bodyText: 'Solar arrays pair with wind turbines for constant power.',
        };

        const snippet = findDocSnippet(doc, ['turbine', 'solar']);

        expect(snippet?.keyword).toBe('solar');
        expect(snippet?.snippetHtml).toContain('<strong>Solar</strong>');
        expect(snippet?.snippetText).toBe('Solar arrays pair');
    });

    it('returns a plain-text snippet for punctuation-heavy matches', () => {
        const doc = {
            title: 'Docs search',
            bodyText:
                'Example long URL: https://github.com/democratizedspace/dspace/blob/v3/frontend/src/components/' +
                'svelte/DocsIndex.svelte for reference.',
        };

        const snippet = findDocSnippet(doc, ['github']);

        expect(snippet?.snippetText).toBe(
            'long URL: https://github.com/democratizedspace/dspace/blob/v3/frontend/src/components/' +
                'svelte/DocsIndex.svelte for reference.'
        );
    });
});

describe('stripMarkdownToText', () => {
    it('removes frontmatter, code blocks, and inline code', () => {
        const markdown = `---
title: Demo
---

\`\`\`js
console.log('skip');
\`\`\`

Use \`inline\` examples.`;

        expect(stripMarkdownToText(markdown)).toBe('Use examples.');
    });

    it('keeps link and image text while stripping markup', () => {
        const markdown = `
![Alt text](image.png)
[Link Label](https://example.com)
`;

        expect(stripMarkdownToText(markdown)).toBe('Alt text Link Label');
    });

    it('strips html tags, headings, blockquotes, and emphasis markers', () => {
        const markdown = `
# Heading
> Quote with *emphasis* and **bold** text.
<span>HTML</span>
`;

        expect(stripMarkdownToText(markdown)).toBe(
            'Heading Quote with emphasis and bold text. HTML'
        );
    });
});
