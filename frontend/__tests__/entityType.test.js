/**
 * @jest-environment jsdom
 */

/**
 * Tests for getStoreForEntityType function
 */

// Import the actual function from the indexeddb.js file for proper testing
import { getStoreForEntityType } from '../src/utils/indexeddb.js';

describe('getStoreForEntityType', () => {
    test('returns correct store name for quest entity type', () => {
        expect(getStoreForEntityType('quest')).toBe('quests');
    });

    test('returns correct store name for item entity type', () => {
        expect(getStoreForEntityType('item')).toBe('items');
    });

    test('returns correct store name for process entity type', () => {
        expect(getStoreForEntityType('process')).toBe('processes');
    });

    test('throws error for unknown entity type', () => {
        expect(() => {
            getStoreForEntityType('unknown');
        }).toThrow('Unknown entity type: unknown');
    });
});
