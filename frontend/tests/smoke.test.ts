import { describe, it, expect } from 'vitest';

// Minimal test to ensure frontend test suite runs at least once.
describe('frontend smoke test', () => {
    it('executes a basic assertion', () => {
        expect(true).toBe(true);
    });
});
