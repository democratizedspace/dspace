/** @jest-environment node */
import { register } from '../src/utils/metrics.js';
import { describe, it, expect } from '@jest/globals';

describe('metrics utils', () => {
    it('exposes a Registry instance', () => {
        expect(typeof register.metrics).toBe('function');
        expect(typeof register.contentType).toBe('string');
    });
});
