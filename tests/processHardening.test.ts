import { describe, it, expect } from 'vitest';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import hardening from '../common/hardening.js';

const { validateHardening, evaluateProcessQuality } = hardening;

describe('process hardening metadata', () => {
    it('includes a normalized hardening block for every process', () => {
        for (const proc of processes as Array<any>) {
            expect(proc.hardening).toBeDefined();
            const errors = validateHardening(proc.hardening);
            expect(errors).toEqual([]);
            expect(proc.hardening.passes).toBe(proc.hardening.history.length);
            const evaluationScore = evaluateProcessQuality(proc);
            expect(proc.hardening.score).toBeGreaterThanOrEqual(evaluationScore);
        }
    });
});
