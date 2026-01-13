import { describe, expect, it } from 'vitest';

import { extractSnippet, findDocSnippet, parseDocsQuery } from '../docs/fullTextSearch';

describe('parseDocsQuery', () => {
    it('returns empty keywords for empty input', () => {
        expect(parseDocsQuery('')).toEqual({
            normalized: '',
            keywords: [],
            operators: [],
            isHasPredicate: false,
        });
    });

    it('parses keywords and sorts them alphabetically', () => {
        const parsed = parseDocsQuery('  turbine  solar ');

        expect(parsed.keywords).toEqual(['solar', 'turbine']);
        expect(parsed.isHasPredicate).toBe(false);
    });

    it('detects has: predicates while keeping keywords', () => {
        const parsed = parseDocsQuery('has:foo turbine');

        expect(parsed.isHasPredicate).toBe(true);
        expect(parsed.operators).toEqual(['foo']);
        expect(parsed.keywords).toEqual(['turbine']);
    });
});

describe('extractSnippet', () => {
    it('returns context at the start of the body', () => {
        const snippet = extractSnippet('Turbine power is here', 'turbine');

        expect(snippet).toEqual({
            before: [],
            match: 'Turbine',
            after: ['power', 'is'],
        });
    });

    it('returns context at the end of the body', () => {
        const snippet = extractSnippet('Power from wind turbine', 'turbine');

        expect(snippet).toEqual({
            before: ['from', 'wind'],
            match: 'turbine',
            after: [],
        });
    });

    it('matches case-insensitively and preserves the original word', () => {
        const snippet = extractSnippet('Wind Turbines are great', 'turbine');

        expect(snippet).toEqual({
            before: ['Wind'],
            match: 'Turbines',
            after: ['are', 'great'],
        });
    });
});

describe('findDocSnippet', () => {
    it('chooses the alphabetically first keyword and first occurrence', () => {
        const snippet = findDocSnippet(
            { title: 'Solar Power', bodyText: 'Wind turbines power solar arrays.' },
            ['turbine', 'solar']
        );

        expect(snippet?.keyword).toBe('solar');
        expect(snippet?.snippetHtml).toContain('<strong>solar</strong>');
    });
});
