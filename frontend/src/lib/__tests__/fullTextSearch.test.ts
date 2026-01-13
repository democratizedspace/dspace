import { describe, expect, it } from 'vitest';

import {
    extractSnippet,
    findDocSnippet,
    parseDocsQuery,
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

    it('normalizes, splits, and sorts keywords', () => {
        expect(parseDocsQuery('  turbine  solar ')).toEqual({
            normalized: 'turbine solar',
            operators: [],
            keywords: ['solar', 'turbine'],
            isHasPredicate: false,
        });
    });

    it('detects has: predicates while keeping keywords', () => {
        expect(parseDocsQuery('has:foo turbine')).toEqual({
            normalized: 'has:foo turbine',
            operators: ['foo'],
            keywords: ['turbine'],
            isHasPredicate: true,
        });
    });
});

describe('extractSnippet', () => {
    it('handles matches at the start of the text', () => {
        expect(extractSnippet('Solar power can scale.', 'solar')).toEqual({
            before: [],
            match: 'Solar',
            after: ['power', 'can'],
        });
    });

    it('handles matches at the end of the text', () => {
        expect(extractSnippet('We love wind turbines', 'turbine')).toEqual({
            before: ['love', 'wind'],
            match: 'turbines',
            after: [],
        });
    });

    it('matches case-insensitively while preserving casing', () => {
        expect(extractSnippet('Wind Turbines are reliable', 'turbine')).toEqual({
            before: ['Wind'],
            match: 'Turbines',
            after: ['are', 'reliable'],
        });
    });
});

describe('findDocSnippet', () => {
    it('chooses the first alphabetical keyword and first occurrence', () => {
        const doc = {
            title: 'Solar power',
            bodyText: 'Solar arrays work. Wind turbines are another option.',
        };

        expect(findDocSnippet(doc, ['turbine', 'solar'])).toEqual({
            keyword: 'solar',
            snippet: {
                before: [],
                match: 'Solar',
                after: ['arrays', 'work.'],
            },
        });
    });
});
