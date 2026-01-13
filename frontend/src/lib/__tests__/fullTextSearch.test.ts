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
