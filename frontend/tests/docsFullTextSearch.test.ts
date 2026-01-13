import { describe, expect, it } from 'vitest';

import { extractSnippet, findDocSnippet, parseDocsQuery } from '../src/utils/docsFullTextSearch.js';

describe('docs full-text search helpers', () => {
    it('parses keywords and detects has: predicates', () => {
        expect(parseDocsQuery('')).toEqual({
            normalized: '',
            operators: [],
            keywords: [],
            isHasPredicate: false,
        });

        expect(parseDocsQuery(' turbine  solar ')).toEqual({
            normalized: 'turbine solar',
            operators: [],
            keywords: ['solar', 'turbine'],
            isHasPredicate: false,
        });

        const parsed = parseDocsQuery('has:link turbine');
        expect(parsed.isHasPredicate).toBe(true);
        expect(parsed.operators).toEqual(['link']);
        expect(parsed.keywords).toEqual(['turbine']);
    });

    it('extracts snippets with up to two words of context', () => {
        const text = 'Wind turbines are also available for power.';

        expect(extractSnippet(text, 'turbine')).toEqual({
            before: ['Wind'],
            match: 'turbines',
            after: ['are', 'also'],
        });

        expect(extractSnippet(text, 'wind')).toEqual({
            before: [],
            match: 'Wind',
            after: ['turbines', 'are'],
        });

        expect(extractSnippet(text, 'power')).toEqual({
            before: ['also', 'available'],
            match: 'power',
            after: [],
        });
    });

    it('selects snippet keyword deterministically', () => {
        const doc = { bodyText: 'Solar arrays pair with wind turbines in many builds.' };

        const snippet = findDocSnippet(doc, ['turbine', 'solar']);

        expect(snippet?.keyword).toBe('solar');
        expect(snippet?.snippet.match).toBe('Solar');
        expect(snippet?.snippet.after).toEqual(['arrays', 'pair']);
    });
});
